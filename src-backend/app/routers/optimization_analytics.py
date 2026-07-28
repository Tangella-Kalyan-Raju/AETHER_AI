from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.connection import get_db

# Models & Services
from app.models.optimization_models import OptimizationAuditEntry
from app.services.analytics.performance_metrics import PerformanceMetricsEngine
from app.services.analytics.kpi_engine import KPIEngine
from app.services.analytics.benchmarking import BenchmarkingEngine
from app.services.analytics.explainability import ExplainabilityEngine
from app.services.analytics.replay import OptimizationReplayEngine
from app.services.analytics.recommendation_analytics import RecommendationAnalyticsEngine
from app.services.analytics.audit import OptimizationAuditEngine

router = APIRouter()

# Instantiate Service layer classes
perf_metrics_engine = PerformanceMetricsEngine()
kpi_engine = KPIEngine()
benchmarking_engine = BenchmarkingEngine()
explainability_engine = ExplainabilityEngine()
replay_engine = OptimizationReplayEngine()
rec_analytics_engine = RecommendationAnalyticsEngine()
audit_engine = OptimizationAuditEngine()

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """Retrieves high-level summary cards for optimization job health."""
    perf = perf_metrics_engine.calculate_performance_metrics(db)
    return {
        "total_optimizations": perf["total_jobs"],
        "success_rate_pct": perf["success_rate"],
        "optimization_health": "OPTIMAL" if perf["success_rate"] >= 95.0 else "WARNING",
        "system_health": "NOMINAL"
    }

@router.get("/performance")
def get_performance_metrics(db: Session = Depends(get_db)):
    """Retrieves deep mathematical execution performance variables."""
    return perf_metrics_engine.calculate_performance_metrics(db)

@router.get("/kpis")
def get_kpi_summary(db: Session = Depends(get_db)):
    """Retrieves average cost savings, emissions avoidance, and grid compliance margins."""
    return kpi_engine.calculate_kpi_summary(db)

@router.get("/kpis/trends")
def get_kpi_trends(period: str = "DAILY", db: Session = Depends(get_db)):
    """Retrieves historical KPI trends grouped by DAILY, WEEKLY, or MONTHLY intervals."""
    if period not in ["DAILY", "WEEKLY", "MONTHLY"]:
        raise HTTPException(status_code=400, detail="Invalid period. Must be DAILY, WEEKLY, or MONTHLY.")
    return kpi_engine.generate_kpi_trends(db, period)

@router.get("/benchmarks")
def get_benchmarks(db: Session = Depends(get_db)):
    """Retrieves general strategy ranking and zone performance indices."""
    return benchmarking_engine.generate_strategy_benchmarks(db)

@router.get("/benchmarks/strategies")
def get_strategy_comparison(db: Session = Depends(get_db)):
    """Retrieves comparative strategy matrix details."""
    res = benchmarking_engine.generate_strategy_benchmarks(db)
    return res["strategy_benchmarks"]

@router.get("/explainability/{job_id}")
def get_job_explainability(job_id: str, db: Session = Depends(get_db)):
    """Retrieves a traceable explainable AI reasoning trail for a target job."""
    res = explainability_engine.generate_explainability_report(job_id, db)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.get("/replay/{job_id}")
def get_job_replay(job_id: str, db: Session = Depends(get_db)):
    """Retrieves the complete 13-stage execution timeline replay parameters."""
    res = replay_engine.generate_replay_session(job_id, db)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.get("/recommendations")
def get_recommendation_statistics(db: Session = Depends(get_db)):
    """Retrieves AI advisory recommendation effectiveness and operator feedback statistics."""
    return rec_analytics_engine.calculate_recommendation_analytics(db)

@router.get("/audit-logs")
def get_audit_logs(
    status: str = None,
    strategy: str = None,
    from_date: str = None,
    to_date: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Retrieves searchable compliance audit logs with multi-column filtering."""
    return audit_engine.query_audit_logs(db, status, strategy, from_date, to_date, limit, offset)

@router.get("/audit-logs/{job_id}")
def get_job_audit_entry(job_id: str, db: Session = Depends(get_db)):
    """Retrieves the specific audit trail details logged for a job ID."""
    res = db.query(OptimizationAuditEntry).filter(OptimizationAuditEntry.job_id == job_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Audit entry not found for this job ID.")
    return res

@router.get("/reports/export")
def export_analytics_reports(type: str = "kpi", db: Session = Depends(get_db)):
    """Generates and exports CSV/text summaries for executive compliance reporting."""
    if type == "audit":
        csv_data = audit_engine.generate_audit_csv(db)
        return {"type": "audit", "csv_payload": csv_data}
        
    # Default KPI report
    kpis = kpi_engine.calculate_kpi_summary(db)
    perf = perf_metrics_engine.calculate_performance_metrics(db)
    
    csv_rows = [
        "Parameter,Metric Value",
        f"Total Optimizations,{perf['total_jobs']}",
        f"Success Rate (%),{perf['success_rate']}%",
        f"Avg Duration (ms),{perf['avg_duration_ms']} ms",
        f"Average Cost Reduction (USD),${kpis['avg_cost_reduction_usd']}",
        f"Average Carbon Avoided (Tons),{kpis['avg_carbon_reduction_tons']} tons",
        f"Grid Stability Index (Avg),{kpis['avg_stability_score']}/100",
        f"AI Acceptance Rate (%),{perf['acceptance_rate']}%"
    ]
    csv_data = "\n".join(csv_rows)
    return {"type": type, "csv_payload": csv_data}
