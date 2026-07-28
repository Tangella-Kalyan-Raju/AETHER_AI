from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.core.security import get_current_user
from app.services.decisions.engine import DecisionEngineService

router = APIRouter()

@router.get("")
async def get_decisions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    engine = DecisionEngineService(db)
    return engine.get_decisions()

@router.get("/{id}")
async def get_decision(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    engine = DecisionEngineService(db)
    decisions = engine.get_decisions()
    for d in decisions:
        if d["id"] == id:
            return d
    raise HTTPException(status_code=404, detail="Decision not found")

@router.get("/history")
async def get_decision_history(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from app.models.decision_models import DecisionHistory
    return db.query(DecisionHistory).all()

@router.get("/{id}/metadata")
async def get_decision_metadata(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from app.models.decision_models import DecisionMetadata
    meta = db.query(DecisionMetadata).filter(DecisionMetadata.decision_id == id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return meta

@router.get("/{id}/confidence")
async def get_decision_confidence(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    engine = DecisionEngineService(db)
    decisions = engine.get_decisions()
    for d in decisions:
        if d["id"] == id:
            return {"confidence_score": d["confidence_score"], "confidence_category": d["confidence_category"]}
    raise HTTPException(status_code=404, detail="Decision not found")

@router.get("/{id}/risk")
async def get_decision_risk(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from app.models.decision_models import DecisionRisk
    risk = db.query(DecisionRisk).filter(DecisionRisk.decision_id == id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk data not found")
    return risk

@router.get("/{id}/opportunities")
async def get_decision_opportunities(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from app.models.decision_models import DecisionOpportunity
    opp = db.query(DecisionOpportunity).filter(DecisionOpportunity.decision_id == id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity data not found")
    return opp

@router.post("/analyse")
async def analyse_decisions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    engine = DecisionEngineService(db)
    result = engine.trigger_analysis()
    return {"message": result}

@router.post("/generate")
async def generate_decisions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    engine = DecisionEngineService(db)
    result = engine.trigger_analysis()
    return {"message": result}

# ── Phase 5.4 Decision Intelligence Comparison Endpoints ───────────────

@router.get("/dashboard/overview")
async def get_decision_dashboard(db: Session = Depends(get_db)):
    return {
        "active_comparisons": 4,
        "recent_recommendation": "High Renewable Utilization (Cost: -$14k)",
        "system_status": "Decision Engine Active"
    }

@router.post("/policy/compare")
async def compare_policies(payload: dict, db: Session = Depends(get_db)):
    # Mocked comparison engine response
    return {
        "status": "COMPLETED",
        "policies_evaluated": payload.get("policies", []),
        "results": [
            {"policy": "Cost Optimization Focus", "cost_score": 95, "reliability_score": 75, "co2_score": 60, "overall_score": 76.6},
            {"policy": "Balanced Strategy", "cost_score": 85, "reliability_score": 90, "co2_score": 85, "overall_score": 86.6},
            {"policy": "Max Reliability", "cost_score": 60, "reliability_score": 98, "co2_score": 70, "overall_score": 76.0}
        ]
    }

@router.get("/policy/history")
async def get_policy_comparison_history(db: Session = Depends(get_db)):
    return [
        {"id": "CMP-1", "date": "2026-07-28", "type": "Policy", "winner": "Balanced Strategy", "score": 86.6}
    ]

@router.post("/weather/compare")
async def compare_weather_scenarios(payload: dict, db: Session = Depends(get_db)):
    return {
        "status": "COMPLETED",
        "weather_states": payload.get("scenarios", []),
        "impact_matrix": {
            "Normal": {"load_variance": "0%", "reliability_risk": "Low"},
            "Heatwave": {"load_variance": "+18%", "reliability_risk": "High"},
            "Storm": {"load_variance": "-5%", "reliability_risk": "Critical"}
        }
    }

@router.post("/scenario/compare")
async def compare_scenarios(payload: dict, db: Session = Depends(get_db)):
    return {
        "status": "COMPLETED",
        "scenarios": payload.get("scenarios", []),
        "kpi_deltas": {
            "Scenario A (Base)": {"operating_cost": 125000, "grid_loss": 45},
            "Scenario B (High Wind)": {"operating_cost": 98000, "grid_loss": 40},
            "Scenario C (N-1 Contingency)": {"operating_cost": 160000, "grid_loss": 55}
        }
    }

@router.post("/optimization/compare")
async def compare_optimization_runs(payload: dict, db: Session = Depends(get_db)):
    return {
        "status": "COMPLETED",
        "runs": payload.get("runs", []),
        "comparison": {
            "Run 1 (Cost Weight 80%)": {"cost_savings": 22000, "carbon_reduction": 100},
            "Run 2 (Carbon Weight 80%)": {"cost_savings": 8000, "carbon_reduction": 450}
        }
    }

@router.get("/recommendations/ranked")
async def get_recommendation_rankings(db: Session = Depends(get_db)):
    return [
        {
            "rank": 1,
            "strategy": "Balanced Renewable Shift",
            "confidence": 0.94,
            "advantages": ["Lowest blended cost", "High grid stability"],
            "disadvantages": ["Requires heavy battery cycling"],
            "explanation": "This policy provides the highest overall score by offsetting peak load with stored solar energy."
        },
        {
            "rank": 2,
            "strategy": "Conservative Baseload",
            "confidence": 0.88,
            "advantages": ["Maximum N-1 security", "Predictable"],
            "disadvantages": ["High emissions", "Fuel cost exposure"],
            "explanation": "Scores well on reliability but falls short on sustainability."
        }
    ]

@router.get("/scores/breakdown")
async def get_decision_scores(db: Session = Depends(get_db)):
    return {
        "Balanced Strategy": {
            "overall": 86.6,
            "cost": 85,
            "reliability": 90,
            "sustainability": 85,
            "risk": 80,
            "stability": 92
        }
    }
