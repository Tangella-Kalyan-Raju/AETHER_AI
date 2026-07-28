class ConfidenceFramework:
    def __init__(self):
        pass

    def calculate_confidence(self, data_points: int, variance: float, historical_accuracy: float) -> dict:
        """
        Calculates confidence score based on data quality and historical model performance.
        Returns percentage and qualitative level.
        """
        # Simplified mock calculation
        base_score = 100.0
        penalty = (variance * 0.1)
        score = max(0.0, min(100.0, base_score - penalty + (historical_accuracy * 0.1)))
        
        level = "High"
        if score < 60:
            level = "Low"
        elif score < 85:
            level = "Medium"
            
        return {
            "score": round(score, 2),
            "level": level,
            "metadata": {
                "data_points_used": data_points,
                "variance_penalty": round(penalty, 2)
            }
        }

confidence_framework = ConfidenceFramework()
