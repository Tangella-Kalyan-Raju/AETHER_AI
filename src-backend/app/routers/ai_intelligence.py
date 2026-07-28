from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

from app.database.connection import get_db
from app.services.ai.decision_engine import AIDecisionEngine
from app.core.security import get_current_user

router = APIRouter()

class AIQueryRequest(BaseModel):
    query: str

class AIQueryResponse(BaseModel):
    what_happened: str
    why: str
    evidence: Dict[str, Any]
    alternatives: list
    recommendation: str
    confidence: float
    cost_impact: str

@router.post("/query", response_model=AIQueryResponse)
async def query_ai_decision_engine(
    request: AIQueryRequest, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Submit a natural language query for the Enterprise AI Decision Engine to evaluate.
    """
    engine = AIDecisionEngine(db)
    result = engine.handle_query(request.query)
    
    return AIQueryResponse(**result)

class GridSummaryResponse(BaseModel):
    summary: str

@router.get("/summarize-grid", response_model=GridSummaryResponse)
async def summarize_grid_topology(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate an operational summary of the current grid topology using the Groq API.
    """
    from app.services.ai.knowledge_graph import KnowledgeGraphEngine
    from app.services.ai.gateway import LLMGateway
    
    kg = KnowledgeGraphEngine(db)
    topology_context = kg.get_asset_context()
    
    prompt = (
        "You are a Senior Grid Operations Engineer. Summarize the following grid topology. "
        "Highlight the substations, active buses, their voltage levels, and the generators/loads connected to them. "
        "Provide a concise summary outlining:\n"
        "1. Active grid assets overview.\n"
        "2. Key voltage levels and connection structure.\n"
        "3. High-level operational recommendations or stability notes based on this structure.\n"
        "Keep your output clear, well-formatted, bulleted, and professional. Avoid conversational filler."
    )
    
    gateway = LLMGateway()
    summary = gateway.generate_response(prompt, {"topology": topology_context})
    return {"summary": summary}

