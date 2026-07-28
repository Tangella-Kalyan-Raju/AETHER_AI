from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class TrainingSession(Base):
    """
    A single educational simulation instance assigned to an operator.
    """
    __tablename__ = "training_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trainee_username = Column(String(100), nullable=False)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    
    difficulty_level = Column(String(20), nullable=False, default="Intermediate")
    status = Column(String(20), default="ACTIVE", nullable=False) # ACTIVE, SUBMITTED, GRADED, SAVED
    
    is_certification_mode = Column(Boolean, default=False, nullable=False)
    team_id = Column(String(36), nullable=True)
    saved_state_json = Column(JSON, nullable=True) # stores paused/saved parameters
    
    started_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    simulation = relationship("SimulationRun")
    assessment = relationship("OperatorAssessment", back_populates="session", uselist=False, cascade="all, delete-orphan")


class OperatorAssessment(Base):
    """
    Grading and scoring for a completed Training Session.
    """
    __tablename__ = "operator_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    training_session_id = Column(String(36), ForeignKey("training_sessions.id"), nullable=False, unique=True)
    
    scenario_score = Column(Float, nullable=False) # 0-100 base scenario metric
    decision_score = Column(Float, nullable=False) # 0-100 active decision grading
    final_grade = Column(String(2), nullable=False) # A, B, C, F
    passed = Column(Boolean, nullable=False, default=False)
    
    metrics_json = Column(JSON, nullable=True) # response_time, grid_stability, renewable_utilization, etc.
    ai_feedback = Column(Text, nullable=True) # detailed suggestions and explanations from AI Mentor
    
    graded_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    
    session = relationship("TrainingSession", back_populates="assessment")


class Certification(Base):
    """
    Earned credentials after passing specific training difficulty thresholds.
    """
    __tablename__ = "certifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trainee_username = Column(String(100), nullable=False)
    certification_level = Column(String(50), nullable=False) # e.g. "Advanced Grid Operations"
    session_id = Column(String(36), ForeignKey("training_sessions.id"), nullable=True)
    
    issued_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)


class ReplaySession(Base):
    """
    Reproducible VCR control replay session of a completed simulation run.
    """
    __tablename__ = "replay_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    timeline_events_json = Column(JSON, nullable=True) # highlights and key event times on the VCR timeline


class TraineeAnalytics(Base):
    """
    Long-term aggregated operator learning metrics and trends.
    """
    __tablename__ = "trainee_analytics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trainee_username = Column(String(100), nullable=False, unique=True)
    
    training_progress = Column(Float, default=0.0) # total completed / assigned
    average_score = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    average_response_time = Column(Float, default=0.0)
    decision_accuracy = Column(Float, default=0.0)
    
    weak_areas_json = Column(JSON, nullable=True)
    improvement_trends_json = Column(JSON, nullable=True)
    
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

