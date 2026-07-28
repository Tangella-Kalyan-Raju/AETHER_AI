import pytest
from app.integrations.providers.scada_connector import SCADAConnector
from app.integrations.normalization import NormalizationEngine

def test_normalization_engine():
    # Test Power (kW -> MW)
    norm = NormalizationEngine.normalize_measurement(1500, "kW")
    assert norm["value"] == 1.5
    assert norm["unit"] == "MW"
    
    # Test Temperature (F -> C)
    norm = NormalizationEngine.normalize_measurement(68, "F")
    assert norm["value"] == 20.0
    assert norm["unit"] == "C"
    
    # Test pass-through
    norm = NormalizationEngine.normalize_measurement(50, "Hz")
    assert norm["value"] == 50
    assert norm["unit"] == "Hz"

def test_scada_connector_init():
    connector = SCADAConnector(config_id="test-scada", settings={"polling_interval": 1})
    assert connector.config_id == "test-scada"
    assert connector.is_connected == False
    assert connector.metrics["messages_received"] == 0
