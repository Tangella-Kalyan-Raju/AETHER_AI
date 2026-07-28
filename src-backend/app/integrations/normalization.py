from typing import Any, Dict
from datetime import datetime, timezone

class NormalizationEngine:
    """
    Normalizes incoming external telemetry data into a common internal format.
    Handles units, datatypes, and timestamps.
    """
    
    UNIT_CONVERSIONS = {
        "kW": lambda x: x / 1000.0,  # to MW
        "W": lambda x: x / 1000000.0, # to MW
        "V": lambda x: x / 1000.0,   # to kV
        "C": lambda x: x,            # Internal is Celsius
        "F": lambda x: (x - 32) * 5.0 / 9.0, # to Celsius
    }

    @staticmethod
    def normalize_measurement(raw_value: float, raw_unit: str) -> Dict[str, Any]:
        """Normalizes a measurement's value and unit."""
        unit_upper = raw_unit.upper() if raw_unit else ""
        
        # Power
        if unit_upper in ["KW", "W"]:
            val = NormalizationEngine.UNIT_CONVERSIONS[unit_upper if unit_upper != "KW" else "kW"](raw_value)
            return {"value": val, "unit": "MW"}
        
        # Voltage
        if unit_upper == "V":
            return {"value": NormalizationEngine.UNIT_CONVERSIONS["V"](raw_value), "unit": "kV"}
            
        # Temperature
        if unit_upper == "F":
            return {"value": NormalizationEngine.UNIT_CONVERSIONS["F"](raw_value), "unit": "C"}

        # Default pass-through
        return {"value": raw_value, "unit": raw_unit}

    @staticmethod
    def normalize_timestamp(raw_ts: Any) -> str:
        """Parses external timestamps into internal ISO format (UTC)."""
        # For simplicity in simulators, we assume the simulator generates standard datetimes or ISO strings.
        # In a real app, dateutil.parser would be used here.
        if isinstance(raw_ts, str):
            try:
                # Try simple ISO parsing
                dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
                return dt.astimezone(timezone.utc).isoformat()
            except ValueError:
                pass
        elif isinstance(raw_ts, datetime):
            return raw_ts.astimezone(timezone.utc).isoformat()
            
        # Fallback to current time
        return datetime.now(timezone.utc).isoformat()
