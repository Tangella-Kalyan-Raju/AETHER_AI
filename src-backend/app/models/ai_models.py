from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class AIDecisionLog(Base):
    """Audit log for AI recommendations to ensure complete traceability."""
    __tablename__ = "ai_decision_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    query_text = Column(Text, nullable=True) # Natural language query if any
    
    # Context injected into LLM
    context_data_json = Column(JSON, nullable=False)
    retrieved_rag_docs = Column(JSON, nullable=True)
    
    # LLM Output
    raw_llm_response = Column(Text, nullable=False)
    structured_recommendation = Column(JSON, nullable=False)
    
    # Metrics
    confidence_score = Column(Float, nullable=False)
    generated_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    
    # Operator tracking
    operator_action = Column(String(100), default="Pending") # Pending, Accepted, Rejected, Ignored
