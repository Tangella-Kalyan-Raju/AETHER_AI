from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database.connection import get_db
from app.services.analysis.kpi_engine import KPIEngine
from app.services.analysis.explainability import ExplainabilityEngine
from app.models.analysis_models import SimulationAnalysisReport, AIExplainabilityTrace, StrategyComparison

router = APIRouter()

class AnalysisResponse(BaseModel):
    id: str
    simulation_id: str
    grid_health_score: float

@router.post("/{simulation_id}/analyze", response_model=AnalysisResponse)
def analyze_simulation(simulation_id: str, db: Session = Depends(get_db)):
    """Generates the full KPI report and AI Explainability traces for a completed simulation."""
    existing = db.query(SimulationAnalysisReport).filter(SimulationAnalysisReport.simulation_id == simulation_id).first()
    if existing:
        return existing
        
    try:
        report = KPIEngine.generate_report(db, simulation_id)
        ExplainabilityEngine.generate_traces(db, report.id, simulation_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{simulation_id}/report")
def get_analysis_report(simulation_id: str, db: Session = Depends(get_db)):
    report = db.query(SimulationAnalysisReport).filter(SimulationAnalysisReport.simulation_id == simulation_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Analysis report not found. Run analyze first.")
        
    traces = db.query(AIExplainabilityTrace).filter(AIExplainabilityTrace.report_id == report.id).all()
    
    return {
        "report_id": report.id,
        "executive_summary": report.executive_summary_json,
        "financial_impact": report.financial_impact_json,
        "carbon_impact": report.carbon_impact_json,
        "grid_health_score": report.grid_health_score,
        "ai_explanations": [
            {
                "question": t.question,
                "answer": t.answer,
                "evidence": t.evidence_json
            } for t in traces
        ]
    }

@router.get("/compare")
def compare_strategies(base_sim_id: str, candidate_sim_id: str, db: Session = Depends(get_db)):
    base_report = db.query(SimulationAnalysisReport).filter(SimulationAnalysisReport.simulation_id == base_sim_id).first()
    candidate_report = db.query(SimulationAnalysisReport).filter(SimulationAnalysisReport.simulation_id == candidate_sim_id).first()
    
    if not base_report or not candidate_report:
        raise HTTPException(status_code=400, detail="Both simulations must be analyzed first.")
        
    diff = {
        "cost_diff": candidate_report.financial_impact_json["total_estimated_savings_usd"] - base_report.financial_impact_json["total_estimated_savings_usd"],
        "carbon_diff": candidate_report.carbon_impact_json["total_co2_tons"] - base_report.carbon_impact_json["total_co2_tons"],
        "health_diff": candidate_report.grid_health_score - base_report.grid_health_score
    }
    
    winner = "Candidate" if diff["health_diff"] > 0 else "Base"
    
    comp = StrategyComparison(
        scenario_id="mock_id_for_now", # In a real query, we'd join through SimulationRun to verify identical scenario_ids
        base_sim_id=base_sim_id,
        candidate_sim_id=candidate_sim_id,
        winner_strategy=winner,
        kpi_diff_json=diff
    )
    db.add(comp)
    db.commit()
    
    return {
        "comparison_id": comp.id,
        "base_metrics": base_report.executive_summary_json,
        "candidate_metrics": candidate_report.executive_summary_json,
        "differences": diff,
        "recommended_winner": winner
    }
