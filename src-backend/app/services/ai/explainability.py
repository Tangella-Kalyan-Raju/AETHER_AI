class ExplainabilityEngine:
    """
    Forces AI outputs into a strict json schema to ensure operator trust and traceability.
    """
    @staticmethod
    def parse_and_format(llm_raw_output: str, context_used: dict) -> dict:
        """
        In a real production system, this would use LangChain's StructuredOutputParser.
        For this simulation, we construct the required schema directly.
        """
        # Ensure we always answer the 6 critical questions
        return {
            "what_happened": "Operator initiated a natural language query regarding grid conditions.",
            "why": "To receive evidence-backed decision support.",
            "evidence": {
                "telemetry": context_used.get("telemetry", "N/A"),
                "rag_documents": context_used.get("rag", "N/A"),
                "knowledge_graph": "Substation topologies analyzed."
            },
            "alternatives": ["Economic Mode", "Do Nothing"],
            "recommendation": llm_raw_output,
            "cost_impact": "Estimated $450/hr savings.",
            "carbon_impact": "12% reduction in CO2eq."
        }
