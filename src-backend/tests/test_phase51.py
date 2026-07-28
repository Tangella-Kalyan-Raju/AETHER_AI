import pytest
from datetime import datetime, timezone
from app.core.normalization import NormalizationEngine
from app.core.validation import ValidationEngine

def test_normalization_temperature():
    # Test F to C
    assert NormalizationEngine.normalize_temperature(32.0, "F") == 0.0
    assert NormalizationEngine.normalize_temperature(212.0, "fahrenheit") == 100.0
    
    # Test K to C
    assert round(NormalizationEngine.normalize_temperature(273.15, "K"), 2) == 0.0
    
    # Test C to C
    assert NormalizationEngine.normalize_temperature(25.0, "C") == 25.0

def test_normalization_wind_speed():
    # Test km/h to m/s
    assert round(NormalizationEngine.normalize_wind_speed(36.0, "km/h"), 1) == 10.0
    # Test mph to m/s
    assert round(NormalizationEngine.normalize_wind_speed(10.0, "mph"), 2) == 4.47

def test_normalization_payload():
    raw = {
        "temperature": 68.0,
        "temp_unit": "F",
        "timestamp": "2024-01-01T12:00:00Z",
        "extra_field": "value"
    }
    norm = NormalizationEngine.normalize_payload(raw, "weather")
    assert norm["temperature"] == 20.0
    assert norm["temperature_unit"] == "c"
    assert isinstance(norm["timestamp"], datetime)
    assert norm["timestamp"].tzinfo == timezone.utc
    assert norm["extra_field"] == "value"

def test_validation_weather_payload_valid():
    payload = {
        "timestamp": datetime.now(timezone.utc),
        "temperature": 22.5
    }
    is_valid, score, issues = ValidationEngine.validate_payload(payload, "weather")
    assert is_valid is True
    assert score == 100
    assert len(issues) == 0

def test_validation_weather_payload_stale():
    # Stale by 2 hours
    stale_dt = datetime.now(timezone.utc).timestamp() - 7200
    payload = {
        "timestamp": datetime.fromtimestamp(stale_dt, tz=timezone.utc),
        "temperature": 22.5
    }
    is_valid, score, issues = ValidationEngine.validate_payload(payload, "weather")
    assert is_valid is True
    assert score == 70  # -30 for stale
    assert issues[0]["issue_type"] == "STALE_DATA"

def test_validation_weather_payload_invalid_temp():
    payload = {
        "timestamp": datetime.now(timezone.utc),
        "temperature": 500  # Invalid range
    }
    is_valid, score, issues = ValidationEngine.validate_payload(payload, "weather")
    assert is_valid is True
    assert score == 60  # -40 for invalid range
    assert issues[0]["issue_type"] == "INVALID_RANGE"

def test_validation_demand_payload_missing_keys():
    payload = {
        "timestamp": datetime.now(timezone.utc)
        # Missing demand_mw
    }
    is_valid, score, issues = ValidationEngine.validate_payload(payload, "demand")
    assert is_valid is True
    assert score == 80  # -20 for missing essential key
    assert issues[0]["issue_type"] == "MISSING_VALUE"
