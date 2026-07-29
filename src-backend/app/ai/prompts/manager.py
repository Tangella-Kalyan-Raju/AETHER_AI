from sqlalchemy.orm import Session
from app.models.ai_models import AIPromptTemplate

class PromptManager:
    @staticmethod
    def get_template(db: Session, name: str) -> str:
        pt = db.query(AIPromptTemplate).filter(AIPromptTemplate.name == name, AIPromptTemplate.is_active == True).first()
        if pt:
            return pt.template
        
        defaults = {
            "Enterprise System Prompt": (
                "You are the Enterprise AI Grid Copilot.\n"
                "Your role is to offer professional, explainable, and grid-focused advice.\n"
                "Never hallucinate, invent data, or guess values. Always explain reasoning.\n"
                "Always format your response exactly as a JSON object with keys: "
                "Situation, Analysis, Reasoning, Recommendation, Risks, Confidence, Expected Impact, References, Timestamp."
            ),
            "Executive Summary Prompt": "Summarize key grid performance metrics and trends.",
            "Recommendation Prompt": "Provide explainable action items for any warning events."
        }
        return defaults.get(name, "You are the Enterprise AI Grid Copilot.")

    @staticmethod
    def assemble_prompt(db: Session, query: str, template_name: str, history: str = "") -> str:
        template = PromptManager.get_template(db, template_name)
        return (
            f"Instructions: {template}\n\n"
            f"Session Context:\n{history}\n\n"
            f"Query: {query}"
        )
