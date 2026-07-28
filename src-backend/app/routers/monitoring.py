from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.security import PermissionGuard
from app.models.auth_models import User
from app.schemas.monitoring_schemas import (
    MeasurementCreate, MeasurementBulkCreate, 
    MeasurementResponse, AssetHealthResponse
)
from app.services.monitoring_service import MonitoringService
from app.core.response import send_success

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> MonitoringService:
    return MonitoringService(db)

@router.post("/measurements", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Ingest Telemetry Data")
async def ingest_measurements(
    data: MeasurementBulkCreate,
    service: MonitoringService = Depends(get_service),
    current_user: User = Depends(PermissionGuard("monitoring:write"))
):
    """
    Ingests a batch of real-time measurements from sensors/SCADA.
    Validates, applies quality scores, streams events, and stores history.
    """
    result = await service.ingest_measurements(data.measurements)
    return send_success(result, message="Telemetry ingested successfully")

@router.get("/measurements/latest", response_model=dict, summary="Get Latest Measurements")
def get_latest_measurements(
    asset_id: Optional[str] = Query(None, description="Filter by Asset ID"),
    measurement_type: Optional[str] = Query(None, description="Filter by Measurement Type"),
    service: MonitoringService = Depends(get_service),
    current_user: User = Depends(PermissionGuard("monitoring:read"))
):
    """Retrieves the most recent state (cache) for assets."""
    records = service.get_latest_measurements(asset_id, measurement_type)
    return send_success([r.__dict__ for r in records], message="Latest measurements retrieved")

@router.get("/measurements/history", response_model=dict, summary="Get Historical Measurements")
def get_historical_measurements(
    asset_id: Optional[str] = Query(None, description="Filter by Asset ID"),
    measurement_type: Optional[str] = Query(None, description="Filter by Measurement Type"),
    start_time: Optional[datetime] = Query(None, description="Start time (ISO8601)"),
    end_time: Optional[datetime] = Query(None, description="End time (ISO8601)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    service: MonitoringService = Depends(get_service),
    current_user: User = Depends(PermissionGuard("monitoring:read"))
):
    """Retrieves paginated historical time-series data."""
    result = service.get_historical_measurements(
        page, page_size, asset_id, measurement_type, start_time, end_time
    )
    return send_success(result)

import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
from app.core.streaming import event_bus

@router.websocket("/stream")
async def monitoring_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming.
    Subscribes to the InMemoryEventBus and streams incoming measurements.
    """
    await websocket.accept()
    queue = asyncio.Queue()
    
    # Callback to push events into the queue
    def on_event(message: dict):
        # Fire-and-forget push to queue to avoid blocking the event bus
        try:
            queue.put_nowait(message)
        except Exception:
            pass

    # We subscribe to a wildcard-like concept. In InMemoryEventBus we need to subscribe to all topics.
    # To keep things simple for this demo, we'll patch the bus to allow a global listener, or subscribe to a special "global" topic.
    # We will modify InMemoryEventBus later if needed, but for now, we'll subscribe to a special 'global_telemetry' topic.
    event_bus.subscribe("global_telemetry", on_event)
    
    try:
        while True:
            # Wait for new data from the queue
            data = await queue.get()
            await websocket.send_text(json.dumps(data))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # In a real app we'd need to unsubscribe, but InMemoryEventBus doesn't have it implemented yet.
        pass

