import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import os
# Initialize logging before anything else
import app.core.logging  # noqa: F401 — triggers log handlers setup

from app.config.settings import settings
from app.database.init_db import init_db
from app.database.connection import dispose_engine
import uuid
from app.core.exceptions import GPOException, RecordNotFoundError, DuplicateKeyError, ConstraintViolationError
from app.core.response import send_error, generate_request_id
from app.services.integration_service import integration_manager
from app.db.seed_scenarios import seed_scenarios
from app.services.event_engine import event_engine
from app.services.scheduler import integration_scheduler
from app.database.connection import SessionLocal
from app.core.streaming import event_bus

# Import routers
from app.routers import auth, users, grid_assets, policies, incidents
from app.routers import notifications, reports, audit_logs, system_settings, health, digital_twin
from app.routers import substations, buses, transmission_lines, transformers, generators, loads, switches
from app.routers import engineering_api, monitoring, integration, events, alarms, ops_incidents, forecasting, optimization, ai_intelligence, scenarios, simulation, analysis, training, optimization_analytics, generation, dashboard, datasets, weather


logger = logging.getLogger("gpo.api")
perf_logger = logging.getLogger("gpo.performance")

# ──────────────────────────────────────────────────────────
# Lifespan Handler (startup + shutdown)
# ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("GPO API Gateway starting up...")
    try:
        init_db()
        logger.info("Database initialized and seeded successfully.")
        
        # Bootstrap Integration Connectors
        db = SessionLocal()
        try:
            seed_scenarios(db)
            import asyncio
            asyncio.create_task(integration_manager.bootstrap(db))
            logger.info("Integration Connectors bootstrapped successfully.")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        
    # Start background engines
    logger.info("Starting background event engine and scheduler...")
    event_bus.start()
    event_engine.start()
    await integration_scheduler.start_all()
    
    yield
    
    # Shutdown logic
    logger.info("Stopping background event engine and scheduler...")
    event_bus.stop()
    await integration_scheduler.stop_all()
    # --- Shutdown ---
    logger.info("GPO API Gateway shutting down...")
    dispose_engine()
    logger.info("Database connections disposed.")


# ──────────────────────────────────────────────────────────
# FastAPI Application Factory
# ──────────────────────────────────────────────────────────
app = FastAPI(
    title="Grid Policy Orchestrator (GPO) API Gateway",
    description="Enterprise Decision Intelligence Platform Backend",
    version="1.3.0-ALPHA",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ──────────────────────────────────────────────────────────
# CORS Middleware
# ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:2008",
        "http://127.0.0.1:2008",
        "http://localhost:1234",
        "http://127.0.0.1:1234",
        "http://localhost:5432",
        "http://127.0.0.1:5432",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*.enterprise.com", "*"]
)

# Instrument Prometheus Metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

from app.core.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, max_tokens=20, refill_rate=2)



# ──────────────────────────────────────────────────────────
# Performance Logging Middleware
# ──────────────────────────────────────────────────────────
@app.middleware("http")
async def log_request_performance(request: Request, call_next):
    request_id = generate_request_id()
    request.state.request_id = request_id
    
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)

    perf_logger.info(
        f"[{request_id}] {request.method} {request.url.path} → {response.status_code} [{duration_ms}ms]"
    )
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    response.headers["X-Request-ID"] = request_id
    return response


# ──────────────────────────────────────────────────────────
# Global Exception Handlers
# ──────────────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    details = [
        {"field": ".".join(str(l) for l in e.get("loc", [])), "message": e.get("msg", "")}
        for e in errors
    ]
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=send_error("Request validation failed.", errors=details, request_id=req_id),
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content=send_error(exc.detail, request_id=req_id),
    )

@app.exception_handler(RecordNotFoundError)
async def record_not_found_handler(request: Request, exc: RecordNotFoundError):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=send_error(exc.message, errors=exc.details, request_id=req_id),
    )

