from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.connection import get_db

router = APIRouter()

# ── Phase 5.5 Enterprise Results Analytics Endpoints ─────────────────────────

@router.get("/dashboard")
async def get_analytics_dashboard(db: Session = Depends(get_db)):
    return {
        "status": "ACTIVE",
        "active_optimizations": 3,
        "latest_recommendations": 2,
        "overall_grid_performance": 96.5,
        "last_updated": datetime.utcnow().isoformat()
    }

@router.get("/kpi")
async def get_kpis(db: Session = Depends(get_db)):
    return [
        {
            "name": "Estimated Savings",
            "current_value": 2400000,
            "previous_value": 2142857,
            "unit": "USD",
            "trend_direction": "UP",
            "percentage_change": 12.0
        },
        {
            "name": "Reliability",
            "current_value": 99.94,
            "previous_value": 99.14,
            "unit": "%",
            "trend_direction": "UP",
            "percentage_change": 0.8
        },
        {
            "name": "CO2 Reduction",
            "current_value": 18.0,
            "previous_value": 17.14,
            "unit": "%",
            "trend_direction": "UP",
            "percentage_change": 5.0
        },
        {
            "name": "Grid Loss",
            "current_value": 4.2,
            "previous_value": 5.5,
            "unit": "%",
            "trend_direction": "DOWN",
            "percentage_change": -23.6
        }
    ]

@router.get("/executive-summary")
async def get_executive_summary(db: Session = Depends(get_db)):
    return {
        "title": "Monthly Grid Optimization Brief",
        "operational_performance": "The grid successfully maintained N-1 security across all critical nodes. Reserve margins were optimized resulting in a higher utilization of solar assets during peak demand.",
        "financial_impact": "Optimization algorithms yielded $2.4M in savings, primarily through the reduction of spinning reserves and efficient battery arbitrage.",
        "environmental_impact": "Total CO2 output was reduced by 18%, avoiding approximately 12,000 tons of emissions compared to the baseline.",
        "key_achievements": ["Zero load shed events", "12% cost reduction", "Exceeded renewable targets by 4%"],
        "major_risks": ["Upcoming heatwave may stress transformer fleet", "Wind variability remains high in Northern sector"]
    }

@router.get("/trends")
async def get_trends(range: str = "monthly", db: Session = Depends(get_db)):
    # Mocked time-series for Recharts
    return {
        "range": range,
        "data": [
            {"time": "Week 1", "Cost": 120000, "Reliability": 98.5, "CO2": 450},
            {"time": "Week 2", "Cost": 115000, "Reliability": 98.8, "CO2": 420},
            {"time": "Week 3", "Cost": 105000, "Reliability": 99.2, "CO2": 390},
            {"time": "Week 4", "Cost": 98000, "Reliability": 99.9, "CO2": 350},
        ]
    }

@router.get("/comparison")
async def get_before_after_comparison(db: Session = Depends(get_db)):
    return {
        "metrics": [
            {"name": "Operating Cost", "current": 145000, "optimized": 98000, "unit": "USD"},
            {"name": "Grid Loss", "current": 52, "optimized": 38, "unit": "MW"},
            {"name": "Recovery Time", "current": 45, "optimized": 15, "unit": "Min"},
            {"name": "Renewable Mix", "current": 32, "optimized": 48, "unit": "%"}
        ]
    }

@router.get("/benchmarks")
async def get_benchmarks(db: Session = Depends(get_db)):
    return [
        {"metric": "Enterprise Sustainability Target", "current": 48, "target": 50, "unit": "%", "status": "At Risk"},
        {"metric": "Cost Reduction Target", "current": 12, "target": 10, "unit": "%", "status": "Achieved"},
        {"metric": "Grid Reliability Benchmark", "current": 99.94, "target": 99.90, "unit": "%", "status": "Achieved"}
    ]

@router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    return [
        {"id": "REP-001", "title": "Q2 Optimization Impact", "type": "Executive", "date": "2026-07-01", "status": "Ready"}
    ]

@router.get("/history")
async def get_analytics_history(db: Session = Depends(get_db)):
    return [
        {"id": "SNAP-991", "event": "Monthly Aggregation Completed", "date": "2026-07-01T00:00:00Z"}
    ]
