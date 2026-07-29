from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database.connection import SessionLocal
from app.models.asset_models import (
    Asset, AssetCategory, AssetLocation, AssetMetadata, AssetHierarchy, AssetConfiguration, AssetHistory, AssetRegistry,
    AssetHealth, AssetMaintenance, InspectionRecord, ServiceRecord
)
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas for validation
class AssetLocationSchema(BaseModel):
    address: Optional[str] = None
    region: str
    zone: Optional[str] = None
    substation: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AssetMetadataSchema(BaseModel):
    voltage_level: Optional[float] = None
    capacity: Optional[float] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    owner: Optional[str] = None
    installation_date: Optional[datetime] = None
    commission_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    extra_attributes: Optional[Dict[str, Any]] = None

class RecommendationActionSchema(BaseModel):
    action_taken: str
    operator_notes: Optional[str] = None

class AssetCreateSchema(BaseModel):
    asset_id: str
    name: str
    type: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    location: AssetLocationSchema
    metadata: Optional[AssetMetadataSchema] = None

class AssetUpdateSchema(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[str] = None
    location: Optional[AssetLocationSchema] = None
    metadata: Optional[AssetMetadataSchema] = None

class ConfigUpdateSchema(BaseModel):
    key: str
    value: str

# Endpoints
@router.get("/dashboard")
def get_asset_dashboard(db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    
    total_assets = len(assets)
    
    # Group by category
    by_category = {}
    for a in assets:
        cat_name = a.category.name if a.category else "Uncategorized"
        by_category[cat_name] = by_category.get(cat_name, 0) + 1
        
    # Group by region
    by_region = {}
    for a in assets:
        reg_name = a.location.region if a.location else "Unknown"
        by_region[reg_name] = by_region.get(reg_name, 0) + 1

    # Group by status
    by_status = {}
    for a in assets:
        status_val = a.status or "active"
        by_status[status_val] = by_status.get(status_val, 0) + 1

    # Recently added
    recent_assets = []
    sorted_recent = sorted(assets, key=lambda x: x.created_at, reverse=True)[:5]
    for a in sorted_recent:
        recent_assets.append({
            "id": a.id,
            "asset_id": a.asset_id,
            "name": a.name,
            "type": a.type,
            "region": a.location.region if a.location else "Unknown",
            "status": a.status,
            "created_at": a.created_at
        })

    # Summary
    active_count = by_status.get("active", 0)
    registry_summary = {
        "active_percentage": round((active_count / total_assets * 100), 2) if total_assets > 0 else 0.0,
        "categories_count": db.query(AssetCategory).count(),
        "total_capacity_mw": sum(a.metadata_relation.capacity for a in assets if a.metadata_relation and a.metadata_relation.capacity) or 0.0
    }

    return {
        "total_assets": total_assets,
        "assets_by_category": by_category,
        "assets_by_region": by_region,
        "assets_by_status": by_status,
        "recently_added": recent_assets,
        "registry_summary": registry_summary
    }

@router.get("")
def list_assets(
    page: int = Query(1, ge=1),
    size: int = Query(15, ge=1, le=100),
    region: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    voltage_level: Optional[float] = None,
    health_status: Optional[str] = None,
    maintenance_status: Optional[str] = None,
    criticality: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Asset).filter(Asset.is_deleted == False)

    if region:
        query = query.join(AssetLocation).filter(AssetLocation.region == region)
    if type:
        query = query.filter(Asset.type == type)
    if status:
        query = query.filter(Asset.status == status)
    if voltage_level is not None:
        query = query.join(AssetMetadata).filter(AssetMetadata.voltage_level == voltage_level)
    
    if health_status:
        query = query.join(AssetHealth).filter(AssetHealth.condition == health_status)
    if maintenance_status:
        query = query.join(AssetMaintenance).filter(AssetMaintenance.maintenance_priority == maintenance_status)
    if criticality:
        # High criticality: score >= 80, Medium: 40-79, Low: < 40
        if not any(q.entity == AssetMaintenance for q in query.nested_entities if hasattr(q, "entity")):
            query = query.join(AssetMaintenance)
        if criticality == "High":
            query = query.filter(AssetMaintenance.criticality_score >= 80)
        elif criticality == "Medium":
            query = query.filter(AssetMaintenance.criticality_score >= 40, AssetMaintenance.criticality_score < 80)
        elif criticality == "Low":
            query = query.filter(AssetMaintenance.criticality_score < 40)
    
    if search:
        search_filter = f"%{search}%"
        query = query.join(AssetMetadata, isouter=True).join(AssetLocation, isouter=True).filter(
            (Asset.name.ilike(search_filter)) |
            (Asset.asset_id.ilike(search_filter)) |
            (Asset.type.ilike(search_filter)) |
            (AssetMetadata.manufacturer.ilike(search_filter)) |
            (AssetLocation.region.ilike(search_filter))
        )

    total = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()

    result_items = []
    for a in items:
        result_items.append({
            "id": a.id,
            "asset_id": a.asset_id,
            "name": a.name,
            "type": a.type,
            "description": a.description,
            "status": a.status,
            "region": a.location.region if a.location else "Unknown",
            "zone": a.location.zone if a.location else None,
            "substation": a.location.substation if a.location else None,
            "capacity": a.metadata_relation.capacity if a.metadata_relation else None,
            "voltage_level": a.metadata_relation.voltage_level if a.metadata_relation else None,
            "manufacturer": a.metadata_relation.manufacturer if a.metadata_relation else None,
            "model": a.metadata_relation.model if a.metadata_relation else None,
            "owner": a.metadata_relation.owner if a.metadata_relation else None,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
            "health_score": a.health.health_score if a.health else None,
            "condition": a.health.condition if a.health else None,
            "remaining_useful_life": a.health.remaining_useful_life if a.health else None,
            "failure_probability": a.maintenance.failure_probability if a.maintenance else None,
            "criticality_score": a.maintenance.criticality_score if a.maintenance else None,
            "maintenance_priority": a.maintenance.maintenance_priority if a.maintenance else None,
            "maintenance_schedule": a.maintenance.maintenance_schedule if a.maintenance else None
        })

    return {
        "items": result_items,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreateSchema, db: Session = Depends(get_db)):
    # Check if duplicate asset_id
    existing = db.query(Asset).filter(Asset.asset_id == payload.asset_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Asset ID already exists.")

    new_asset = Asset(
        asset_id=payload.asset_id,
        name=payload.name,
        type=payload.type,
        description=payload.description,
        category_id=payload.category_id,
        status="active"
    )
    db.add(new_asset)
    db.flush() # Populate new_asset.id

    # Create Location
    loc = AssetLocation(
        asset_id=new_asset.id,
        address=payload.location.address,
        region=payload.location.region,
        zone=payload.location.zone,
        substation=payload.location.substation,
        latitude=payload.location.latitude,
        longitude=payload.location.longitude
    )
    db.add(loc)

    # Create Metadata
    meta_payload = payload.metadata or AssetMetadataSchema()
    meta = AssetMetadata(
        asset_id=new_asset.id,
        voltage_level=meta_payload.voltage_level,
        capacity=meta_payload.capacity,
        manufacturer=meta_payload.manufacturer,
        model=meta_payload.model,
        serial_number=meta_payload.serial_number,
        owner=meta_payload.owner,
        installation_date=meta_payload.installation_date,
        commission_date=meta_payload.commission_date,
        tags=meta_payload.tags or [],
        extra_attributes=meta_payload.extra_attributes or {}
    )
    db.add(meta)

    # Create Registry Log
    reg = AssetRegistry(
        asset_id=new_asset.id,
        registration_status="Completed"
    )
    db.add(reg)

    # Write history
    history = AssetHistory(
        asset_id=new_asset.id,
        action="Registration",
        changed_by="Operator",
        after_value={
            "name": payload.name,
            "type": payload.type,
            "region": payload.location.region,
            "status": "active"
        }
    )
    db.add(history)

    db.commit()
    db.refresh(new_asset)
    return {"id": new_asset.id, "asset_id": new_asset.asset_id, "name": new_asset.name}

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(AssetCategory).all()
    return [{"id": c.id, "name": c.name, "description": c.description} for c in categories]

@router.get("/hierarchy")
def get_hierarchy(db: Session = Depends(get_db)):
    hierarchies = db.query(AssetHierarchy).all()
    # Build tree structure dynamically
    nodes = []
    for h in hierarchies:
        parent = db.query(Asset).filter(Asset.id == h.parent_id).first() if h.parent_id else None
        child = db.query(Asset).filter(Asset.id == h.child_id).first()
        if child:
            nodes.append({
                "id": child.id,
                "asset_id": child.asset_id,
                "name": child.name,
                "type": child.type,
                "level": h.level,
                "parent_id": h.parent_id,
                "parent_name": parent.name if parent else None
            })
    return nodes

@router.get("/configuration")
def get_configuration(db: Session = Depends(get_db)):
    configs = db.query(AssetConfiguration).all()
    return {c.key: c.value for c in configs}

@router.put("/configuration")
def update_configuration(payload: List[ConfigUpdateSchema], db: Session = Depends(get_db)):
    for conf in payload:
        db_conf = db.query(AssetConfiguration).filter(AssetConfiguration.key == conf.key).first()
        if db_conf:
            db_conf.value = conf.value
        else:
            db_conf = AssetConfiguration(key=conf.key, value=conf.value)
            db.add(db_conf)
    db.commit()
    return {"status": "success"}

@router.get("/{id}")
def get_asset_by_id(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    return {
        "id": asset.id,
        "asset_id": asset.asset_id,
        "name": asset.name,
        "type": asset.type,
        "description": asset.description,
        "status": asset.status,
        "category_id": asset.category_id,
        "location": {
            "address": asset.location.address if asset.location else None,
            "region": asset.location.region if asset.location else "Unknown",
            "zone": asset.location.zone if asset.location else None,
            "substation": asset.location.substation if asset.location else None,
            "latitude": asset.location.latitude if asset.location else None,
            "longitude": asset.location.longitude if asset.location else None
        } if asset.location else None,
        "metadata": {
            "voltage_level": asset.metadata_relation.voltage_level if asset.metadata_relation else None,
            "capacity": asset.metadata_relation.capacity if asset.metadata_relation else None,
            "manufacturer": asset.metadata_relation.manufacturer if asset.metadata_relation else None,
            "model": asset.metadata_relation.model if asset.metadata_relation else None,
            "serial_number": asset.metadata_relation.serial_number if asset.metadata_relation else None,
            "owner": asset.metadata_relation.owner if asset.metadata_relation else None,
            "installation_date": asset.metadata_relation.installation_date if asset.metadata_relation else None,
            "commission_date": asset.metadata_relation.commission_date if asset.metadata_relation else None,
            "tags": asset.metadata_relation.tags if asset.metadata_relation else [],
            "extra_attributes": asset.metadata_relation.extra_attributes if asset.metadata_relation else {}
        } if asset.metadata_relation else None
    }

@router.put("/{id}")
def update_asset(id: int, payload: AssetUpdateSchema, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    before_val = {
        "name": asset.name,
        "type": asset.type,
        "status": asset.status,
        "region": asset.location.region if asset.location else None
    }

    if payload.name is not None:
        asset.name = payload.name
    if payload.type is not None:
        asset.type = payload.type
    if payload.description is not None:
        asset.description = payload.description
    if payload.category_id is not None:
        asset.category_id = payload.category_id
    if payload.status is not None:
        asset.status = payload.status

    if payload.location:
        if not asset.location:
            asset.location = AssetLocation(asset_id=asset.id)
        if payload.location.region:
            asset.location.region = payload.location.region
        asset.location.address = payload.location.address
        asset.location.zone = payload.location.zone
        asset.location.substation = payload.location.substation
        asset.location.latitude = payload.location.latitude
        asset.location.longitude = payload.location.longitude

    if payload.metadata:
        if not asset.metadata_relation:
            asset.metadata_relation = AssetMetadata(asset_id=asset.id)
        asset.metadata_relation.voltage_level = payload.metadata.voltage_level
        asset.metadata_relation.capacity = payload.metadata.capacity
        asset.metadata_relation.manufacturer = payload.metadata.manufacturer
        asset.metadata_relation.model = payload.metadata.model
        asset.metadata_relation.serial_number = payload.metadata.serial_number
        asset.metadata_relation.owner = payload.metadata.owner
        asset.metadata_relation.installation_date = payload.metadata.installation_date
        asset.metadata_relation.commission_date = payload.metadata.commission_date
        asset.metadata_relation.tags = payload.metadata.tags or []
        asset.metadata_relation.extra_attributes = payload.metadata.extra_attributes or {}

    history = AssetHistory(
        asset_id=asset.id,
        action="Configuration Update",
        changed_by="Operator",
        before_value=before_val,
        after_value={
            "name": asset.name,
            "type": asset.type,
            "status": asset.status,
            "region": asset.location.region if asset.location else None
        }
    )
    db.add(history)
    db.commit()
    return {"status": "success"}

@router.delete("/{id}")
def delete_asset(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.soft_delete()
    
    history = AssetHistory(
        asset_id=asset.id,
        action="Status Change",
        changed_by="Operator",
        before_value={"status": "active"},
        after_value={"status": "deleted"}
    )
    db.add(history)
    db.commit()
    return {"status": "success"}

@router.get("/{id}/metadata")
def get_asset_metadata(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset or not asset.metadata_relation:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return {
        "asset_id": asset.asset_id,
        "name": asset.name,
        "voltage_level": asset.metadata_relation.voltage_level,
        "capacity": asset.metadata_relation.capacity,
        "manufacturer": asset.metadata_relation.manufacturer,
        "model": asset.metadata_relation.model,
        "serial_number": asset.metadata_relation.serial_number,
        "owner": asset.metadata_relation.owner,
        "installation_date": asset.metadata_relation.installation_date,
        "commission_date": asset.metadata_relation.commission_date,
        "tags": asset.metadata_relation.tags,
        "extra_attributes": asset.metadata_relation.extra_attributes
    }

@router.get("/{id}/history")
def get_asset_history(id: int, db: Session = Depends(get_db)):
    histories = db.query(AssetHistory).filter(AssetHistory.asset_id == id).order_by(AssetHistory.audit_timestamp.desc()).all()
    return [{
        "id": h.id,
        "action": h.action,
        "changed_by": h.changed_by,
        "before_value": h.before_value,
        "after_value": h.after_value,
        "audit_timestamp": h.audit_timestamp
    } for h in histories]

@router.get("/{id}/health")
def get_asset_health(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return {
        "asset_id": asset.asset_id,
        "name": asset.name,
        "health_score": asset.health.health_score if asset.health else 100.0,
        "condition": asset.health.condition if asset.health else "Nominal",
        "remaining_useful_life": asset.health.remaining_useful_life if asset.health else None,
        "efficiency": asset.health.efficiency if asset.health else None,
        "temperature": asset.health.temperature if asset.health else None,
        "performance_index": asset.health.performance_index if asset.health else None,
        "utilization": asset.health.utilization if asset.health else None,
        "availability": asset.health.availability if asset.health else None,
        "failure_probability": asset.maintenance.failure_probability if asset.maintenance else None,
        "criticality_score": asset.maintenance.criticality_score if asset.maintenance else None,
        "maintenance_priority": asset.maintenance.maintenance_priority if asset.maintenance else "Low",
        "maintenance_schedule": asset.maintenance.maintenance_schedule if asset.maintenance else None
    }

@router.get("/{id}/timeline")
def get_asset_timeline(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    events = []
    # 1. Installation
    if asset.metadata_relation and asset.metadata_relation.installation_date:
        events.append({
            "type": "Installation",
            "timestamp": asset.metadata_relation.installation_date,
            "title": "Asset Installed",
            "description": f"Component physically deployed by owner: {asset.metadata_relation.owner or 'System'}."
        })

    # 2. Commission
    if asset.metadata_relation and asset.metadata_relation.commission_date:
        events.append({
            "type": "Commission",
            "timestamp": asset.metadata_relation.commission_date,
            "title": "Grid Integration Commissioned",
            "description": "Component powered up and mapped to live telemetry."
        })

    # 3. Inspections
    for ins in asset.inspections:
        events.append({
            "type": "Inspection",
            "timestamp": ins.inspected_at,
            "title": f"Inspection Result: {ins.result}",
            "description": f"Inspector: {ins.inspector or 'Staff'}. Notes: {ins.notes or '—'}"
        })

    # 4. Services
    for svc in asset.services:
        events.append({
            "type": "Service",
            "timestamp": svc.serviced_at,
            "title": "Maintenance Servicing",
            "description": f"Technician: {svc.technician or 'Staff'}. Cost: ${svc.cost or 0}. Details: {svc.description or '—'}"
        })

    # 5. Planned Maintenance
    if asset.maintenance and asset.maintenance.maintenance_schedule:
        events.append({
            "type": "Planned Maintenance",
            "timestamp": asset.maintenance.maintenance_schedule,
            "title": "Scheduled Preventive Maintenance",
            "description": f"Priority clearance: {asset.maintenance.maintenance_priority}."
        })

    # 6. Predicted Failure
    if asset.maintenance and asset.maintenance.predicted_failure:
        events.append({
            "type": "Prediction",
            "timestamp": asset.maintenance.predicted_failure,
            "title": f"Predicted Failure (Prob: {int((asset.maintenance.failure_probability or 0) * 100)}%)",
            "description": f"RUL prognostic alert. Criticality score: {asset.maintenance.criticality_score or 0}."
        })

    # Sort chronological
    events.sort(key=lambda x: x["timestamp"])
    return events

@router.get("/{id}/inspections")
def get_inspections(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return [{
        "id": ins.id,
        "inspected_at": ins.inspected_at,
        "inspector": ins.inspector,
        "result": ins.result,
        "notes": ins.notes
    } for ins in asset.inspections]

@router.get("/{id}/services")
def get_services(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return [{
        "id": svc.id,
        "serviced_at": svc.serviced_at,
        "technician": svc.technician,
        "cost": svc.cost,
        "description": svc.description
    } for svc in asset.services]

@router.get("/health/summary")
def get_health_summary(db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    if not assets:
        return {}

    total = len(assets)
    avg_health = sum(a.health.health_score for a in assets if a.health) / len([a for a in assets if a.health]) if assets else 100.0
    
    by_condition = {"Nominal": 0, "Warning": 0, "Critical": 0}
    high_risk_assets = []
    
    for a in assets:
        if a.health:
            cond = a.health.condition
            by_condition[cond] = by_condition.get(cond, 0) + 1
            if cond in ["Warning", "Critical"] or (a.maintenance and a.maintenance.failure_probability > 0.15):
                high_risk_assets.append({
                    "id": a.id,
                    "asset_id": a.asset_id,
                    "name": a.name,
                    "type": a.type,
                    "health_score": a.health.health_score,
                    "condition": cond,
                    "failure_probability": a.maintenance.failure_probability if a.maintenance else 0.0,
                    "criticality_score": a.maintenance.criticality_score if a.maintenance else 0.0,
                    "region": a.location.region if a.location else "Unknown"
                })

    avg_rul = sum(a.health.remaining_useful_life for a in assets if a.health and a.health.remaining_useful_life) / len([a for a in assets if a.health and a.health.remaining_useful_life]) if assets else 0.0
    avg_eff = sum(a.health.efficiency for a in assets if a.health and a.health.efficiency) / len([a for a in assets if a.health and a.health.efficiency]) if assets else 0.0
    avg_temp = sum(a.health.temperature for a in assets if a.health and a.health.temperature) / len([a for a in assets if a.health and a.health.temperature]) if assets else 0.0
    avg_avail = sum(a.health.availability for a in assets if a.health and a.health.availability) / len([a for a in assets if a.health and a.health.availability]) if assets else 0.0
    avg_util = sum(a.health.utilization for a in assets if a.health and a.health.utilization) / len([a for a in assets if a.health and a.health.utilization]) if assets else 0.0
    avg_perf = sum(a.health.performance_index for a in assets if a.health and a.health.performance_index) / len([a for a in assets if a.health and a.health.performance_index]) if assets else 0.0

    return {
        "average_health_score": round(avg_health, 2),
        "by_condition": by_condition,
        "high_risk_assets": high_risk_assets,
        "average_remaining_useful_life": round(avg_rul, 2),
        "average_efficiency": round(avg_eff, 2),
        "average_temperature": round(avg_temp, 2),
        "average_availability": round(avg_avail, 2),
        "average_utilization": round(avg_util, 2),
        "average_performance_index": round(avg_perf, 2)
    }

@router.get("/maintenance/summary")
def get_maintenance_summary(db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    
    upcoming = []
    overdue = []
    
    now = datetime.utcnow()
    for a in assets:
        if a.maintenance and a.maintenance.maintenance_schedule:
            sched = a.maintenance.maintenance_schedule
            priority = a.maintenance.maintenance_priority
            
            # Check overdue vs upcoming
            record = {
                "id": a.id,
                "asset_id": a.asset_id,
                "name": a.name,
                "type": a.type,
                "schedule": sched,
                "priority": priority,
                "failure_probability": a.maintenance.failure_probability,
                "criticality_score": a.maintenance.criticality_score,
                "region": a.location.region if a.location else "Unknown"
            }
            if sched < now:
                overdue.append(record)
            else:
                upcoming.append(record)

    # Sort upcoming by earliest scheduled date first
    upcoming.sort(key=lambda x: x["schedule"])
    overdue.sort(key=lambda x: x["schedule"])

    by_priority = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for a in assets:
        if a.maintenance:
            pri = a.maintenance.maintenance_priority
            by_priority[pri] = by_priority.get(pri, 0) + 1

    return {
        "upcoming_maintenance": upcoming,
        "overdue_maintenance": overdue,
        "by_priority": by_priority
    }

@router.get("/{id}/ai-insights")
def get_ai_insights(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    insight = asset.ai_insights
    if not insight:
        return {}

    return {
        "id": insight.id,
        "recommendation": insight.recommendation,
        "reasoning": insight.reasoning,
        "root_cause": insight.root_cause,
        "failure_explanation": insight.failure_explanation,
        "maintenance_suggestion": insight.maintenance_suggestion,
        "operational_advice": insight.operational_advice,
        "replacement_recommendation": insight.replacement_recommendation,
        "spare_part_recommendation": insight.spare_part_recommendation,
        "confidence_score": insight.confidence_score,
        "priority": insight.priority,
        "expected_impact": insight.expected_impact
    }

@router.get("/{id}/recommendations/history")
def get_recommendations_history(id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    history = asset.recommendation_history
    return [{
        "id": h.id,
        "recommendation": h.recommendation,
        "priority": h.priority,
        "action_taken": h.action_taken,
        "operator_notes": h.operator_notes,
        "created_at": h.created_at
    } for h in history]

@router.post("/{id}/recommendations/history")
def add_recommendation_history(id: int, payload: RecommendationActionSchema, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id, Asset.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    rec_text = asset.ai_insights.recommendation if asset.ai_insights else "No active recommendation"
    rec_prio = asset.ai_insights.priority if asset.ai_insights else "Low"

    new_hist = AssetRecommendationHistory(
        asset_id=asset.id,
        recommendation=rec_text,
        priority=rec_prio,
        action_taken=payload.action_taken,
        operator_notes=payload.operator_notes
    )
    db.add(new_hist)
    db.commit()
    return {"status": "success", "id": new_hist.id}

@router.get("/ai/summary")
def get_ai_summary(db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    
    total_assets = len(assets)
    avg_health = sum(a.health.health_score for a in assets if a.health) / len([a for a in assets if a.health]) if assets else 100.0
    
    high_risk = []
    recent_insights = []
    recommended_actions = []

    for a in assets:
        insight = a.ai_insights
        health_info = a.health
        maint_info = a.maintenance
        
        if insight:
            rec_item = {
                "id": a.id,
                "asset_id": a.asset_id,
                "name": a.name,
                "type": a.type,
                "recommendation": insight.recommendation,
                "priority": insight.priority,
                "confidence_score": insight.confidence_score,
                "expected_impact": insight.expected_impact,
                "health_score": health_info.health_score if health_info else 100.0,
                "region": a.location.region if a.location else "Unknown"
            }
            recent_insights.append(rec_item)
            
            if insight.priority in ["High", "Critical"]:
                high_risk.append(rec_item)
                recommended_actions.append({
                    "id": a.id,
                    "asset_id": a.asset_id,
                    "name": a.name,
                    "action": insight.recommendation,
                    "reason": insight.root_cause,
                    "priority": insight.priority,
                    "impact": insight.expected_impact
                })

    return {
        "average_health": round(avg_health, 2),
        "high_risk_assets": high_risk,
        "recent_insights": recent_insights[:10],
        "recommended_actions": recommended_actions
    }

@router.get("/risk/summary")
def get_risk_summary(db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    
    high_risk_count = 0
    med_risk_count = 0
    low_risk_count = 0
    
    fail_prob_dist = {
        "0-10%": 0,
        "10-30%": 0,
        "30-50%": 0,
        "50-70%": 0,
        "70%++": 0
    }
    
    criticality_overview = []

    for a in assets:
        maint = a.maintenance
        health = a.health
        
        if maint and health:
            prob = maint.failure_probability or 0.0
            score = maint.criticality_score or 0.0
            
            # Risk buckets
            if prob >= 0.20 or health.condition in ["Warning", "Critical"]:
                high_risk_count += 1
            elif prob >= 0.05:
                med_risk_count += 1
            else:
                low_risk_count += 1
                
            # Prob dist
            if prob < 0.10:
                fail_prob_dist["0-10%"] += 1
            elif prob < 0.30:
                fail_prob_dist["10-30%"] += 1
            elif prob < 0.50:
                fail_prob_dist["30-50%"] += 1
            elif prob < 0.70:
                fail_prob_dist["50-70%"] += 1
            else:
                fail_prob_dist["70%++"] += 1
                
            criticality_overview.append({
                "id": a.id,
                "asset_id": a.asset_id,
                "name": a.name,
                "type": a.type,
                "failure_probability": prob,
                "criticality_score": score,
                "condition": health.condition,
                "priority": maint.maintenance_priority
            })

    # Sort criticality_overview by score desc
    criticality_overview.sort(key=lambda x: x["criticality_score"], reverse=True)

    return {
        "high_risk_count": high_risk_count,
        "medium_risk_count": med_risk_count,
        "low_risk_count": low_risk_count,
        "failure_probability_distribution": [
            {"range": k, "count": v} for k, v in fail_prob_dist.items()
        ],
        "criticality_overview": criticality_overview
    }

@router.get("/{id}/lifecycle")
async def get_asset_lifecycle_details(id: int, db: Session = Depends(get_db)):
    from app.models.asset_models import AssetLifecycle
    lc = db.query(AssetLifecycle).filter(AssetLifecycle.asset_id == id).first()
    if not lc:
        return {}
    return {
        "id": lc.id,
        "asset_id": lc.asset_id,
        "stage": lc.stage,
        "age": lc.age,
        "remaining_useful_life": lc.remaining_useful_life,
        "maintenance_cost": lc.maintenance_cost,
        "replacement_cost": lc.replacement_cost,
        "downtime_hours": lc.downtime_hours,
        "uptime_hours": lc.uptime_hours,
        "availability": lc.availability,
        "performance_benchmark": lc.performance_benchmark,
        "efficiency_trend": lc.efficiency_trend,
        "criticality_ranking": lc.criticality_ranking,
        "lifecycle_cost": lc.lifecycle_cost,
        "risk_ranking": lc.risk_ranking
    }

@router.get("/lifecycle/summary")
async def get_asset_lifecycle_summary(db: Session = Depends(get_db)):
    from app.models.asset_models import AssetLifecycle, Asset
    lcs = db.query(AssetLifecycle).all()
    if not lcs:
        return {
            "total_replacement_cost": 0.0,
            "average_age": 0.0,
            "total_downtime": 0.0,
            "average_availability": 100.0,
            "assets_near_eol_count": 0,
            "stage_distribution": {}
        }
    
    total_replacement_cost = sum(x.replacement_cost for x in lcs)
    average_age = sum(x.age for x in lcs) / len(lcs)
    total_downtime = sum(x.downtime_hours for x in lcs)
    average_availability = sum(x.availability for x in lcs) / len(lcs)
    assets_near_eol = sum(1 for x in lcs if x.remaining_useful_life and x.remaining_useful_life <= 3.0)
    
    stage_dist = {}
    for x in lcs:
        stage_dist[x.stage] = stage_dist.get(x.stage, 0) + 1
        
    return {
        "total_replacement_cost": total_replacement_cost,
        "average_age": round(average_age, 2),
        "total_downtime": total_downtime,
        "average_availability": round(average_availability, 2),
        "assets_near_eol_count": assets_near_eol,
        "stage_distribution": stage_dist
    }

@router.get("/performance/summary")
async def get_asset_performance_summary(db: Session = Depends(get_db)):
    from app.models.asset_models import AssetLifecycle, Asset
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    
    performance_list = []
    for a in assets:
        if a.lifecycle:
            performance_list.append({
                "id": a.id,
                "asset_id": a.asset_id,
                "name": a.name,
                "type": a.type,
                "performance_benchmark": a.lifecycle.performance_benchmark,
                "efficiency_trend": a.lifecycle.efficiency_trend,
                "availability": a.lifecycle.availability,
                "lifecycle_cost": a.lifecycle.lifecycle_cost,
                "maintenance_cost": a.lifecycle.maintenance_cost
            })
            
    # Sort by performance
    top_performing = sorted(performance_list, key=lambda x: x["performance_benchmark"], reverse=True)[:3]
    lowest_performing = sorted(performance_list, key=lambda x: x["performance_benchmark"])[:3]
    
    return {
        "all_assets": performance_list,
        "top_performing": top_performing,
        "lowest_performing": lowest_performing
    }

@router.get("/criticality/summary")
async def get_asset_criticality_summary(db: Session = Depends(get_db)):
    from app.models.asset_models import AssetLifecycle, Asset
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    
    critical_assets = []
    high_risk_assets = []
    near_eol_assets = []
    high_maint_assets = []
    highest_downtime_assets = []
    
    for a in assets:
        if a.lifecycle:
            record = {
                "id": a.id,
                "asset_id": a.asset_id,
                "name": a.name,
                "type": a.type,
                "criticality_ranking": a.lifecycle.criticality_ranking,
                "risk_ranking": a.lifecycle.risk_ranking,
                "age": a.lifecycle.age,
                "remaining_useful_life": a.lifecycle.remaining_useful_life,
                "maintenance_cost": a.lifecycle.maintenance_cost,
                "downtime_hours": a.lifecycle.downtime_hours
            }
            
            if a.lifecycle.criticality_ranking and a.lifecycle.criticality_ranking >= 7:
                critical_assets.append(record)
            if a.lifecycle.risk_ranking and a.lifecycle.risk_ranking >= 7:
                high_risk_assets.append(record)
            if a.lifecycle.remaining_useful_life and a.lifecycle.remaining_useful_life <= 3.0:
                near_eol_assets.append(record)
            if a.lifecycle.maintenance_cost >= 4000.0:
                high_maint_assets.append(record)
            if a.lifecycle.downtime_hours >= 40.0:
                highest_downtime_assets.append(record)
                
    return {
        "critical_assets": critical_assets,
        "high_risk_assets": high_risk_assets,
        "near_eol_assets": near_eol_assets,
        "high_maintenance_cost_assets": high_maint_assets,
        "highest_downtime_assets": highest_downtime_assets
    }


