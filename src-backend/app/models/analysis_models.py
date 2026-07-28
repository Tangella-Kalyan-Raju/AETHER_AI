from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class SimulationAnalysisReport(Base):
    """
    The master analysis record summarizing a completed simulation run.
    """
    __tablename__ = "simulation_analysis_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, unique=True)
    
    executive_summary_json = Column(JSON, nullable=False) # High level metrics
    financial_impact_json = Column(JSON, nullable=False) # Operational/Market costs
    carbon_impact_json = Column(JSON, nullable=False) # Emissions
    grid_health_score = Column(Float, nullable=False) # 0-100
    
    generated_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    
    simulation = relationship("SimulationRun")
    ai_traces = relationship("AIExplainabilityTrace", back_populates="report", cascade="all, delete-orphan")


class AIExplainabilityTrace(Base):
    """
    Stores the strict evidence chain answering 'Why did this happen?'
    """
    __tablename__ = "ai_explainability_traces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("simulation_analysis_reports.id"), nullable=False)
    
    question = Column(String(255), nullable=False)
    answer = Column(String(1000), nullable=False)
    evidence_json = Column(JSON, nullable=False) # Links to specific forecast/optimization logs
    
    report = relationship("SimulationAnalysisReport", back_populates="ai_traces")


class StrategyComparison(Base):
    """
    Stores the diff between two simulations of the same scenario.
    """
    __tablename__ = "strategy_comparisons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(36), ForeignKey("scenario_templates.id"), nullable=False)
    
    base_sim_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    candidate_sim_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    
    winner_strategy = Column(String(100), nullable=True) # e.g. "Candidate (Green Mode)"
    kpi_diff_json = Column(JSON, nullable=False) # Delta values for Cost, Carbon, etc.
    
    generated_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
