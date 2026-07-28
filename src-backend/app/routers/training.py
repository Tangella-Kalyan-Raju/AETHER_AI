from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.training_models import TrainingSession, OperatorAssessment, Certification, ReplaySession, TraineeAnalytics
from app.models.simulation_models import SimulationRun
from app.services.training.assessment import AssessmentEngine
from app.services.training.ai_mentor import AIMentorEngine
from app.services.training.reports import TrainingReportGenerator
from datetime import datetime, timezone
import uuid

router = APIRouter()

class StartSessionRequest(BaseModel):
    simulation_id: str
    difficulty_level: str = "Intermediate"
    is_certification_mode: bool = False
    team_id: Optional[str] = None

class SubmitActionRequest(BaseModel):
    action_type: str
    target_asset: str
    parameters: dict

class GradeSessionRequest(BaseModel):
    actions_taken: List[SubmitActionRequest]

class SaveSessionRequest(BaseModel):
    saved_state: Dict[str, Any]

class ChatQuestionRequest(BaseModel):
    question: str
    current_time: int

@router.post("/sessions/start")
def start_training_session(data: StartSessionRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    run = db.query(SimulationRun).filter(SimulationRun.id == data.simulation_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    session = TrainingSession(
        trainee_username=current_user.email,
        simulation_id=data.simulation_id,
        difficulty_level=data.difficulty_level,
        is_certification_mode=data.is_certification_mode,
        team_id=data.team_id,
        status="ACTIVE"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {"session_id": session.id, "status": session.status, "difficulty_level": session.difficulty_level}

@router.post("/sessions/{session_id}/submit")
def submit_training_session(session_id: str, data: GradeSessionRequest, db: Session = Depends(get_db)):
    try:
        mock_actions = [{"action_type": a.action_type, "target_asset": a.target_asset} for a in data.actions_taken]
        assessment = AssessmentEngine.grade_session(db, session_id, mock_actions)
        return {
            "scenario_score": assessment.scenario_score,
            "decision_score": assessment.decision_score,
            "final_grade": assessment.final_grade,
            "passed": assessment.passed,
            "metrics": assessment.metrics_json,
            "ai_feedback": assessment.ai_feedback
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/sessions/{session_id}/save")
def save_training_session(session_id: str, data: SaveSessionRequest, db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = "SAVED"
    session.saved_state_json = data.saved_state
    db.commit()
    return {"message": "Session saved successfully", "status": session.status}

@router.post("/sessions/{session_id}/resume")
def resume_training_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = "ACTIVE"
    db.commit()
    return {"message": "Session resumed successfully", "status": session.status, "saved_state": session.saved_state_json}

@router.post("/sessions/{session_id}/clone")
def clone_training_session(session_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    base_session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not base_session:
        raise HTTPException(status_code=404, detail="Session to clone not found")
        
    new_session = TrainingSession(
        trainee_username=current_user.email,
        simulation_id=base_session.simulation_id,
        difficulty_level=base_session.difficulty_level,
        is_certification_mode=base_session.is_certification_mode,
        team_id=base_session.team_id,
        status="ACTIVE"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"session_id": new_session.id, "message": "Session cloned successfully"}

@router.get("/sessions/{session_id}/mentor")
def get_mentor_hint(session_id: str, current_time: int, db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    hint = AIMentorEngine.get_hint_for_timestamp(db, session.simulation_id, current_time)
    return {"hint": hint}

@router.post("/sessions/{session_id}/mentor/ask")
def ask_mentor_question(session_id: str, data: ChatQuestionRequest, db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    response = AIMentorEngine.ask_question(db, data.question, session.simulation_id, data.current_time)
    return {"answer": response}

@router.get("/certifications")
def get_my_certifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    certs = db.query(Certification).filter(Certification.trainee_username == current_user.email).all()
    return [{"id": c.id, "level": c.certification_level, "issued_at": c.issued_at, "session_id": c.session_id} for c in certs]

@router.get("/analytics")
def get_trainee_analytics(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    analytics = db.query(TraineeAnalytics).filter(TraineeAnalytics.trainee_username == current_user.email).first()
    if not analytics:
        return {
            "training_progress": 0.0,
            "average_score": 0.0,
            "completion_rate": 0.0,
            "average_response_time": 0.0,
            "decision_accuracy": 0.0,
            "weak_areas": [],
            "improvement_trends": []
        }
    return {
        "training_progress": analytics.training_progress,
        "average_score": analytics.average_score,
        "completion_rate": analytics.completion_rate,
        "average_response_time": analytics.average_response_time,
        "decision_accuracy": analytics.decision_accuracy,
        "weak_areas": analytics.weak_areas_json or [],
        "improvement_trends": analytics.improvement_trends_json or []
    }

@router.get("/reports/export")
def export_training_report(report_type: str = "individual", format: str = "csv", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if format == "csv":
        data_str = TrainingReportGenerator.generate_csv(report_type, db, current_user.email)
        return Response(
            content=data_str,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=training_report_{report_type}.csv"}
        )
    else:
        excel_bytes = TrainingReportGenerator.generate_excel(report_type, db, current_user.email)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=training_report_{report_type}.xlsx"}
        )

@router.get("/replays")
def list_replay_sessions(db: Session = Depends(get_db)):
    replays = db.query(ReplaySession).all()
    return [{
        "id": r.id,
        "name": r.name,
        "simulation_id": r.simulation_id,
        "created_by": r.created_by,
        "created_at": r.created_at
    } for r in replays]

class StartReplayRequest(BaseModel):
    name: str
    simulation_id: str
    timeline_events: Optional[List[Dict[str, Any]]] = None

@router.post("/replays/start")
def start_replay_session(data: StartReplayRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    replay = ReplaySession(
        name=data.name,
        simulation_id=data.simulation_id,
        created_by=current_user.email,
        timeline_events_json=data.timeline_events
    )
    db.add(replay)
    db.commit()
    db.refresh(replay)
    return {"replay_id": replay.id, "name": replay.name, "simulation_id": replay.simulation_id}

