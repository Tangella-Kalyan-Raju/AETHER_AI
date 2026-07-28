from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pydantic import BaseModel

from app.database.connection import get_db
from app.core.security import PermissionGuard
from app.models.auth_models import User
from app.models.dashboard_models import (
    GenerationSourceTelemetry, GenerationHistory, GenerationHealth,
    GenerationCost, CO2Statistic, GenerationInsight, GenerationForecast
)
from app.core.response import send_success

router = APIRouter(prefix="/api/v1/generation", tags=["Generation Sources"])

# Colors for fuel sources
COLORS: Dict[str, str] = {
    "solar": "#f59e0b",
    "wind": "#06b6d4",
    "hydro": "#3b82f6",
    "nuclear": "#8b5cf6",
    "gas": "#ec4899",
    "coal": "#64748b",
    "battery": "#10b981",
    "imports": "#14b8a6",
    "exports": "#f43f5e"
}

POLICY_MAP = {
    "solar":   {"policy": "Green Mode",     "color": "text-emerald-400"},
    "wind":    {"policy": "Green Mode",     "color": "text-emerald-400"},
    "hydro":   {"policy": "Balanced Mode",  "color": "text-cyan-400"},
    "nuclear": {"policy": "Balanced Mode",  "color": "text-violet-400"},
    "gas":     {"policy": "Economic Mode",  "color": "text-pink-400"},
    "coal":    {"policy": "Economic Only",  "color": "text-slate-400"},
    "battery": {"policy": "All Modes",      "color": "text-emerald-400"},
    "imports": {"policy": "Reliability",    "color": "text-teal-400"},
    "exports": {"policy": "Green Mode",     "color": "text-emerald-400"},
}

