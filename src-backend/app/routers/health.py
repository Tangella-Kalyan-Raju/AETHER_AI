import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db, check_health
from app.core.response import send_success
from app.config.settings import settings

router = APIRouter()
START_TIME = time.time()

@router.get("", response_model=dict, summary="Get System Health", description="Detailed health diagnostics for the platform")
@router.get("/", response_model=dict, include_in_schema=False)
def health_check(db: Session = Depends(get_db)):
    db_health = check_health(db)
    
    uptime = time.time() - START_TIME
    
    memory_usage = "N/A"
    try:
        import psutil
        memory_usage = f"{psutil.virtual_memory().percent}%"
    except ImportError:
        pass
    
    health_data = {
        "status": "healthy" if db_health["status"] == "healthy" else "unhealthy",
        "service": "GPO API Gateway",
        "version": "1.3.0-ALPHA",
        "environment": settings.ENV,
        "uptime_seconds": round(uptime, 2),
        "memory_usage": memory_usage,
        "simulation_readiness": "ready" if db_health["status"] == "healthy" else "degraded",
        "database": db_health,
        "modules": {
            "forecasting_engine": "online",
            "ai_decision_engine": "online",
            "digital_twin": "online",
            "predictive_twin": "online",
            "simulation_engine": "online",
            "optimization_engine": "online",
            "analytics_engine": "online",
            "scenario_builder": "online"
        }
    }
    return send_success(health_data)
