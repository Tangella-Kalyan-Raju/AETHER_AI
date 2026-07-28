from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pydantic import BaseModel

from app.database.connection import get_db
from app.core.security import PermissionGuard
from app.models.auth_models import User
from app.models.dashboard_models import (
    WeatherTelemetry, WeatherForecast, WeatherTimeline, WeatherImpact,
    RenewablePrediction, WeatherConfidence, GenerationSourceTelemetry
)
from app.core.response import send_success

router = APIRouter(prefix="/api/v1/weather", tags=["Weather Intelligence"])

@router.get("/current", response_model=Dict[str, Any])
def get_current_weather(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns the latest current weather telemetry metrics.
    """
    telemetry = db.query(WeatherTelemetry).order_by(WeatherTelemetry.timestamp.desc()).first()
    if not telemetry:
        # Fallback simulation
        return send_success({
            "region": "National Grid Region",
            "temperature": 28.5,
            "humidity": 52.0,
            "pressure": 1012.5,
            "wind_speed": 14.5,
            "wind_direction": "WSW",
            "wind_gust": 18.2,
            "visibility": 10.0,
            "uv_index": 6.0,
            "cloud_cover": 35.0,
            "cloud_density": "Moderate",
            "feels_like": 30.2,
            "sunrise": "05:42 AM",
            "sunset": "06:48 PM",
            "dew_point": 18.0,
            "rain": 1.2,
            "snow": 0.0,
            "fog": 0.0,
            "air_quality": "Good (AQI 42)",
            "weather_alerts": [{"title": "Cloud Cover Increase", "time": "14:25", "desc": "Expected in 30 mins"}],
            "weather_impact": "Cloud cover is increasing rapidly over the next 30 minutes. Solar generation is expected to drop.",
            "forecast_summary": "Mostly Sunny"
        })
    
    return send_success({
        "region": telemetry.region,
        "temperature": telemetry.temperature,
        "humidity": telemetry.humidity,
        "pressure": telemetry.pressure,
        "wind_speed": telemetry.wind_speed,
        "wind_direction": "WSW",
        "wind_gust": telemetry.wind_speed * 1.25,
        "visibility": telemetry.visibility,
        "uv_index": 6.0,
        "cloud_cover": telemetry.cloud_cover,
        "cloud_density": "Moderate" if telemetry.cloud_cover > 20 else "Low",
        "feels_like": telemetry.temperature + 1.5,
        "sunrise": telemetry.sunrise or "05:42 AM",
        "sunset": telemetry.sunset or "06:48 PM",
        "dew_point": 18.0,
        "rain": 0.0,
        "snow": 0.0,
        "fog": 0.0,
        "air_quality": "Good (AQI 42)",
        "weather_alerts": telemetry.weather_alerts or [],
        "weather_impact": telemetry.weather_impact or "Telemetry stable.",
        "forecast_summary": telemetry.forecast_summary or "Clear"
    })

@router.get("/forecast", response_model=Dict[str, Any])
def get_weather_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns 24h, 48h, and 7d weather forecasts.
    """
    forecasts = db.query(WeatherForecast).order_by(WeatherForecast.target_timestamp.asc()).all()
    if not forecasts:
        # Generate simulation
        now = datetime.utcnow()
        forecasts = []
        for i in range(24):
            forecasts.append(WeatherForecast(target_timestamp=now + timedelta(hours=i), temperature=28.0 + (i%4), wind_speed=12.0 + (i%3), humidity=50.0 - (i%5), pressure=1012.0, cloud_cover=20.0 + i, solar_irradiance=600 - i*10, confidence=94.0, forecast_type="24h"))
    
    # Group forecasts
    res24h = [f for f in forecasts if f.forecast_type == "24h"]
    res48h = [f for f in forecasts if f.forecast_type == "48h"]
    res7d = [f for f in forecasts if f.forecast_type == "7d"]
    
    def serialize(f_list):
        return [
            {
                "timestamp": f.target_timestamp.isoformat(),
                "temperature": f.temperature,
                "wind_speed": f.wind_speed,
                "humidity": f.humidity,
                "pressure": f.pressure,
                "cloud_cover": f.cloud_cover,
                "solar_irradiance": f.solar_irradiance,
                "confidence": f.confidence,
                "expected_renewable_impact": "Minor Drop" if f.cloud_cover > 40 else "High Yield"
            } for f in f_list
        ]

    return send_success({
        "forecast_24h": serialize(res24h),
        "forecast_48h": serialize(res48h),
        "forecast_7d": serialize(res7d)
    })

@router.get("/timeline", response_model=Dict[str, Any])
def get_weather_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns past, current, and future weather event milestones.
    """
    events = db.query(WeatherTimeline).order_by(WeatherTimeline.event_time.asc()).all()
    if not events:
        now = datetime.utcnow()
        events = [
            WeatherTimeline(event_time=now - timedelta(hours=2), event_type="Solar Peak", description="Solar radiation reached seasonal peak index", timeline_phase="past"),
            WeatherTimeline(event_time=now, event_type="Wind Increase", description="Wind velocities climbing to 14.5 m/s", timeline_phase="current"),
            WeatherTimeline(event_time=now + timedelta(hours=2), event_type="Storm Incoming", description="Severe weather system approaching coastal wind assets", timeline_phase="future"),
        ]
        
    return send_success([
        {
            "time": e.event_time.isoformat(),
            "event_type": e.event_type,
            "description": e.description,
            "phase": e.timeline_phase
        } for e in events
    ])

@router.get("/map", response_model=Dict[str, Any])
def get_weather_map(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns details for map rendering including plant locations, transmission zones, and overlay configurations.
    """
    return send_success({
        "radar_layer_url": "/api/v1/weather/simulated-radar",
        "cloud_overlay": {
            "density": 0.45,
            "movement_bearing": 240,
            "coverage_polygons": [
                {"center": [17.3850, 78.4867], "radius_km": 50, "intensity": 0.8},
                {"center": [17.8000, 78.2000], "radius_km": 120, "intensity": 0.4}
            ]
        },
        "wind_layer": {
            "bearing": 210,
            "gust_max": 22.0,
            "streamlines": [
                {"start": [17.0, 78.0], "end": [18.0, 79.0], "speed": 14.5}
            ]
        },
        "plant_locations": [
            {"id": "solar", "name": "Bhadla Solar Park", "type": "solar", "coords": [27.5385, 71.9168], "output_mw": 850},
            {"id": "wind", "name": "Jaisalmer Wind Park", "type": "wind", "coords": [26.9157, 70.9083], "output_mw": 450},
            {"id": "hydro", "name": "Tehri Dam", "type": "hydro", "coords": [30.3780, 78.4800], "output_mw": 1000},
            {"id": "nuclear", "name": "Kudankulam NPP", "type": "nuclear", "coords": [8.1678, 77.7103], "output_mw": 2000}
        ],
        "transmission_zones": [
            {"id": "zone_north", "name": "Northern Corridor", "boundary": [[25, 70], [32, 70], [32, 80], [25, 80]], "risk_level": "Medium"},
            {"id": "zone_south", "name": "Southern Corridor", "boundary": [[8, 75], [15, 75], [15, 80], [8, 80]], "risk_level": "Low"}
        ]
    })

@router.get("/alerts", response_model=Dict[str, Any])
def get_weather_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns active weather warnings.
    """
    telemetry = db.query(WeatherTelemetry).order_by(WeatherTelemetry.timestamp.desc()).first()
    alerts = telemetry.weather_alerts if telemetry and telemetry.weather_alerts else [
        {"title": "High Wind Alert", "severity": "High", "desc": "Wind speeds exceeding 25m/s at coastal farms", "time": "14:20"}
    ]
    return send_success(alerts)

@router.get("/impact", response_model=Dict[str, Any])
def get_weather_impact(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Exposes details of the weather impact parameters on generation mix.
    """
    impacts = db.query(WeatherImpact).all()
    if not impacts:
        impacts = [
            WeatherImpact(parameter="Cloud Cover", change_type="Increase", impacted_source="solar", mw_variation=-620.0, risk_level="Medium", recommendation="Battery Preservation Mode"),
            WeatherImpact(parameter="Storm Alert", change_type="Exceed Safe Threshold", impacted_source="wind", mw_variation=-740.0, risk_level="Critical", recommendation="Increase Hydro output. Maintain Emergency Reserve.")
        ]
    return send_success([
        {
            "id": imp.id,
            "parameter": imp.parameter,
            "change": imp.change_type,
            "impacted_source": imp.impacted_source,
            "mw_variation": imp.mw_variation,
            "risk_level": imp.risk_level,
            "recommendation": imp.recommendation
        } for imp in impacts
    ])

@router.get("/recommendations", response_model=Dict[str, Any])
def get_weather_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns grid policy dispatcher recommendations based on weather parameters.
    """
    impacts = db.query(WeatherImpact).all()
    recs = []
    for idx, imp in enumerate(impacts):
        recs.append({
            "id": idx + 1,
            "title": f"Weather Dispatch Action: {imp.parameter}",
            "description": f"Since {imp.parameter} triggers {imp.change_type}, expected {imp.impacted_source} output will drop by {imp.mw_variation} MW.",
            "recommendation": imp.recommendation,
            "confidence_score": 94.0 if imp.risk_level == "Critical" else 88.0
        })
    if not recs:
        recs = [{
            "id": 1,
            "title": "Battery Charging Preservation Mode",
            "description": "Cloud cover rising. Solar irradiance decreasing. Expected solar reduction of 620 MW.",
            "recommendation": "Delay battery discharge until peak hours. Increase Hydro output.",
            "confidence_score": 96.0
        }]
    return send_success(recs)

@router.get("/ai-insights", response_model=Dict[str, Any])
def get_weather_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Generates explainable AI intelligence analysis of meteorological conditions.
    """
    confidences = db.query(WeatherConfidence).all()
    conf_dict = {c.forecast_domain: c.confidence_score for c in confidences} if confidences else {
        "wind": 96.0, "solar": 91.0, "rain": 88.0, "demand": 94.0
    }
    
    return send_success({
        "explanation": "High wind speeds approaching western wind farms. Wind turbines may enter protection mode. Expected renewable reduction: 740 MW.",
        "forecast_confidence": conf_dict,
        "affected_sources": ["wind", "solar"],
        "policy_recommendation": "Increase Hydro dispatch by 400 MW. Keep Gas units spinning in standby mode.",
        "stability_score": 92.5
    })

@router.get("/renewable-forecast", response_model=Dict[str, Any])
def get_renewable_weather_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns renewable efficiency indices.
    """
    preds = db.query(RenewablePrediction).order_by(RenewablePrediction.timestamp.asc()).all()
    if not preds:
        return send_success({
            "solar_efficiency": 82.5,
            "wind_efficiency": 74.0,
            "renewable_potential": 85.0,
            "forecast_accuracy": 92.4,
            "storm_risk": 15.0
        })
    
    latest = preds[0]
    return send_success({
        "solar_efficiency": latest.efficiency,
        "wind_efficiency": latest.efficiency * 0.9,
        "renewable_potential": latest.potential_index,
        "forecast_accuracy": 91.8,
        "storm_risk": latest.wind_velocity * 2.0
    })
