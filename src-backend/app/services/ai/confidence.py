class ConfidenceEngine:
    """
    Calculates a dynamic confidence score for AI recommendations.
    """
    @staticmethod
    def calculate(telemetry_freshness: float, forecast_accuracy: float, rag_hits: int) -> float:
        """
        Returns a confidence score between 0.0 and 100.0.
        telemetry_freshness: 0-1 (1 is live, 0 is stale)
        forecast_accuracy: 0-1 (1 is perfect history RMSE)
        rag_hits: number of policy documents retrieved
        """
        base_score = 50.0
        
        # Telemetry weight (20%)
        base_score += telemetry_freshness * 20.0
        
        # Forecast weight (20%)
        base_score += forecast_accuracy * 20.0
        
        # RAG grounding weight (10%)
        rag_bonus = min(10.0, rag_hits * 5.0)
        base_score += rag_bonus
        
        return min(100.0, round(base_score, 1))
