from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.services.auth.deps import get_current_user, require_permissions
from app.models.auth import User
from app.services.workspace.intent_engine import intent_engine

router = APIRouter(prefix="/api/v1/workspace", tags=["workspace"])

class ChatRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class ArtifactResponse(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]

class ChatResponse(BaseModel):
    message: str
    artifacts: List[ArtifactResponse]
    timestamp: str

@router.post("/chat", response_model=ChatResponse)
def handle_workspace_chat(
    request: ChatRequest,
    current_user: User = Depends(require_permissions(["dashboard:view"]))
):
    """
    Handle natural language queries from the AI Workspace.
    """
    try:
        result = intent_engine.process_query(current_user.id, request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