@app.exception_handler(DuplicateKeyError)
async def duplicate_key_handler(request: Request, exc: DuplicateKeyError):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content=send_error(exc.message, errors=exc.details, request_id=req_id),
    )

@app.exception_handler(ConstraintViolationError)
async def constraint_violation_handler(request: Request, exc: ConstraintViolationError):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=send_error(exc.message, errors=exc.details, request_id=req_id),
    )

@app.exception_handler(GPOException)
async def gpo_exception_handler(request: Request, exc: GPOException):
    req_id = getattr(request.state, "request_id", None)
    logging.getLogger("gpo.error").error(f"[{req_id}] GPOException: {exc.message} | {exc.details}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=send_error(exc.message, errors=exc.details, request_id=req_id),
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None)
    logging.getLogger("gpo.error").exception(f"[{req_id}] Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=send_error("An unexpected internal error occurred.", request_id=req_id),
    )


# ──────────────────────────────────────────────────────────
# Router Registration — Versioned API (v1)
# ──────────────────────────────────────────────────────────
@app.get("/api/v1", tags=["Index"])
async def api_index(request: Request):
    """
    API Index (HATEOAS-style)
    Returns links to all major feature sets in the GPO API.
    """
    base_url = str(request.base_url).rstrip("/")
    return {
        "name": "Grid Policy Orchestrator API",
        "version": "1.3.0-ALPHA",
        "links": {
            "docs": f"{base_url}/docs",
            "health": f"{base_url}/api/v1/health",
            "auth": f"{base_url}/api/v1/auth",
            "digital_twin": {
                "summary": f"{base_url}/api/v1/digital-twin/summary",
                "substations": f"{base_url}/api/v1/substations",
                "buses": f"{base_url}/api/v1/buses",
                "transmission_lines": f"{base_url}/api/v1/transmission-lines",
                "transformers": f"{base_url}/api/v1/transformers",
                "generators": f"{base_url}/api/v1/generators",
                "loads": f"{base_url}/api/v1/loads",
                "switches": f"{base_url}/api/v1/switches",
            },
            "engineering": f"{base_url}/api/v1/engineering",
            "policies": f"{base_url}/api/v1/policies",
            "users": f"{base_url}/api/v1/users",
        }
    }

app.include_router(auth.router,            prefix="/api/v1/auth",            tags=["Authentication"])
app.include_router(users.router,           prefix="/api/v1/users",           tags=["Users"])
app.include_router(grid_assets.router,     prefix="/api/v1/grid-assets",     tags=["Grid Assets"])
app.include_router(policies.router,        prefix="/api/v1/policies",        tags=["Policies"])

app.include_router(reports.router,         prefix="/api/v1/reports",         tags=["Reports"])
app.include_router(audit_logs.router,      prefix="/api/v1/audit-logs",      tags=["Audit Logs"])
app.include_router(system_settings.router, prefix="/api/v1/settings",        tags=["System Settings"])
app.include_router(health.router,          prefix="/api/v1/health",          tags=["Health"])
app.include_router(digital_twin.router,    prefix="/api/v1/digital-twin",    tags=["Digital Twin"])
from app.routers import digital_twin_foundation, predictions
app.include_router(digital_twin_foundation.router, prefix="/api/v1/dt",      tags=["Digital Twin Foundation"])
app.include_router(predictions.router, prefix="/api/v1/prediction", tags=["Predictive Digital Twin"])

# Phase 3.2 — Digital Twin Asset CRUD APIs
app.include_router(substations.router,        prefix="/api/v1/substations",        tags=["Substations"])
app.include_router(buses.router,              prefix="/api/v1/buses",              tags=["Buses"])
app.include_router(transmission_lines.router, prefix="/api/v1/transmission-lines", tags=["Transmission Lines"])
app.include_router(transformers.router,       prefix="/api/v1/transformers",       tags=["Transformers"])
app.include_router(generators.router,         prefix="/api/v1/generators",         tags=["Generators"])
app.include_router(loads.router,              prefix="/api/v1/loads",              tags=["Loads"])
app.include_router(switches.router,           prefix="/api/v1/switches",           tags=["Switches"])

