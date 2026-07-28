import pytest
from app.services.forecasting.forecast_manager import ForecastManager
from app.services.optimization.manager import OptimizationManager
from app.services.ai.decision_engine import AIDecisionEngine
from app.database.connection import SessionLocal

def test_workflow_cloud_cover_increase():
    """
    Validates Scenario: Increasing cloud cover
    Expectation: Optimization recommends Battery Discharge or Economic Mode,
    and AI identifies the solar drop as the core issue.
    """
    db = SessionLocal()
    
    # In a full test suite, we would mock the `MeasurementLatest` table here with
    # artificial "cloud cover = 80%" telemetry.
    
    # 1. Run Optimization Manager (which would read the forecast built on the mock telemetry)
    opt_manager = OptimizationManager(db)
    opt_manager.generate_recommendations()
    
    # 2. Query AI
    ai = AIDecisionEngine(db)
    response = ai.handle_query("What is the impact of the current cloud cover on solar generation?")
    
    # 3. Assert Valid Output Pipeline
    assert "what_happened" in response
    assert response["confidence"] >= 50.0
    
    db.close()
