from pydantic import BaseModel
from typing import Optional, Any

class ChatRequest(BaseModel):
    conversation_id: str
    query: str
    template_name: Optional[str] = "Enterprise System Prompt"

class CreateConversationRequest(BaseModel):
    title: str

class RenameConversationRequest(BaseModel):
    title: str

class AISettingUpdate(BaseModel):
    provider: str
    model: str
    temperature: float
    max_tokens: int
