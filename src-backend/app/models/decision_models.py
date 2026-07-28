from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class Decision(Base):
    """Core AI operational recommendation."""
    __tablename__ = "decisions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # e.g. Battery Charging, Generation Adjustment
    priority = Column(String(20), nullable=False) # High, Medium, Low
    confidence_score = Column(Float, nullable=False)
    confidence_category = Column(String(20), nullable=False) # Very High, High, Medium, Low
    status = Column(String(50), default="Pending") # Pending, Accepted, Rejected
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class DecisionMetadata(Base):
    """Metadata detailing the sources used for the decision."""
    __tablename__ = "decision_metadata"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    decision_id = Column(String(36), ForeignKey("decisions.id"), nullable=False)
    version = Column(String(20), default="1.0")
    forecast_sources = Column(JSON, nullable=False) # List of domains used e.g. ["demand", "weather"]
    processing_time_ms = Column(Float)
    extra_metadata = Column(JSON, nullable=True)

class DecisionExplanation(Base):
    """Explainable AI reasoning chains."""
    __tablename__ = "decision_explanations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    decision_id = Column(String(36), ForeignKey("decisions.id"), nullable=False)
    summary = Column(String(500), nullable=False)
    reasoning_chain = Column(JSON, nullable=False) # Step-by-step logic
    primary_factors = Column(JSON, nullable=False)
    secondary_factors = Column(JSON, nullable=True)

class DecisionRisk(Base):
    """Risk evaluation for the decision."""
    __tablename__ = "decision_risks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    decision_id = Column(String(36), ForeignKey("decisions.id"), nullable=False)
    overall_risk_score = Column(Float, nullable=False)
    operational_risk = Column(Float)
    financial_risk = Column(Float)
    reliability_risk = Column(Float)
    renewable_risk = Column(Float)
    battery_risk = Column(Float)
    grid_stability_risk = Column(Float)

class DecisionOpportunity(Base):
    """Opportunity analysis for the decision."""
    __tablename__ = "decision_opportunities"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    decision_id = Column(String(36), ForeignKey("decisions.id"), nullable=False)
    expected_cost_savings = Column(Float)
    expected_carbon_reduction = Column(Float)
    renewable_utilisation_increase = Column(Float)
    reliability_improvement = Column(Float)
    battery_optimisation_potential = Column(Float)

class DecisionHistory(Base):
    """Audit log of decisions and state changes."""
    __tablename__ = "decision_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    decision_id = Column(String(36), ForeignKey("decisions.id"), nullable=False)
    execution_time = Column(DateTime(timezone=True), default=get_utc_now)
    action = Column(String(50), nullable=False) # Generated, StatusChanged
    details = Column(JSON, nullable=True)

class DecisionComparison(Base):
    """Base comparison tracking job."""
    __tablename__ = "decision_comparisons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    status = Column(String(50), default="Completed")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    comparison_type = Column(String(50)) # Policy, Weather, Scenario, Optimization

class PolicyComparison(Base):
    """Specific matrix comparing multiple operational policies."""
    __tablename__ = "policy_comparisons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    comparison_id = Column(String(36), ForeignKey("decision_comparisons.id"), nullable=False)
    policies_evaluated = Column(JSON, nullable=False) # List of policy IDs
    cost_variance = Column(JSON)
    reliability_variance = Column(JSON)
    co2_variance = Column(JSON)

class WeatherComparison(Base):
    """Weather scenario variance matrices."""
    __tablename__ = "weather_comparisons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    comparison_id = Column(String(36), ForeignKey("decision_comparisons.id"), nullable=False)
    weather_states = Column(JSON, nullable=False) # e.g. ["Normal", "Heatwave", "Storm"]
    load_impacts = Column(JSON)
    generation_impacts = Column(JSON)

class ScenarioComparison(Base):
    """Multi-scenario variance tracking."""
    __tablename__ = "scenario_comparisons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    comparison_id = Column(String(36), ForeignKey("decision_comparisons.id"), nullable=False)
    scenarios = Column(JSON, nullable=False)
    kpi_deltas = Column(JSON)
    asset_impacts = Column(JSON)

class RecommendationRanking(Base):
    """The output ranks and confidence scores of different alternatives."""
    __tablename__ = "recommendation_rankings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    comparison_id = Column(String(36), ForeignKey("decision_comparisons.id"), nullable=False)
    rank = Column(Float, nullable=False)
    strategy_name = Column(String(200), nullable=False)
    confidence_score = Column(Float, nullable=False)
    explanation = Column(String(1000))
    advantages = Column(JSON)
    disadvantages = Column(JSON)

class DecisionScore(Base):
    """Detailed breakdown (Cost Score, Reliability Score, etc.)."""
    __tablename__ = "decision_scores"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    strategy_name = Column(String(200), nullable=False)
    overall_score = Column(Float, nullable=False)
    cost_score = Column(Float, nullable=False)
    reliability_score = Column(Float, nullable=False)
    sustainability_score = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    stability_score = Column(Float, nullable=False)

class TradeOffAnalysis(Base):
    """Matrices mapping competing variables."""
    __tablename__ = "trade_off_analyses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    comparison_id = Column(String(36), ForeignKey("decision_comparisons.id"), nullable=False)
    x_axis_metric = Column(String(100), nullable=False)
    y_axis_metric = Column(String(100), nullable=False)
    data_points = Column(JSON, nullable=False) # [{x, y, label}]
