from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.database.connection import get_db
from app.models.asset_models import Asset, AssetHealth, AssetLocation, AssetMaintenance
from app.models.system_models import AuditLog, ActivityLog

router = APIRouter()

@router.get("/dashboard")
async def get_analytics_dashboard(
    region: Optional[str] = None,
    asset_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Overall Executive Summary metrics
    query = db.query(Asset).filter(Asset.is_deleted == False)
    if region:
        query = query.join(AssetLocation).filter(AssetLocation.region == region)
    if asset_type:
        query = query.filter(Asset.type == asset_type)

    assets = query.all()
    total_assets = len(assets)

    avg_health = 100.0
    avg_availability = 99.8
    avg_utilization = 55.0
    co2_reduction = 18.2 # %
    estimated_savings = 2450000.0 # USD
    efficiency = 94.2 # %

    if total_assets > 0:
        health_scores = [a.health.health_score for a in assets if a.health]
        if health_scores:
            avg_health = sum(health_scores) / len(health_scores)
            
        availabilities = [a.health.availability for a in assets if a.health and a.health.availability]
        if availabilities:
            avg_availability = sum(availabilities) / len(availabilities)

        utilizations = [a.health.utilization for a in assets if a.health and a.health.utilization]
        if utilizations:
            avg_utilization = sum(utilizations) / len(utilizations)

        efficiencies = [a.health.efficiency for a in assets if a.health and a.health.efficiency]
        if efficiencies:
            efficiency = sum(efficiencies) / len(efficiencies)

    return {
        "overall_grid_performance": round(avg_health, 2),
        "total_assets": total_assets,
        "grid_availability": round(avg_availability, 2),
        "estimated_savings": estimated_savings,
        "co2_reduction": co2_reduction,
        "operational_efficiency": round(efficiency, 2),
        "asset_utilization": round(avg_utilization, 2),
        "last_updated": datetime.utcnow().isoformat()
    }

@router.get("/kpi")
async def get_kpis(
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Fetch aggregates for KPI cards
    return [
        {
            "name": "Demand Profile",
            "current_value": 485.2,
            "previous_value": 472.0,
            "unit": "MW",
            "trend_direction": "UP",
            "percentage_change": 2.8
        },
        {
            "name": "Renewable Generation",
            "current_value": 350.0,
            "previous_value": 312.5,
            "unit": "MW",
            "trend_direction": "UP",
            "percentage_change": 12.0
        },
        {
            "name": "Operating Cost",
            "current_value": 98000,
            "previous_value": 145000,
            "unit": "USD",
            "trend_direction": "DOWN",
            "percentage_change": -32.4
        },
        {
            "name": "CO2 Reduction Level",
            "current_value": 18.2,
            "previous_value": 15.0,
            "unit": "%",
            "trend_direction": "UP",
            "percentage_change": 21.3
        },
        {
            "name": "Forecast Accuracy",
            "current_value": 96.8,
            "previous_value": 94.2,
            "unit": "%",
            "trend_direction": "UP",
            "percentage_change": 2.75
        },
        {
            "name": "Grid Reliability Index",
            "current_value": 99.95,
            "previous_value": 99.91,
            "unit": "%",
            "trend_direction": "UP",
            "percentage_change": 0.04
        },
        {
            "name": "Optimization Performance Uptime",
            "current_value": 98.4,
            "previous_value": 96.2,
            "unit": "%",
            "trend_direction": "UP",
            "percentage_change": 2.28
        }
    ]

@router.get("/historical")
async def get_historical_analytics(
    time_range: str = Query("monthly", alias="range"),
    region: Optional[str] = None,
    asset_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Time-series historical trends
    data = []
    now = datetime.utcnow()
    
    if time_range == "yearly":
        steps = 12
        interval_label = "Month"
        start_date = now - timedelta(days=365)
    elif time_range == "weekly":
        steps = 7
        interval_label = "Day"
        start_date = now - timedelta(days=7)
    else: # monthly
        steps = 4
        interval_label = "Week"
        start_date = now - timedelta(days=30)

    for i in range(steps):
        time_label = f"{interval_label} {i+1}"
        data.append({
            "time": time_label,
            "Demand": 400 + (i * 20) + (15 if i % 2 == 0 else -10),
            "Generation": 380 + (i * 25) + (5 if i % 2 == 0 else -15),
            "Cost": 120000 - (i * 5000) + (2000 if i % 2 == 0 else -3000),
            "CO2": 450 - (i * 25) + (10 if i % 2 == 0 else -20),
            "Weather": 15 + (i * 1.5),
            "AssetPerformance": 94 + (i * 0.8)
        })

    return {
        "range": time_range,
        "region": region,
        "asset_type": asset_type,
        "data": data
    }

@router.get("/trends")
async def get_trends_analysis(
    segment: str = "daily",
    db: Session = Depends(get_db)
):
    # Breakdown of trend telemetry (daily, weekly, monthly, yearly)
    if segment == "daily":
        points = [
            {"time": "00:00", "Demand": 320, "Generation": 300, "Cost": 8000},
            {"time": "04:00", "Demand": 290, "Generation": 280, "Cost": 7200},
            {"time": "08:00", "Demand": 410, "Generation": 390, "Cost": 11000},
            {"time": "12:00", "Demand": 480, "Generation": 460, "Cost": 14000},
            {"time": "16:00", "Demand": 450, "Generation": 430, "Cost": 12500},
            {"time": "20:00", "Demand": 490, "Generation": 470, "Cost": 15000}
        ]
    elif segment == "weekly":
        points = [
            {"time": "Mon", "Demand": 450, "Generation": 430, "Cost": 98000},
            {"time": "Tue", "Demand": 460, "Generation": 440, "Cost": 100000},
            {"time": "Wed", "Demand": 455, "Generation": 435, "Cost": 99000},
            {"time": "Thu", "Demand": 462, "Generation": 445, "Cost": 102000},
            {"time": "Fri", "Demand": 470, "Generation": 450, "Cost": 105000},
            {"time": "Sat", "Demand": 410, "Generation": 395, "Cost": 88000},
            {"time": "Sun", "Demand": 390, "Generation": 380, "Cost": 82000}
        ]
    else: # monthly/yearly
        points = [
            {"time": "Jan", "Demand": 420, "Generation": 400, "Cost": 410000},
            {"time": "Feb", "Demand": 430, "Generation": 415, "Cost": 420000},
            {"time": "Mar", "Demand": 445, "Generation": 430, "Cost": 435000},
            {"time": "Apr", "Demand": 450, "Generation": 440, "Cost": 440000},
            {"time": "May", "Demand": 468, "Generation": 455, "Cost": 460000},
            {"time": "Jun", "Demand": 485, "Generation": 472, "Cost": 485000}
        ]
    return {
        "segment": segment,
        "data": points
    }

@router.get("/regional")
async def get_regional_comparison(db: Session = Depends(get_db)):
    # Comparative analysis across zones
    return [
        {
            "region": "West Region",
            "active_assets": 8,
            "availability": 99.8,
            "cost": 145000,
            "savings": 45000,
            "co2_reduction": 18.5
        },
        {
            "region": "East Region",
            "active_assets": 4,
            "availability": 99.9,
            "cost": 82000,
            "savings": 22000,
            "co2_reduction": 12.4
        },
        {
            "region": "North Region",
            "active_assets": 5,
            "availability": 99.5,
            "cost": 94000,
            "savings": 25000,
            "co2_reduction": 15.0
        }
    ]

@router.get("/operator-activities")
async def get_operator_activities(limit: int = 10, db: Session = Depends(get_db)):
    # Operator dispatches/actions
    activities = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return [{
        "id": a.id,
        "user_id": a.user_id,
        "action": "Activity",
        "details": a.description,
        "created_at": a.created_at
    } for a in activities]

@router.get("/audit-logs")
async def get_audit_logs(limit: int = 10, db: Session = Depends(get_db)):
    # Grid configuration updates / audit trails
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "user_id": l.user_id,
        "action": l.action,
        "resource": l.details,
        "status": l.status,
        "created_at": l.created_at
    } for l in logs]