@router.get("/sources", response_model=Dict[str, Any])
def get_generation_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Retrieves all generation sources telemetry.
    """
    db_sources = db.query(GenerationSourceTelemetry).all()
    sources = []
    
    total_generation = sum(max(0.0, s.current_generation) for s in db_sources)
    
    for s in db_sources:
        health = db.query(GenerationHealth).filter(GenerationHealth.source_id == s.id).first()
        cost = db.query(GenerationCost).filter(GenerationCost.source_id == s.id).first()
        co2 = db.query(CO2Statistic).filter(CO2Statistic.source_id == s.id).first()
        insight = db.query(GenerationInsight).filter(GenerationInsight.source_id == s.id).first()
        forecasts = db.query(GenerationForecast).filter(GenerationForecast.source_id == s.id).limit(8).all()
        
        # Calculate percentage contribution
        pct = round((s.current_generation / total_generation * 100), 1) if total_generation > 0 and s.current_generation > 0 else 0.0
        
        sources.append({
            "id": s.id,
            "name": s.name,
            "current_generation": s.current_generation,
            "available_capacity": s.capacity,
            "max_capacity": s.capacity * 1.2 if s.id != "battery" else s.capacity,
            "percentage": pct if s.id != "exports" else -1.0,
            "status": s.status,
            "trend": s.trend,
            "forecast": [f.predicted_value for f in forecasts] if forecasts else [100, 120, 140, 150, 130, 110, 90, 80],
            "contribution_to_policy": POLICY_MAP.get(s.id, {}).get("policy", "N/A"),
            "health_score": health.health_score if health else 98.0,
            "maintenance_status": health.maintenance_status if health else "Nominal",
            "efficiency": health.efficiency if health else 95.0,
            "operating_cost": cost.operating_cost_mwh if cost else 15.0,
            "co2_emissions": co2.emissions_g_kwh if co2 else 0.0,
            "ai_insight": insight.explanation if insight else "Telemetry stable.",
            "recommendation": insight.recommendation if insight else "No active dispatch changes requested.",
            "confidence_score": insight.confidence if insight else 95.0,
            "last_updated": datetime.utcnow().isoformat()
        })
        
    renewables = sum(s["current_generation"] for s in sources if s["id"] in ["solar", "wind", "hydro"])
    fossils = sum(s["current_generation"] for s in sources if s["id"] in ["gas", "coal"])
    nuclear = sum(s["current_generation"] for s in sources if s["id"] == "nuclear")
    storage = sum(s["current_generation"] for s in sources if s["id"] == "battery")
    
    total = renewables + fossils + nuclear + storage
    mix_summary = {
        "renewables_pct": round((renewables / total * 100), 1) if total > 0 else 52.2,
        "fossil_pct": round((fossils / total * 100), 1) if total > 0 else 27.5,
        "nuclear_pct": round((nuclear / total * 100), 1) if total > 0 else 12.5,
        "storage_pct": round((storage / total * 100), 1) if total > 0 else 5.2,
    }
    
    ai_insights = [s["ai_insight"] for s in sources if s["ai_insight"] and s["id"] in ["solar", "wind", "coal", "battery"]]
    if not ai_insights:
        ai_insights = ["All generation assets operating within safety and environmental thresholds."]

    return send_success({
        "sources": sources,
        "mix_summary": mix_summary,
        "ai_insights": ai_insights
    })

@router.get("/sources/{source_id}", response_model=Dict[str, Any])
def get_source_detail(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Retrieves detailed metrics for a single generation source.
    """
    s = db.query(GenerationSourceTelemetry).filter(GenerationSourceTelemetry.id == source_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Source not found")
        
    health = db.query(GenerationHealth).filter(GenerationHealth.source_id == source_id).first()
    cost = db.query(GenerationCost).filter(GenerationCost.source_id == source_id).first()
    co2 = db.query(CO2Statistic).filter(CO2Statistic.source_id == source_id).first()
    insight = db.query(GenerationInsight).filter(GenerationInsight.source_id == source_id).first()
    
    return send_success({
        "id": s.id,
        "name": s.name,
        "current_generation": s.current_generation,
        "installed_capacity": s.capacity,
        "capacity_factor": s.details.get("capacity_factor", 65.0) if s.details else 65.0,
        "current_utilisation": round((s.current_generation / s.capacity * 100), 1) if s.capacity > 0 else 0.0,
        "availability": 98.4,
        "status": s.status,
        "health_score": health.health_score if health else 98.0,
        "maintenance_status": health.maintenance_status if health else "Nominal",
        "efficiency": health.efficiency if health else 95.0,
        "operating_cost": cost.operating_cost_mwh if cost else 15.0,
        "co2_emissions": co2.emissions_g_kwh if co2 else 0.0,
        "ai_insight": insight.explanation if insight else "No active alerts for this source.",
        "recommendation": insight.recommendation if insight else "Maintain current dispatch schedule.",
        "confidence_score": insight.confidence if insight else 95.0,
        "last_updated": datetime.utcnow().isoformat()
    })

@router.get("/sources/{source_id}/history", response_model=Dict[str, Any])
def get_source_history(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns historical trends (hourly, daily, weekly, monthly, yearly).
    """
    # Fetch historical generation records
    hist = db.query(GenerationHistory).filter(GenerationHistory.source_id == source_id).order_by(GenerationHistory.timestamp.desc()).limit(24).all()
    
    # Fill in simulated/placeholder trends to guarantee operational visuals for all timeframes
    now = datetime.utcnow()
    hourly = [{"time": (now - timedelta(hours=i)).strftime("%H:%M"), "value": h.value} for i, h in enumerate(reversed(hist))] if hist else [
        {"time": f"{h}h ago", "value": 150 + (h%3)*20} for h in range(12, 0, -1)
    ]
    
    daily = [{"time": f"Day {d}", "value": 1400 + (d%5)*200} for d in range(1, 8)]
    weekly = [{"time": f"Week {w}", "value": 9800 + (w%4)*1500} for w in range(1, 5)]
    monthly = [{"time": f"Month {m}", "value": 42000 + (m%6)*5000} for m in range(1, 13)]
    yearly = [{"time": f"202{y}", "value": 520000 + y*35000} for y in range(1, 7)]
    
    return send_success({
        "hourly": hourly,
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly,
        "yearly": yearly
    })

@router.get("/sources/{source_id}/forecast", response_model=Dict[str, Any])
def get_source_forecast(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns forecast values with lower and upper bounds.
    """
    forecasts = db.query(GenerationForecast).filter(GenerationForecast.source_id == source_id).order_by(GenerationForecast.target_timestamp.asc()).all()
    if not forecasts:
        now = datetime.utcnow()
        forecasts = [
            GenerationForecast(source_id=source_id, target_timestamp=now + timedelta(hours=i), predicted_value=200.0 + i*10, confidence=95.0 - i, lower_bound=180.0 + i*5, upper_bound=220.0 + i*15)
            for i in range(8)
        ]
        
    return send_success([
        {
            "timestamp": f.target_timestamp.isoformat(),
            "predicted_value": f.predicted_value,
            "confidence": f.confidence,
            "lower_bound": f.lower_bound,
            "upper_bound": f.upper_bound
        } for f in forecasts
    ])
