from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text, Boolean, Integer
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


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    is_pinned = Column(Boolean, default=False)
    user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False) # system, user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class AISession(Base):
    __tablename__ = "ai_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_uuid = Column(String(36), unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=True)
    login_time = Column(DateTime, default=get_utc_now, nullable=False)
    logout_time = Column(DateTime, nullable=True)
    active_model = Column(String(100), nullable=False, default="Llama 3.3 70B")
    total_tokens = Column(Integer, default=0, nullable=False)
    total_requests = Column(Integer, default=0, nullable=False)
    average_response_time = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="Active", nullable=False) # Active, Inactive


class AIPromptTemplate(Base):
    __tablename__ = "ai_prompt_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    template = Column(Text, nullable=False)
    version = Column(String(50), default="1.0.0", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), default=generate_uuid, nullable=True, index=True)
    question = Column(Text, nullable=True)
    prompt_template_name = Column(String(100), nullable=True)
    response = Column(Text, nullable=True)
    model = Column(String(100), nullable=False)
    tokens = Column(Integer, default=0, nullable=True)
    response_time = Column(Float, default=0.0, nullable=True) # seconds
    status = Column(String(50), default="Success", nullable=True) # Success, Error
    errors = Column(Text, nullable=True)
    user_id = Column(Integer, nullable=True)
    session_uuid = Column(String(36), nullable=True, index=True)
    provider = Column(String(100), nullable=True)
    execution_time = Column(Float, default=0.0, nullable=True)
    success = Column(Boolean, default=True, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class AIMemory(Base):
    __tablename__ = "ai_memories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(Integer, nullable=True, index=True)
    key = Column(String(100), nullable=False)
    value = Column(JSON, nullable=False)
    memory_type = Column(String(50), nullable=False) # short_term, long_term
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class AISetting(Base):
    __tablename__ = "ai_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(50), default="groq", nullable=False)
    model = Column(String(100), default="llama3-70b-8192", nullable=False)
    temperature = Column(Float, default=0.7, nullable=False)
    max_tokens = Column(Integer, default=2048, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
