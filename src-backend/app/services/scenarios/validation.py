class ScenarioValidationEngine:
    @staticmethod
    def validate(data: dict) -> bool:
        """
        Ensures a scenario conforms to operational bounds.
        Returns True if valid, raises ValueError if invalid.
        """
        # Validate Required Fields
        required_fields = ["name", "category", "scenario_type", "severity", "trigger_conditions_json"]
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == "":
                raise ValueError(f"Missing required field: {field}")
                
        # Validate Severity
        valid_severities = ["Low", "Medium", "High", "Critical"]
        if data["severity"] not in valid_severities:
            raise ValueError(f"Invalid severity. Must be one of {valid_severities}")
            
        # Validate Duration
        duration = data.get("estimated_duration_mins", 60)
        if duration < 1 or duration > 1440: # max 24 hours
            raise ValueError("estimated_duration_mins must be between 1 and 1440.")
            
        return True
