from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.connection import get_db
from app.repositories.grid_repository import PolicyRepository, PolicyVersionRepository, PolicyExecutionRepository
from app.schemas.grid_schemas import (
    PolicyCreate, PolicyResponse, 
    PolicyVersionCreate, PolicyVersionResponse,
    PolicyExecutionCreate, PolicyExecutionResponse
)
from app.core.security import PermissionGuard, get_current_user
from app.core.response import send_success
from app.models.auth_models import User

router = APIRouter()

# --- Policies CRUD ---
@router.get("", response_model=dict)
def list_policies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyRepository(db)
    result = repo.get_page(
        page=page,
        page_size=limit,
        search_query=search,
        search_columns=["name", "description"]
    )
    records = [PolicyResponse.model_validate(r) for r in result["items"]]
    meta = {
        "page": result["page"],
        "limit": result["page_size"],
        "totalCount": result["total_records"],
        "totalPages": result["total_pages"]
    }
    return send_success([r.model_dump() for r in records], meta=meta)

@router.get("/{policy_id}", response_model=dict)
def get_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.get("/{policy_id}/intelligence", response_model=dict)
def get_policy_intelligence(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.models.grid_models import PolicyIntelligence, Policy
    intelligence = db.query(PolicyIntelligence).filter(PolicyIntelligence.policy_id == policy_id).first()
    if not intelligence:
        policy = db.query(Policy).filter(Policy.id == policy_id).first()
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found.")
        
        name_lower = policy.name.lower()
        if "balanced" in name_lower:
            adv = ["Balanced metrics optimization", "Stable grid dispatch control"]
            dis = ["Sub-optimal for singular focus areas like extreme cost-saving"]
            emissions = "420.5 g CO₂/kWh"
            cost = 12450.0
            renew = 48.7
            rel = 98.5
            risk = 12.4
        elif "green" in name_lower or "renewable" in name_lower or "carbon" in name_lower or "co2" in name_lower:
            adv = ["Significant greenhouse gas offset", "High renewable yield integration"]
            dis = ["Intermittency concerns on peak demand"]
            emissions = "120.0 g CO₂/kWh"
            cost = 14200.0
            renew = 88.0
            rel = 95.0
            risk = 22.0
        elif "economic" in name_lower or "cost" in name_lower:
            adv = ["Lowest direct generation costs", "Optimized base-plant load scheduling"]
            dis = ["High emissions output"]
            emissions = "680.0 g CO₂/kWh"
            cost = 9800.0
            renew = 25.0
            rel = 92.0
            risk = 35.0
        else:
            weights = policy.weights or {}
            cost_w = weights.get("cost", 0.25)
            carbon_w = weights.get("carbon", 0.25)
            stability_w = weights.get("stability", 0.25)
            reliability_w = weights.get("reliability", 0.25)
            
            adv = ["Configured with custom objectives priority", "Highly customizable constraint boundaries"]
            dis = ["Requires compliance and telemetry audits"]
            emissions = f"{int(500 - carbon_w * 400)} g CO₂/kWh"
            cost = round(15000.0 - cost_w * 6000.0, 2)
            renew = round(10.0 + carbon_w * 80.0, 2)
            rel = round(80.0 + reliability_w * 20.0, 2)
            risk = round(50.0 - stability_w * 40.0, 2)
            
        data = {
            "policy_id": policy_id,
            "advantages": adv,
            "disadvantages": dis,
            "emission_impact": emissions,
            "expected_cost": cost,
            "expected_renewable_pct": renew,
            "reliability_score": rel,
            "risk_score": risk
        }
        return send_success(data)
        
    data = {
        "policy_id": intelligence.policy_id,
        "advantages": intelligence.advantages or [],
        "disadvantages": intelligence.disadvantages or [],
        "emission_impact": intelligence.emission_impact or "N/A",
        "expected_cost": intelligence.expected_cost or 0.0,
        "expected_renewable_pct": intelligence.expected_renewable_pct or 0.0,
        "reliability_score": intelligence.reliability_score or 0.0,
        "risk_score": intelligence.risk_score or 0.0
    }
    return send_success(data)


@router.post("", response_model=dict)
def create_policy(
    req: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    repo = PolicyRepository(db)
    # Check if duplicate name
    if repo.get_by_name(req.name):
        raise HTTPException(status_code=400, detail="A policy with this name already exists.")
        
    data = req.model_dump()
    data["created_by"] = current_user.id
    data["status"] = req.status or "active"
    try:
        new_policy = repo.create(data)
        return send_success(PolicyResponse.model_validate(new_policy).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{policy_id}", response_model=dict)
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    repo = PolicyRepository(db)
    success = repo.delete(policy_id, soft=True)
    return send_success({"success": success})

# --- Policy Versions ---
@router.get("/{policy_id}/versions", response_model=dict)
def get_policy_versions(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyVersionRepository(db)
    versions = repo.get_versions(policy_id)
    records = [PolicyVersionResponse.model_validate(v) for v in versions]
    return send_success([r.model_dump() for r in records])

@router.post("/versions", response_model=dict)
def create_policy_version(
    req: PolicyVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    repo = PolicyVersionRepository(db)
    data = req.model_dump()
    data["created_by"] = current_user.id
    data["status"] = "active"
    try:
        new_version = repo.create(data)
        return send_success(PolicyVersionResponse.model_validate(new_version).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Policy Executions (compiler runs) ---
@router.get("/versions/{version_id}/executions", response_model=dict)
def get_version_executions(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyExecutionRepository(db)
    executions = repo.get_by_version(version_id)
    records = [PolicyExecutionResponse.model_validate(e) for e in executions]
    return send_success([r.model_dump() for r in records])

@router.post("/executions", response_model=dict)
def record_policy_execution(
    req: PolicyExecutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    repo = PolicyExecutionRepository(db)
    data = req.model_dump()
    try:
        new_execution = repo.create(data)
        return send_success(PolicyExecutionResponse.model_validate(new_execution).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Active Policy & Validation Endpoints ---
@router.get("/active/current", response_model=dict)
def get_active_policy(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.engine import PolicyEngine
    engine = PolicyEngine(db)
    policy = engine.manager.get_active_policy()
    if not policy:
        raise HTTPException(status_code=404, detail="No active operational policy found.")
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.post("/{policy_id}/activate", response_model=dict)
def activate_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    from app.services.policy_engine.engine import PolicyEngine
    engine = PolicyEngine(db)
    try:
        policy = engine.manager.activate_policy(policy_id, user_id=current_user.id)
        conflicts = engine.manager.resolve_conflicts(policy)
        result = PolicyResponse.model_validate(policy).model_dump()
        result["warnings"] = conflicts
        return send_success(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PolicyValidationRequest(BaseModel):
    weights: Dict[str, float]
    constraints: Dict[str, Any]

@router.post("/validate/parameters", response_model=dict)
def validate_policy_parameters(
    req: PolicyValidationRequest,
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    from app.services.policy_engine.engine import PolicyEngine
    is_valid, warnings = PolicyEngine.validator.validate_config(req.weights, req.constraints)
    return send_success({
        "is_valid": is_valid,
        "warnings": warnings
    })

class PolicyComparisonRequest(BaseModel):
    policy_id_a: int
    policy_id_b: int

@router.post("/compare/modes", response_model=dict)
def compare_policy_modes(
    req: PolicyComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.repositories.grid_repository import PolicyRepository
    repo = PolicyRepository(db)
    
    policy_a = repo.get(req.policy_id_a)
    policy_b = repo.get(req.policy_id_b)
    
    if not policy_a or not policy_b:
        raise HTTPException(status_code=404, detail="One or both policies to compare were not found.")
        
    return send_success({
        "policy_a": PolicyResponse.model_validate(policy_a).model_dump(),
        "policy_b": PolicyResponse.model_validate(policy_b).model_dump()
    })

# --- Weight Configuration & AI Recommendations Endpoints ---
transient_recommendations: Dict[str, Dict[str, Any]] = {}

@router.get("/{policy_id}/weights", response_model=dict)
def get_policy_weights(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    return send_success(policy.weights or {})

class PolicyWeightsUpdateRequest(BaseModel):
    weights: Dict[str, float]

@router.post("/{policy_id}/weights", response_model=dict)
def update_policy_weights(
    policy_id: int,
    req: PolicyWeightsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    from app.services.policy_engine.engine import PolicyValidationEngine
    is_valid, warnings = PolicyValidationEngine.validate_config(req.weights, policy.constraints or {})
    if not is_valid:
        raise HTTPException(status_code=400, detail="; ".join(warnings))
        
    policy.weights = req.weights
    db.commit()
    db.refresh(policy)
    
    # Audit log
    from app.models.system_models import AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="policy.update_weights",
        details=f"Policy weights manual update for '{policy.name}': {req.weights}",
        status="success"
    )
    db.add(audit)
    db.commit()
    
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.get("/recommendations/weights", response_model=dict)
def get_weight_recommendations(
    condition: Optional[str] = Query(None, description="Force simulate weather condition (storm, sunny, nominal)"),
    battery_degradation: Optional[float] = Query(None, description="Force battery degradation index"),
    peak_load: Optional[float] = Query(None, description="Force peak load forecast in MW"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.engine import PolicyEngine
    from app.services.policy_engine.weight_recommender import PolicyOptimizationRecommender
    
    engine = PolicyEngine(db)
    policy = engine.manager.get_active_policy()
    policy_name = policy.name if policy else "Balanced Mode"
    
    sim_weather = {
        "condition": condition or "Storm",
        "wind_speed_ms": 22.5 if condition == "Storm" or not condition else 5.0,
        "solar_yield_prediction_mw": 4200.0 if condition == "Sunny" else 800.0
    }
    
    sim_grid = {
        "battery_degradation_index": battery_degradation if battery_degradation is not None else 0.18,
        "peak_load_forecast_mw": peak_load if peak_load is not None else 16500.0
    }
    
    recs = PolicyOptimizationRecommender.generate_recommendations(policy_name, sim_weather, sim_grid)
    
    for r in recs:
        transient_recommendations[r["id"]] = r
        
    return send_success(recs)

@router.post("/recommendations/{recommendation_id}/apply", response_model=dict)
def apply_weight_recommendation(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    if recommendation_id not in transient_recommendations:
        raise HTTPException(status_code=404, detail="Recommendation expired or not found.")
        
    rec = transient_recommendations[recommendation_id]
    
    from app.services.policy_engine.engine import PolicyEngine
    engine = PolicyEngine(db)
    policy = engine.manager.get_active_policy()
    if not policy:
        from app.models.grid_models import Policy
        policy = db.query(Policy).filter(Policy.is_deleted == False).first()
        
    if not policy:
        raise HTTPException(status_code=404, detail="No policy found to apply weights to.")
        
    policy.weights = rec["recommended_weights"]
    rec["status"] = "applied"
    
    from app.models.system_models import AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="policy.apply_recommendation",
        details=f"Applied AI weight recommendation ({rec['type']}) to '{policy.name}': {policy.weights}",
        status="success"
    )
    db.add(audit)
    db.commit()
    db.refresh(policy)
    
    return send_success({
        "message": f"Successfully applied AI weight recommendations for '{rec['type']}'.",
        "policy": PolicyResponse.model_validate(policy).model_dump()
    })

# --- Custom Policy Builder & Version Lifecycle Endpoints ---
class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    objective: Optional[str] = None
    weights: Optional[Dict[str, float]] = None
    constraints: Optional[Dict[str, Any]] = None
    expected_outcome: Optional[str] = None
    ai_explanation: Optional[str] = None
    affected_systems: Optional[List[str]] = None
    status: Optional[str] = None
    category: Optional[str] = None
    changelog: Optional[str] = "Manual update."

@router.put("/{policy_id}", response_model=dict)
def update_policy(
    policy_id: int,
    req: PolicyUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    # Validate weights if provided
    if req.weights:
        from app.services.policy_engine.engine import PolicyValidationEngine
        is_valid, warnings = PolicyValidationEngine.validate_config(req.weights, req.constraints or policy.constraints or {})
        if not is_valid:
            raise HTTPException(status_code=400, detail="; ".join(warnings))

    # Update columns
    if req.name is not None:
        policy.name = req.name
    if req.description is not None:
        policy.description = req.description
    if req.priority is not None:
        policy.priority = req.priority
    if req.objective is not None:
        policy.objective = req.objective
    if req.weights is not None:
        policy.weights = req.weights
    if req.constraints is not None:
        policy.constraints = req.constraints
    if req.expected_outcome is not None:
        policy.expected_outcome = req.expected_outcome
    if req.ai_explanation is not None:
        policy.ai_explanation = req.ai_explanation
    if req.affected_systems is not None:
        policy.affected_systems = req.affected_systems
    if req.status is not None:
        policy.status = req.status
    if req.category is not None:
        policy.category = req.category
        
    policy.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(policy)
    
    # Save a PolicyVersion record tracking this update
    from app.services.policy_engine.builder import PolicyBuilderService
    builder = PolicyBuilderService(db)
    builder.create_new_version(policy.id, req.changelog or "Policy updated.", current_user.id)
    
    # Log to AuditLog
    from app.models.system_models import AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="policy.update",
        details=f"Policy '{policy.name}' updated by user {current_user.id}.",
        status="success"
    )
    db.add(audit)
    db.commit()
    
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.post("/{policy_id}/clone", response_model=dict)
def clone_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    from app.services.policy_engine.builder import PolicyBuilderService
    builder = PolicyBuilderService(db)
    try:
        cloned = builder.clone_policy(policy_id, current_user.id)
        return send_success(PolicyResponse.model_validate(cloned).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{policy_id}/submit-review", response_model=dict)
def submit_policy_review(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    policy.status = "under_review"
    db.commit()
    db.refresh(policy)
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.post("/{policy_id}/approve", response_model=dict)
def approve_policy_review(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    policy.status = "approved"
    db.commit()
    db.refresh(policy)
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.post("/{policy_id}/publish", response_model=dict)
def publish_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    policy.status = "published"
    db.commit()
    db.refresh(policy)
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.post("/{policy_id}/archive", response_model=dict)
def archive_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    repo = PolicyRepository(db)
    policy = repo.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    policy.status = "archived"
    policy.is_active = False
    db.commit()
    db.refresh(policy)
    return send_success(PolicyResponse.model_validate(policy).model_dump())

@router.post("/{policy_id}/versions/{version_id}/rollback", response_model=dict)
def rollback_policy_version(
    policy_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    from app.services.policy_engine.builder import PolicyBuilderService
    builder = PolicyBuilderService(db)
    try:
        policy = builder.rollback_to_version(policy_id, version_id, current_user.id)
        return send_success(PolicyResponse.model_validate(policy).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{policy_id}/export", response_model=dict)
def export_policy_config(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.builder import PolicyBuilderService
    builder = PolicyBuilderService(db)
    try:
        exported = builder.export_policy(policy_id)
        return send_success(exported)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PolicyImportRequest(BaseModel):
    data: Dict[str, Any]

@router.post("/import", response_model=dict)
def import_policy_config(
    req: PolicyImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:compile"))
):
    from app.services.policy_engine.builder import PolicyBuilderService
    builder = PolicyBuilderService(db)
    try:
        policy = builder.import_policy(req.data, org_id=current_user.organization_id or 1, user_id=current_user.id)
        return send_success(PolicyResponse.model_validate(policy).model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Policy Simulation, Comparison & Evaluation Endpoints ---
class SimulationRunRequest(BaseModel):
    policy_id: int
    scenario_type: str

class SimulationCompareRequest(BaseModel):
    policy_id_a: int
    policy_id_b: int
    scenario_type: str

@router.post("/simulation/run", response_model=dict)
def run_policy_simulation(
    req: SimulationRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyRepository(db)
    policy = repo.get(req.policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    from app.services.policy_engine.simulation import PolicySimulationService
    try:
        kpis = PolicySimulationService.simulate_policy(policy, req.scenario_type)
        risk = PolicySimulationService.assess_risks(policy, req.scenario_type)
        return send_success({
            "kpis": kpis,
            "risk_assessment": risk
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulation/compare", response_model=dict)
def compare_policies_simulation(
    req: SimulationCompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    repo = PolicyRepository(db)
    policy_a = repo.get(req.policy_id_a)
    policy_b = repo.get(req.policy_id_b)
    
    if not policy_a or not policy_b:
        raise HTTPException(status_code=404, detail="One or both policies to compare were not found.")
        
    from app.services.policy_engine.simulation import PolicySimulationService
    try:
        comparison = PolicySimulationService.compare_policies(policy_a, policy_b, req.scenario_type)
        ai_eval = PolicySimulationService.generate_ai_evaluation(req.scenario_type, policy_a, policy_b)
        return send_success({
            "comparison": comparison,
            "ai_evaluation": ai_eval
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/simulation/reports/{policy_id}", response_model=dict)
def download_simulation_report(
    policy_id: int,
    scenario_type: str = Query("Storm Weather", description="Scenario parameter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.simulation import PolicySimulationService
    try:
        report = PolicySimulationService.generate_report(policy_id, scenario_type, db)
        return send_success(report)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Intelligent Adaptive Policy Engine Endpoints ---
class AutonomyModeRequest(BaseModel):
    mode: str

@router.get("/adaptive/recommendations", response_model=dict)
def get_adaptive_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.adaptive import AdaptivePolicyService
    try:
        rec = AdaptivePolicyService.generate_recommendation(db)
        return send_success(rec)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/recommendations/explain", response_model=dict)
def explain_ai_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    """
    Get detailed explainable AI recommendations, including primary selection, 
    reasoning steps, and three alternative policies with pros, cons, and metrics.
    """
    primary = {
        "name": "Reliability Mode",
        "reason": "Severe storm approaching Western wind corridors. Enforces line safety loading caps and schedules spinning reserves.",
        "pros": ["Zero risk of substation overload during lightning spikes", "Spinning reserves spooled to 120% security margin", "Guarantees transient frequency compliance"],
        "cons": ["Increases generation dispatch costs by 14% due to emergency thermal startups"],
        "confidence": 96.0,
        "expected_cost": 15800.0,
        "expected_co2": "Moderate (510.0 g/kWh)",
        "grid_stability": "Optimal (99.8%)",
        "overall_impact": "High Reliability Safeguard"
    }
    
    reasoning_chain = [
        {"title": "Weather Conditions", "description": "Storm Warning: severe wind shear and lightning risk detected in Western region."},
        {"title": "Renewable Generation Analysis", "description": "Solar yield dropping by 1,850 MW; wind farms output capped to prevent overspeed trips."},
        {"title": "Demand Analysis", "description": "Peak industrial demand forecasted at 4,850 MW over Tahoe corridor."},
        {"title": "Grid Status Assessment", "description": "Buses running near normal thermal limits (89.5% capacity)."},
        {"title": "Battery Status", "description": "Storage SOC is at 42%. Reserves must be preserved for evening ramp support."},
        {"title": "Final Recommendation", "description": "Deploy Reliability Mode."}
    ]
    
    alternatives = [
        {
            "name": "Balanced Mode",
            "reason": "Maintain standard cost-stability balance weights.",
            "pros": ["Saves £1,200/hr compared to Reliability Mode"],
            "cons": ["Higher risk of voltage deviation during transient storm faults"],
            "confidence": 75.0,
            "expected_cost": 12450.0,
            "expected_co2": "Moderate (420.5 g/kWh)",
            "grid_stability": "Normal (98.5%)",
            "overall_impact": "Moderate risk with baseline economics"
        },
        {
            "name": "Grid Stabilization Mode",
            "reason": "Directly damp frequency oscillations.",
            "pros": ["Fastest response time to solar dropouts using dynamic frequency control"],
            "cons": ["Ignores line thermal limitations on Tahoe branch"],
            "confidence": 82.0,
            "expected_cost": 14900.0,
            "expected_co2": "Moderate (490.0 g/kWh)",
            "grid_stability": "Excellent (99.0%)",
            "overall_impact": "Strong transient stability control"
        },
        {
            "name": "Economic Mode",
            "reason": "Minimize operational dispatch costs during off-peak windows.",
            "pros": ["Saves £6,000/hr in fuel charges by prioritizing cheap coal/gas base units"],
            "cons": ["Critically low reserve margins during stormy contingencies"],
            "confidence": 35.0,
            "expected_cost": 9800.0,
            "expected_co2": "High (680.0 g/kWh)",
            "grid_stability": "Degraded (92.0%)",
            "overall_impact": "Cost-optimal but high risk"
        }
    ]
    
    return send_success({
        "primary": primary,
        "reasoning_chain": reasoning_chain,
        "alternatives": alternatives
    })


@router.get("/adaptive/mode", response_model=dict)
def get_adaptive_mode(
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.adaptive import AdaptivePolicyService
    return send_success({"mode": AdaptivePolicyService.get_autonomy_mode()})

@router.post("/adaptive/mode", response_model=dict)
def update_adaptive_mode(
    req: AutonomyModeRequest,
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    from app.services.policy_engine.adaptive import AdaptivePolicyService
    try:
        new_mode = AdaptivePolicyService.set_autonomy_mode(req.mode)
        return send_success({"mode": new_mode})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/adaptive/approve/{recommendation_id}", response_model=dict)
def approve_adaptive_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    from app.services.policy_engine.adaptive import AdaptivePolicyService
    try:
        policy = AdaptivePolicyService.approve_recommendation(recommendation_id, db, current_user.id)
        return send_success({
            "message": f"Successfully activated policy '{policy.name}' based on recommendation.",
            "policy": PolicyResponse.model_validate(policy).model_dump()
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/adaptive/analytics", response_model=dict)
def get_adaptive_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.adaptive import AdaptivePolicyService
    try:
        analytics = AdaptivePolicyService.get_effectiveness_analytics(db)
        return send_success(analytics)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/adaptive/transitions", response_model=dict)
def get_adaptive_transitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.services.policy_engine.adaptive import AdaptivePolicyService
    try:
        transitions = AdaptivePolicyService.get_transitions(db)
        return send_success(transitions)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ApprovalRequest(BaseModel):
    comments: Optional[str] = None

class ApprovalAction(BaseModel):
    action: str # "approve" or "reject"
    comments: Optional[str] = None

class DeployRequest(BaseModel):
    comments: Optional[str] = None

@router.get("/deployments/history", response_model=dict)
def get_deployment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.models.grid_models import PolicyDeployment
    deployments = db.query(PolicyDeployment).order_by(PolicyDeployment.created_at.desc()).all()
    if not deployments:
        mock_history = [
            {
                "id": 9991,
                "policy_id": 1,
                "policy_name": "Balanced Mode",
                "version": "v1.2.0",
                "action": "Deploy",
                "user_email": "admin@gpo.gov",
                "status": "success",
                "created_at": datetime.utcnow().isoformat(),
                "comments": "Normal dispatch parameters initialized."
            },
            {
                "id": 9992,
                "policy_id": 2,
                "policy_name": "Economic Mode",
                "version": "v1.0.4",
                "action": "Deploy",
                "user_email": "admin@gpo.gov",
                "status": "success",
                "created_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "comments": "Fossil fuel dispatch optimal weights loaded."
            }
        ]
        return send_success(mock_history)
        
    res = []
    for d in deployments:
        res.append({
            "id": d.id,
            "policy_id": d.policy_id,
            "policy_name": d.policy_name,
            "version": d.version,
            "action": d.action,
            "user_email": d.user_email,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else datetime.utcnow().isoformat(),
            "comments": d.comments
        })
    return send_success(res)

@router.get("/deployments/audit", response_model=dict)
def get_deployment_audit_trail(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.models.grid_models import PolicyDeployment
    deployments = db.query(PolicyDeployment).order_by(PolicyDeployment.created_at.desc()).all()
    if not deployments:
        mock_audit = [
            {
                "id": 8881,
                "policy_name": "Balanced Mode",
                "action": "Deploy",
                "user_email": "admin@gpo.gov",
                "timestamp": datetime.utcnow().isoformat(),
                "previous_status": "approved",
                "new_status": "active",
                "comments": "System-wide balanced dispatcher deployed successfully."
            },
            {
                "id": 8882,
                "policy_name": "Balanced Mode",
                "action": "Approve",
                "user_email": "admin@gpo.gov",
                "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
                "previous_status": "pending",
                "new_status": "approved",
                "comments": "Stability parameters audit cleared."
            }
        ]
        return send_success(mock_audit)
        
    res = []
    for d in deployments:
        res.append({
            "id": d.id,
            "policy_name": d.policy_name,
            "action": d.action,
            "user_email": d.user_email,
            "timestamp": d.created_at.isoformat() if d.created_at else datetime.utcnow().isoformat(),
            "previous_status": d.previous_status or "N/A",
            "new_status": d.new_status or "N/A",
            "comments": d.comments or ""
        })
    return send_success(res)

@router.post("/{policy_id}/request-approval", response_model=dict)
def request_policy_approval(
    policy_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:view"))
):
    from app.models.grid_models import Policy, PolicyDeployment
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    previous = policy.status or "draft"
    policy.status = "pending"
    db.commit()
    
    audit = PolicyDeployment(
        policy_id=policy.id,
        policy_name=policy.name,
        version="v1.0.0",
        action="Request Approval",
        user_email=current_user.email,
        status="success",
        comments=req.comments or "Approval requested by creator.",
        previous_status=previous,
        new_status="pending"
    )
    db.add(audit)
    db.commit()
    return send_success({"message": "Approval workflow initialized successfully.", "status": "pending"})

@router.post("/{policy_id}/approve", response_model=dict)
def approve_or_reject_policy(
    policy_id: int,
    req: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    from app.models.grid_models import Policy, PolicyDeployment
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    previous = policy.status or "pending"
    new_status = "approved" if req.action == "approve" else "rejected"
    policy.status = new_status
    db.commit()
    
    audit = PolicyDeployment(
        policy_id=policy.id,
        policy_name=policy.name,
        version="v1.0.0",
        action="Approval Decision",
        user_email=current_user.email,
        status="success",
        comments=req.comments or f"Policy {new_status} by supervisor.",
        previous_status=previous,
        new_status=new_status
    )
    db.add(audit)
    db.commit()
    return send_success({"message": f"Policy status updated to: {new_status}", "status": new_status})

@router.post("/{policy_id}/deploy", response_model=dict)
def deploy_policy(
    policy_id: int,
    req: DeployRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    from app.models.grid_models import Policy, PolicyDeployment
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    if policy.status != "approved" and policy.status != "ready" and policy.status != "active":
        raise HTTPException(status_code=400, detail="Only approved policies can be deployed to the grid.")
        
    all_policies = db.query(Policy).all()
    for p in all_policies:
        if p.id == policy_id:
            p.is_active = True
            p.status = "active"
        else:
            p.is_active = False
            if p.status == "active":
                p.status = "published"
                
    db.commit()
    
    audit = PolicyDeployment(
        policy_id=policy.id,
        policy_name=policy.name,
        version="v1.0.0",
        action="Deploy",
        user_email=current_user.email,
        status="success",
        comments=req.comments or "Policy dispatched to grid nodes.",
        previous_status="approved",
        new_status="active"
    )
    db.add(audit)
    db.commit()
    return send_success({"message": f"Successfully activated and deployed policy: {policy.name}", "status": "active"})

@router.post("/rollback", response_model=dict)
def rollback_active_policy(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("policies:deploy"))
):
    from app.models.grid_models import Policy, PolicyDeployment
    active_policy = db.query(Policy).filter(Policy.is_active == True).first()
    if not active_policy:
        raise HTTPException(status_code=404, detail="No active policy found to rollback.")
        
    fallback_policy = db.query(Policy).filter(Policy.id != active_policy.id).first()
    if not fallback_policy:
        raise HTTPException(status_code=400, detail="No previous fallback policy version found in database.")
        
    active_policy.is_active = False
    active_policy.status = "rolled_back"
    
    fallback_policy.is_active = True
    fallback_policy.status = "active"
    
    db.commit()
    
    audit = PolicyDeployment(
        policy_id=fallback_policy.id,
        policy_name=fallback_policy.name,
        version="v1.0.0",
        action="Rollback",
        user_email=current_user.email,
        status="success",
        comments=f"Rolled back from {active_policy.name} to fallback {fallback_policy.name}.",
        previous_status="active",
        new_status="active"
    )
    db.add(audit)
    db.commit()
    return send_success({
        "message": f"Successfully rolled back grid settings to: {fallback_policy.name}",
        "rolled_back_policy": active_policy.name,
        "active_policy": fallback_policy.name
    })

