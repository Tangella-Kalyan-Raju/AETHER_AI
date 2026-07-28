import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_user, PermissionGuard
from app.models.auth_models import User
from app.schemas.engineering_schemas import (
    EngRegionResponse, EngAssetResponse, EngGeneratorResponse, 
    EngTransmissionLineResponse, EngBatteryStorageResponse,
    RenewableGenerationResponse, DemandProfileResponse, WeatherProfileResponse
)
from app.repositories.engineering_repository import EngineeringRepository
from app.importers.ieee_importer import IEEEImporter

router = APIRouter()
logger = logging.getLogger("gpo.api.engineering")

def get_repo(db: Session = Depends(get_db)) -> EngineeringRepository:
    return EngineeringRepository(db)

# --- Regions ---
@router.get("/regions", response_model=List[EngRegionResponse])
def get_regions(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    q: Optional[str] = Query(None, description="Search region by name"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_regions(skip, limit, search=q)

@router.get("/regions/{region_id}", response_model=EngRegionResponse)
def get_region(
    region_id: str,
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    region = repo.get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    return region

# --- Assets ---
@router.get("/assets", response_model=List[EngAssetResponse])
def get_assets(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    q: Optional[str] = Query(None, description="Search asset by name"),
    region_id: Optional[str] = Query(None, description="Filter by region ID"),
    type: Optional[str] = Query(None, description="Filter by asset type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_assets(skip, limit, search=q, region_id=region_id, asset_type=type, status=status)

@router.get("/assets/{asset_id}", response_model=EngAssetResponse)
def get_asset(
    asset_id: str,
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    asset = repo.get_asset_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

# --- Generators ---
@router.get("/generators", response_model=List[EngGeneratorResponse])
def get_generators(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    q: Optional[str] = Query(None, description="Search generator by name"),
    region_id: Optional[str] = Query(None, description="Filter by region ID"),
    type: Optional[str] = Query(None, description="Filter by generator type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_generators(skip, limit, search=q, region_id=region_id, generator_type=type, status=status)

# --- Transmission Lines ---
@router.get("/transmission-lines", response_model=List[EngTransmissionLineResponse])
def get_transmission_lines(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    q: Optional[str] = Query(None, description="Search transmission line by name"),
    region_id: Optional[str] = Query(None, description="Filter by region ID"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_transmission_lines(skip, limit, search=q, region_id=region_id)

# --- Battery Storage ---
@router.get("/battery-storage", response_model=List[EngBatteryStorageResponse])
def get_battery_storage(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    q: Optional[str] = Query(None, description="Search battery storage by name"),
    region_id: Optional[str] = Query(None, description="Filter by region ID"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_battery_storage(skip, limit, search=q, region_id=region_id)

# --- Renewables ---
@router.get("/renewables", response_model=List[RenewableGenerationResponse])
def get_renewables(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    type: Optional[str] = Query(None, description="Filter by renewable type (solar, wind)"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_renewables(skip, limit, type=type, start_date=start_date, end_date=end_date)

# --- Demand ---
@router.get("/demand", response_model=List[DemandProfileResponse])
def get_demand(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    region_id: Optional[str] = Query(None, description="Filter by region ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_demand_profiles(skip, limit, region=region_id, start_date=start_date, end_date=end_date)

# --- Weather ---
@router.get("/weather", response_model=List[WeatherProfileResponse])
def get_weather(
    skip: int = Query(0, ge=0), limit: int = Query(100, le=1000),
    region_id: Optional[str] = Query(None, description="Filter by region ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("assets:view"))
):
    return repo.get_weather_profiles(skip, limit, region_id=region_id, start_date=start_date, end_date=end_date)

# --- Dataset Import ---
@router.post("/import/ieee")
async def import_ieee_dataset(
    system_type: str = Form(...),
    region_id: str = Form(...),
    dry_run: bool = Form(False, description="Simulate import without saving to database"),
    file: UploadFile = File(...),
    repo: EngineeringRepository = Depends(get_repo),
    current_user: User = Depends(PermissionGuard("admin:view"))
):
    """
    Upload and import an IEEE dataset. Supports JSON and CSV formats.
    Secured by admin-level access.
    """
    if file.content_type not in ["application/json", "text/csv", "application/vnd.ms-excel"]:
        logger.warning(f"Unexpected content type {file.content_type}, but attempting to parse anyway.")
    
    content = await file.read()
    
    importer = IEEEImporter(repository=repo, system_type=system_type, region_id=region_id, dry_run=dry_run)
    try:
        stats = importer.import_dataset(content.decode("utf-8"))
        logger.info(f"Dataset imported successfully by {current_user.email}")
        return {"status": "success", "stats": stats}
    except Exception as e:
        logger.error(f"Dataset import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
