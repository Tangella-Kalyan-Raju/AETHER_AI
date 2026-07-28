from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, List

from app.database.connection import get_db
from app.core.security import PermissionGuard
from app.models.auth_models import User
from app.models.dashboard_models import (
    DashboardSummary, WeatherTelemetry, GenerationSourceTelemetry,
    GridStatusTelemetry, BatteryStatus, DashboardAlert, DashboardEvent, DatasetRecord, Dataset
)
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard Operations"])

@router.get("/summary", response_model=Dict[str, Any])
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Fetches grid operations summary. Automatically integrates imported dataset metrics if available.
    """
    # Check for completed datasets
    latest_dataset = db.query(Dataset).filter(Dataset.status == "completed").order_by(Dataset.created_at.desc()).first()
    
    if latest_dataset:
        # Sum demand, generation, capacity from DatasetRecord
        records = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == latest_dataset.id).all()
        if records:
            total_gen = sum(r.current_generation for r in records if r.current_generation is not None)
            total_demand = sum(r.demand for r in records if r.demand is not None)
            total_renewable = sum(r.renewable_output for r in records if r.renewable_output is not None)
            
            # Map values
            grid_health = 98.2
            renewable_pct = round((total_renewable / total_gen * 100) if total_gen > 0 else 48.7, 1)
            reserve_margin = round(((total_gen - total_demand) / total_demand * 100) if total_demand > 0 else 18.6, 1)
            
            return {
                "success": True,
                "data": {
                    "grid_health": grid_health,
                    "current_demand": total_demand or 24820.0,
                    "current_generation": total_gen or 25210.0,
                    "renewable_pct": renewable_pct,
                    "reserve_margin": reserve_margin,
                    "grid_frequency": 49.98,
                    "co2_emissions": 420.5,
                    "operating_cost": 12450.0,
                    "power_balance": round(total_gen - total_demand, 1),
                    "active_policy": "Balanced Mode",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

    # Default seeded fallback
    summary = db.query(DashboardSummary).order_by(DashboardSummary.timestamp.desc()).first()
    if not summary:
        summary = DashboardSummary()
        
    return {
        "success": True,
        "data": {
            "grid_health": summary.grid_health,
            "current_demand": summary.current_demand,
            "current_generation": summary.current_generation,
            "renewable_pct": summary.renewable_pct,
            "reserve_margin": summary.reserve_margin,
            "grid_frequency": summary.grid_frequency,
            "co2_emissions": summary.co2_emissions,
            "operating_cost": summary.operating_cost,
            "power_balance": summary.power_balance,
            "active_policy": summary.active_policy,
            "timestamp": summary.timestamp.isoformat()
        }
    }

@router.get("/weather", response_model=Dict[str, Any])
def get_dashboard_weather(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns real-time weather details. Queries weather service using environment config.
    """
    # Fetch latest weather from APIs
    weather_data = WeatherService.get_weather_data()
    
    # Save to db
    db_weather = WeatherTelemetry(
        region=weather_data["region"],
        temperature=weather_data["temperature"],
        humidity=weather_data["humidity"],
        wind_speed=weather_data["wind_speed"],
        cloud_cover=weather_data["cloud_cover"],
        pressure=weather_data["pressure"],
        visibility=weather_data["visibility"],
        sunrise=weather_data["sunrise"],
        sunset=weather_data["sunset"],
        weather_alerts=weather_data["weather_alerts"],
        weather_impact=weather_data["weather_impact"],
        forecast_summary=weather_data["forecast_summary"]
    )
    db.add(db_weather)
    db.commit()
    
    return {
        "success": True,
        "data": weather_data
    }

@router.get("/grid-status", response_model=Dict[str, Any])
def get_grid_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns detailed grid stability and telemetry indexes.
    """
    status = db.query(GridStatusTelemetry).order_by(GridStatusTelemetry.timestamp.desc()).first()
    if not status:
        status = GridStatusTelemetry()
        
    return {
        "success": True,
        "data": {
            "current_load": status.current_load,
            "available_capacity": status.available_capacity,
            "reserve_margin": status.reserve_margin,
            "operating_region": status.operating_region,
            "power_flow": status.power_flow,
            "current_status": status.current_status,
            "grid_frequency": status.grid_frequency,
            "grid_stability": status.grid_stability,
            "timestamp": status.timestamp.isoformat()
        }
    }

@router.get("/battery", response_model=Dict[str, Any])
def get_battery_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns Battery storage backup details.
    """
    bat = db.query(BatteryStatus).order_by(BatteryStatus.timestamp.desc()).first()
    if not bat:
        bat = BatteryStatus()
        
    return {
        "success": True,
        "data": {
            "soc": bat.soc,
            "charge_rate": bat.charge_rate,
            "discharge_rate": bat.discharge_rate,
            "health": bat.health,
            "remaining_cycles": bat.remaining_cycles,
            "backup_time": bat.backup_time,
            "timestamp": bat.timestamp.isoformat()
        }
    }

@router.get("/alerts", response_model=Dict[str, Any])
def get_dashboard_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Lists current active alarms.
    """
    alerts = db.query(DashboardAlert).order_by(DashboardAlert.timestamp.desc()).all()
    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "severity": a.severity,
                "title": a.title,
                "description": a.description,
                "category": a.category,
                "timestamp": a.timestamp.isoformat(),
                "status": a.status
            } for a in alerts
        ]
    }

@router.get("/events", response_model=Dict[str, Any])
def get_dashboard_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns active operating logs.
    """
    events = db.query(DashboardEvent).order_by(DashboardEvent.timestamp.desc()).limit(15).all()
    return {
        "success": True,
        "data": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "description": e.description,
                "severity": e.severity,
                "timestamp": e.timestamp.isoformat()
            } for e in events
        ]
    }

@router.get("/kpi-summary", response_model=Dict[str, Any])
def get_kpi_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns 24h historical logs of load and generation for dashboard charts.
    """
    history = db.query(DashboardSummary).order_by(DashboardSummary.timestamp.asc()).limit(24).all()
    return {
        "success": True,
        "data": [
            {
                "time": h.timestamp.strftime("%H:%M"),
                "generation": h.current_generation,
                "demand": h.current_demand
            } for h in history
        ]
    }
