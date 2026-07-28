import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone

logger = logging.getLogger("gpo.core.validation")

class ValidationEngine:
    """
    Validates incoming payload data and calculates a quality score.
    Returns (is_valid, quality_score, issues_list).
    """

    @staticmethod
    def validate_payload(payload: Dict[str, Any], schema_type: str) -> Tuple[bool, int, List[Dict[str, str]]]:
        issues = []
        quality_score = 100

        if not payload:
            return False, 0, [{"issue_type": "MISSING_DATA", "description": "Empty payload received"}]

        # Basic Check: Missing essential keys
        essential_keys = ["timestamp"]
        if schema_type == "weather":
            essential_keys.extend(["temperature"])
        elif schema_type == "demand":
            essential_keys.extend(["demand_mw"])

        for key in essential_keys:
            if key not in payload or payload[key] is None:
                issues.append({"issue_type": "MISSING_VALUE", "description": f"Missing essential key: {key}"})
                quality_score -= 20

        # Basic Check: Stale timestamp
        if "timestamp" in payload:
            ts = payload["timestamp"]
            if isinstance(ts, datetime):
                time_diff = (datetime.now(timezone.utc) - ts).total_seconds()
                if time_diff > 3600: # Older than 1 hour
                    issues.append({"issue_type": "STALE_DATA", "description": "Data is older than 1 hour"})
                    quality_score -= 30
                elif time_diff < -60: # Future date (allowing 1 min clock skew)
                    issues.append({"issue_type": "FUTURE_TIMESTAMP", "description": "Timestamp is in the future"})
                    quality_score -= 50

        # Specific Checks
        if schema_type == "weather" and "temperature" in payload:
            temp = payload["temperature"]
            if not isinstance(temp, (int, float)):
                issues.append({"issue_type": "INVALID_TYPE", "description": "Temperature must be a number"})
                quality_score -= 40
            elif temp < -100 or temp > 100: # Celsius limits
                issues.append({"issue_type": "INVALID_RANGE", "description": f"Temperature {temp} out of logical bounds"})
                quality_score -= 40

        is_valid = quality_score > 0
        return is_valid, max(0, quality_score), issues
