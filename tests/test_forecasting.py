import pytest
from app.services.forecasting.forecasters import WeatherForecaster, DemandForecaster, RenewableForecaster
from datetime import datetime, timezone

def test_weather_forecaster():
    now = datetime.now(timezone.utc)
    res = WeatherForecaster.generate(25.0, 60, now)
    assert "predicted_value" in res
    assert "confidence_score" in res
    assert res["confidence_score"] <= 100

def test_demand_forecaster():
    now = datetime.now(timezone.utc)
    res = DemandForecaster.generate(10000.0, 120, now)
    assert res["predicted_value"] > 0
    assert res["lower_bound"] < res["upper_bound"]

def test_renewable_forecaster():
    now = datetime.now(timezone.utc)
    # Nighttime check
    night = now.replace(hour=2)
    res = RenewableForecaster.generate_solar(500, 3000, 30, night)
    assert res["predicted_value"] == 0.0

    # Daytime check
    day = now.replace(hour=12)
    res = RenewableForecaster.generate_solar(500, 3000, 30, day)
    assert res["predicted_value"] > 0.0
