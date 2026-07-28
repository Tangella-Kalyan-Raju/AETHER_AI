import pytest
from app.services.policy_engine.weight_recommender import PolicyOptimizationRecommender

def test_recommendation_storm_conditions():
    """Verify storm condition triggers contingency recommendations with correct reliability weights."""
    weather = {
        "condition": "Heavy Thunderstorm",
        "wind_speed_ms": 25.5,
        "solar_yield_prediction_mw": 500.0
    }
    grid = {
        "battery_degradation_index": 0.05,
        "peak_load_forecast_mw": 8000.0
    }
    
    recs = PolicyOptimizationRecommender.generate_recommendations("Balanced Mode", weather, grid)
    assert len(recs) > 0
    
    storm_rec = next((r for r in recs if r["type"] == "STORM_CONTINGENCY"), None)
    assert storm_rec is not None
    assert storm_rec["recommended_weights"]["reliability"] == 0.45
    assert storm_rec["recommended_weights"]["stability"] == 0.45
    assert storm_rec["confidence_score"] >= 0.90
    assert "contingency" in storm_rec["reasoning"].lower()

def test_recommendation_high_solar_conditions():
    """Verify sunny forecasts trigger renewable yield maximization recommendations."""
    weather = {
        "condition": "Sunny",
        "wind_speed_ms": 2.0,
        "solar_yield_prediction_mw": 4500.0
    }
    grid = {
        "battery_degradation_index": 0.05,
        "peak_load_forecast_mw": 8000.0
    }
    
    recs = PolicyOptimizationRecommender.generate_recommendations("Balanced Mode", weather, grid)
    assert len(recs) > 0
    
    solar_rec = next((r for r in recs if r["type"] == "HIGH_SOLAR_YIELD"), None)
    assert solar_rec is not None
    assert solar_rec["recommended_weights"]["carbon"] == 0.65
    assert "PV fields" in solar_rec["reasoning"]

def test_recommendation_battery_degradation():
    """Verify high battery cell wear triggers preservation suggestions."""
    weather = {
        "condition": "Cloudy",
        "wind_speed_ms": 4.0,
        "solar_yield_prediction_mw": 1200.0
    }
    grid = {
        "battery_degradation_index": 0.18, # 18% wear
        "peak_load_forecast_mw": 8000.0
    }
    
    recs = PolicyOptimizationRecommender.generate_recommendations("Balanced Mode", weather, grid)
    assert len(recs) > 0
    
    bat_rec = next((r for r in recs if r["type"] == "BATTERY_DEGRADATION"), None)
    assert bat_rec is not None
    assert bat_rec["recommended_weights"]["reliability"] == 0.35
    assert "degradation" in bat_rec["reasoning"].lower()

def test_recommendation_peak_demand():
    """Verify high peak load forecast triggers peak demand recommendations."""
    weather = {
        "condition": "Nominal",
        "wind_speed_ms": 3.0,
        "solar_yield_prediction_mw": 1500.0
    }
    grid = {
        "battery_degradation_index": 0.05,
        "peak_load_forecast_mw": 16200.0 # High load
    }
    
    recs = PolicyOptimizationRecommender.generate_recommendations("Balanced Mode", weather, grid)
    assert len(recs) > 0
    
    peak_rec = next((r for r in recs if r["type"] == "PEAK_DEMAND"), None)
    assert peak_rec is not None
    assert peak_rec["recommended_weights"]["cost"] == 0.35
    assert "Reduced loading" in peak_rec["expected_outcome"]

def test_recommendation_nominal_tuning():
    """Verify nominal conditions return general optimizer tuning suggestions."""
    weather = {
        "condition": "Clear",
        "wind_speed_ms": 2.0,
        "solar_yield_prediction_mw": 1500.0
    }
    grid = {
        "battery_degradation_index": 0.02,
        "peak_load_forecast_mw": 6000.0
    }
    
    recs = PolicyOptimizationRecommender.generate_recommendations("Balanced Mode", weather, grid)
    assert len(recs) == 1
    assert recs[0]["type"] == "NOMINAL_OPTIMIZE"
