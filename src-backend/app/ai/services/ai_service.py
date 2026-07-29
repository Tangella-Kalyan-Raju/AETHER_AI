import time
import json
from sqlalchemy.orm import Session
from app.models.ai_models import AIMessage, AILog
from app.ai.providers.groq import GroqProvider
from app.ai.prompts.manager import PromptManager
from app.ai.memory.session_memory import SessionMemoryManager

class AIService:
    def __init__(self, db: Session):
        self.db = db
        self.provider = GroqProvider()

    def process_chat(self, conversation_id: str, query: str, user_id: int = 1, template_name: str = "Enterprise System Prompt") -> dict:
        # Load conversation memory context
        history = SessionMemoryManager.get_conversation_context(self.db, conversation_id)
        
        # Assemble prompts
        system_prompt = PromptManager.get_template(self.db, "Enterprise System Prompt")
        full_prompt = PromptManager.assemble_prompt(self.db, query, template_name, history)

        # Call provider generate
        start_time = time.time()
        res = self.provider.generate(full_prompt, system_prompt)
        execution_time = time.time() - start_time

        # Save user message
        user_msg = AIMessage(conversation_id=conversation_id, role="user", content=query)
        self.db.add(user_msg)

        # Save assistant message
        assistant_msg = AIMessage(conversation_id=conversation_id, role="assistant", content=res["content"])
        self.db.add(assistant_msg)

        # Record AI log
        log_entry = AILog(
            user_id=user_id,
            provider="groq",
            model=getattr(self.provider, "model", "llama3-70b-8192") or "llama3-70b-8192",
            execution_time=execution_time,
            success=res["success"],
            error_message=res["error_message"]
        )
        self.db.add(log_entry)
        self.db.commit()

        # Parse content safely
        try:
            structured_data = json.loads(res["content"])
        except Exception:
            structured_data = {
                "Situation": res["content"],
                "Analysis": "Unable to parse structured JSON.",
                "Reasoning": "Raw LLM output fallback.",
                "Recommendation": "Recheck query filters.",
                "Risks": "None identified.",
                "Confidence": 70,
                "Expected Impact": "Nominal",
                "References": "Baseline Fallback",
                "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }

        return {
            "conversation_id": conversation_id,
            "response": structured_data,
            "success": res["success"],
            "execution_time": execution_time
        }
