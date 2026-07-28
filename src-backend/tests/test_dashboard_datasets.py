import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.dashboard_models import Dataset, DatasetRecord, DashboardSummary
from app.services.dataset_service import DatasetService
from app.services.weather_service import WeatherService

# Setup in-memory sqlite engine for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_weather_service_fallback():
    # Test fallback fetches weather telemetry successfully without error
    res = WeatherService.get_weather_data(region_name="Hyderabad")
    assert res is not None
    assert "temperature" in res
    assert "humidity" in res
    assert res["region"] == "Hyderabad"

def test_dataset_column_detection():
    headers = ["DateTime", "Load_Zone", "Generator_MW", "Irradiance_GHI", "Temp_C"]
    col_mapping = DatasetService.detect_columns(headers)
    
    assert col_mapping.get("timestamp") == "DateTime"
    assert col_mapping.get("region") == "Load_Zone"
    assert col_mapping.get("current_generation") == "Generator_MW"
    assert col_mapping.get("solar_irradiance") == "Irradiance_GHI"
    assert col_mapping.get("temperature") == "Temp_C"

def test_csv_parsing(db_session):
    csv_content = b"DateTime,Load_Zone,Generator_MW,Irradiance_GHI,Temp_C\n2026-07-26 12:00:00,Hyderabad,150.0,450.0,32.5\n"
    
    # Process
    dataset = DatasetService.process_dataset(db_session, "test_dataset.csv", csv_content)
    assert dataset.filename == "test_dataset.csv"
    assert dataset.row_count == 1
    assert dataset.status == "uploaded"
    
    # Import records
    res = DatasetService.import_records(db_session, dataset.id, csv_content, enrich_weather=False)
    assert res["success"] is True
    assert res["row_count"] == 1
    
    # Check stored record
    stored = db_session.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset.id).first()
    assert stored is not None
    assert stored.current_generation == 150.0
    assert stored.solar_irradiance == 450.0
    assert stored.temperature == 32.5