# Phase 4.1 — Engineering Database APIs
app.include_router(engineering_api.router,    prefix="/api/v1/engineering",      tags=["Engineering"])

# Phase 5.1 — Real-Time Grid Monitoring
app.include_router(monitoring.router,         prefix="/api/v1/monitoring",       tags=["Monitoring"])

# Phase 5.3 — Integration Connectors
app.include_router(integration.router,        prefix="/api/v1/integrations",     tags=["Integration"])

# Phase 5.3.1 - Forecasting
app.include_router(forecasting.router,        prefix="/api/v1/forecasting",      tags=["Forecasting"])

# Phase 5.4 - Optimization
from app.routers import optimization_foundation
app.include_router(optimization_foundation.router, prefix="/api/v1/optimization", tags=["Optimization Foundation"])
app.include_router(optimization.router,       prefix="/api/v1/optimization",     tags=["Optimization"])

# Phase 5.5 - AI Intelligence
app.include_router(ai_intelligence.router,    prefix="/api/v1/ai",               tags=["AI"])
from app.routers import decisions
app.include_router(decisions.router,          prefix="/api/v1/decision",         tags=["AI Decisions"])

# Phase 6.1 - Scenario Library
app.include_router(scenarios.router,          prefix="/api/v1/scenarios",        tags=["Scenarios"])

# Phase 6.3 - Simulation Engine
app.include_router(simulation.router,         prefix="/api/v1/simulation",       tags=["Simulation"])

# Phase 6.4 - Impact Analysis
app.include_router(analysis.router,           prefix="/api/v1/analysis",         tags=["Impact Analysis"])

# Phase 6.5 - Operator Training
app.include_router(training.router,           prefix="/api/v1/training",         tags=["Training"])

# Phase 5.4 — Events, Alarms & Incidents
app.include_router(events.router,             prefix="/api/v1/events",           tags=["Events"])
app.include_router(alarms.router,             prefix="/api/v1/alarms",           tags=["Alarms"])
app.include_router(ops_incidents.router,      prefix="/api/v1/ops-incidents",    tags=["Operational Incidents"])

# Phase 7.5 — Optimization Analytics
app.include_router(optimization_analytics.router, prefix="/api/v1/optimization-analytics", tags=["Optimization Analytics"])

# Phase 9.1 — Generation Sources
app.include_router(generation.router, prefix="", tags=["Generation Sources"])
app.include_router(weather.router, prefix="", tags=["Weather Intelligence"])
app.include_router(dashboard.router, prefix="", tags=["Dashboard Operations"])
app.include_router(datasets.router, prefix="", tags=["Dataset Management"])

# Phase 5.5 - Enterprise Analytics
from app.routers import analytics
app.include_router(analytics.router,          prefix="/api/v1/analytics",        tags=["Analytics"])


# ──────────────────────────────────────────────────────────
# Backward-Compatible Routes (Frontend currently uses /api/auth/*)
# ──────────────────────────────────────────────────────────
app.include_router(auth.router,   prefix="/api/auth",   tags=["Authentication (Legacy)"])
app.include_router(health.router, prefix="/api/health", tags=["Health (Legacy)"])

# ──────────────────────────────────────────────────────────
# Frontend Static Files (SPA)
# ──────────────────────────────────────────────────────────
frontend_build_path = os.path.join(os.path.dirname(__file__), "..", "..", "src-frontend", "dist")

if os.path.exists(frontend_build_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_build_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_build_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_path = os.path.join(frontend_build_path, "index.html")
        if not os.path.exists(index_path):
            return JSONResponse(
                status_code=503,
                content={"status": "building", "message": "GPO Frontend is compiling, please refresh in a few seconds."}
            )
        return FileResponse(index_path)
