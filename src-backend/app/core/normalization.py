import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger("gpo.core.normalization")

class NormalizationEngine:
    """
    Standardizes external provider data into the GPO Unified Format.
    Handles unit conversions and timezone normalizations.
    """
    
    @staticmethod
    def normalize_temperature(value: float, from_unit: str) -> float:
        """Always return temperature in Celsius"""
        if from_unit.lower() in ["f", "fahrenheit"]:
            return (value - 32) * 5.0 / 9.0
        elif from_unit.lower() in ["k", "kelvin"]:
            return value - 273.15
        return value

    @staticmethod
    def normalize_wind_speed(value: float, from_unit: str) -> float:
        """Always return wind speed in m/s"""
        if from_unit.lower() in ["km/h", "kmh"]:
            return value / 3.6
        elif from_unit.lower() in ["mph"]:
            return value * 0.44704
        return value

    @staticmethod
    def normalize_timestamp(timestamp: str) -> datetime:
        """Always return UTC timezone-aware datetime"""
        try:
            # Assuming ISO 8601 string from providers
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception as e:
            logger.error(f"Timestamp normalization failed: {e}")
            return datetime.now(timezone.utc)

    @staticmethod
    def normalize_payload(payload: Dict[str, Any], provider_type: str) -> Dict[str, Any]:
        """
        Main entrypoint for payload normalization.
        """
        normalized = {}
        for key, value in payload.items():
            # Example basic normalizations based on common key names
            if key in ["temp", "temperature"]:
                normalized["temperature"] = NormalizationEngine.normalize_temperature(float(value), payload.get("temp_unit", "c"))
                normalized["temperature_unit"] = "c"
            elif key in ["wind_speed", "wind"]:
                normalized["wind_speed"] = NormalizationEngine.normalize_wind_speed(float(value), payload.get("wind_unit", "m/s"))
                normalized["wind_speed_unit"] = "m/s"
            elif key in ["timestamp", "time", "date"]:
                normalized["timestamp"] = NormalizationEngine.normalize_timestamp(str(value))
            else:
                normalized[key] = value
                
        return normalized
