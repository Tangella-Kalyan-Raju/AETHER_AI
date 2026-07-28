from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.core.security import get_current_user
from app.services.digital_twin.engine import DigitalTwinEngine

router = APIRouter()

@router.get("/assets")
async def get_dt_assets(
    type: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    engine = DigitalTwinEngine(db)
    return engine.get_assets(filter_type=type)

@router.get("/assets/{id}")
async def get_dt_asset_by_id(
    id: str,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    engine = DigitalTwinEngine(db)
    assets = engine.get_assets()
    for a in assets:
        if a["id"] == id:
            return a
    raise HTTPException(status_code=404, detail="Asset not found")

@router.get("/grid/topology")
async def get_dt_topology(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    engine = DigitalTwinEngine(db)
    return engine.get_topology()

@router.get("/grid/regions")
async def get_dt_regions(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Mocking standard regions
    return ["Northern Region", "Southern Region", "Eastern Region", "Western Region"]
