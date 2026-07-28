from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.connection import get_db
from app.core.security import PermissionGuard, get_current_user
from app.models.auth_models import User
from app.models.integration_models import IntegrationConfig, TelemetryData, DataQualityLog
from app.schemas.integration_schemas import (
    IntegrationConfigCreate, 
    IntegrationConfigResponse, 
    IntegrationHealthResponse
)
from app.services.integration_service import integration_manager

router = APIRouter(tags=["Integration"])

@router.get("/health", response_model=List[IntegrationHealthResponse])
def get_all_health(
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    """
    Retrieves the real-time health and metrics of all running integration connectors.
    """
    return integration_manager.get_all_health()

@router.post("/{name}/start", status_code=status.HTTP_200_OK)
async def start_connector(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:write"))
):
    """
    Starts a specific integration connector by name.
    """
    config = db.query(IntegrationConfig).filter(IntegrationConfig.name == name).first()
    if not config:
        raise HTTPException(status_code=404, detail="Connector configuration not found.")
        
    success = await integration_manager.start_connector(config.name, config.provider_type, config.settings)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to start connector. It may already be running or configured incorrectly.")
        
    return {"message": f"Connector {name} started successfully."}

@router.post("/{name}/stop", status_code=status.HTTP_200_OK)
async def stop_connector(
    name: str,
    current_user: User = Depends(PermissionGuard("admin:write"))
):
    """
    Stops a running integration connector.
    """
    success = await integration_manager.stop_connector(name)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to stop connector. It may not be running.")
        
    return {"message": f"Connector {name} stopped successfully."}

@router.get("/configs", response_model=List[IntegrationConfigResponse])
def get_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    """
    List all integration configurations.
    """
    return db.query(IntegrationConfig).all()

@router.post("/configs", response_model=IntegrationConfigResponse, status_code=status.HTTP_201_CREATED)
def create_config(
    config: IntegrationConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:write"))
):
    """
    Creates a new integration configuration. Does not automatically start it.
    """
    db_config = db.query(IntegrationConfig).filter(IntegrationConfig.name == config.name).first()
    if db_config:
        raise HTTPException(status_code=400, detail="Configuration with this name already exists.")
        
    new_config = IntegrationConfig(**config.model_dump())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

@router.get("/telemetry/{metric_name}")
def get_telemetry(
    metric_name: str,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Fetch unified time-series telemetry data by metric name (e.g., temperature, demand, ghi).
    """
    records = db.query(TelemetryData)\
        .filter(TelemetryData.metric_name == metric_name)\
        .order_by(TelemetryData.timestamp.desc())\
        .limit(limit)\
        .all()
    return records

@router.get("/quality")
def get_data_quality_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    """
    Fetch data quality issue logs (stale data, missing values, etc).
    """
    logs = db.query(DataQualityLog)\
        .order_by(DataQualityLog.timestamp.desc())\
        .limit(limit)\
        .all()
    return logs
