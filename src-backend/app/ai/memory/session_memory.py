from sqlalchemy.orm import Session
from app.models.ai_models import AIMessage, AIMemory

class SessionMemoryManager:
    @staticmethod
    def get_conversation_context(db: Session, conversation_id: str, limit: int = 10) -> str:
        msgs = db.query(AIMessage).filter(AIMessage.conversation_id == conversation_id).order_by(AIMessage.created_at.asc()).all()
        history_str = ""
        for m in msgs[-limit:]:
            history_str += f"{m.role.upper()}: {m.content}\n"
        return history_str

    @staticmethod
    def save_memory(db: Session, user_id: int, key: str, value: any, memory_type: str = "short_term"):
        mem = db.query(AIMemory).filter(AIMemory.user_id == user_id, AIMemory.key == key, AIMemory.memory_type == memory_type).first()
        if not mem:
            mem = AIMemory(user_id=user_id, key=key, value=value, memory_type=memory_type)
            db.add(mem)
        else:
            mem.value = value
        db.commit()

    @staticmethod
    def get_memory(db: Session, user_id: int, key: str, memory_type: str = "short_term") -> any:
        mem = db.query(AIMemory).filter(AIMemory.user_id == user_id, AIMemory.key == key, AIMemory.memory_type == memory_type).first()
        if mem:
            return mem.value
        return None
