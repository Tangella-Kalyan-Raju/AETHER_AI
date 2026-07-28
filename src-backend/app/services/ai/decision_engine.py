import logging
from sqlalchemy.orm import Session
from app.services.ai.gateway import LLMGateway
from app.models.ai_models import AIDecisionLog
from app.services.ai.rag_engine import RAGEngine
from app.services.ai.knowledge_graph import KnowledgeGraphEngine
from app.services.ai.orchestrator import AgentOrchestrator
from app.services.ai.confidence import ConfidenceEngine
from app.services.ai.explainability import ExplainabilityEngine

logger = logging.getLogger(__name__)

class AIDecisionEngine:
    def __init__(self, db: Session):
        self.db = db
        self.llm = LLMGateway()
        self.rag = RAGEngine()
        self.kg = KnowledgeGraphEngine(db)
        self.orchestrator = AgentOrchestrator(self.llm)

    def handle_query(self, query: str) -> dict:
        """
        Processes a natural language query, retrieves context, and returns a structured AI response.
        """
        logger.info(f"Handling AI query: {query}")
        
        # 1. Gather Context
        rag_context = self.rag.retrieve_context(query)
        kg_context = self.kg.get_asset_context()
        
        context = {
            "telemetry": "Active",
            "forecasts": "Cloud cover increasing, solar down 15MW",
            "optimizations": "Green Mode recommended (battery discharge)",
            "rag": rag_context,
            "kg": kg_context
        }
        
        # 2. Query Multi-Agent Pipeline
        llm_response = self.orchestrator.run_pipeline(query, context)
        
        # 3. Format as structured JSON output
        structured_output = ExplainabilityEngine.parse_and_format(llm_response, context)
        
        # 4. Calculate Confidence
        # In real life, calculate based on actual RMSE metrics
        confidence_val = ConfidenceEngine.calculate(telemetry_freshness=0.9, forecast_accuracy=0.85, rag_hits=1)
        structured_output["confidence"] = confidence_val
        
        # 5. Log Audit Trail
        log_entry = AIDecisionLog(
            query_text=query,
            context_data_json=context,
            raw_llm_response=llm_response,
            structured_recommendation=structured_output,
            confidence_score=confidence_val
        )
        self.db.add(log_entry)
        self.db.commit()
        
        return structured_output
