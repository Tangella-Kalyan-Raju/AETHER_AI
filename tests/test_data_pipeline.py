import pytest
from app.validators.structural_validator import StructuralValidator
from app.validators.engineering_validator import EngineeringValidator
from app.validators.integrity_validator import IntegrityValidator
from app.validators.timestamp_validator import TimestampValidator
from app.preprocessors.cleaner import Cleaner
from app.schemas.validation_schemas import ValidationReport

def test_structural_validator():
    validator = StructuralValidator()
    report = ValidationReport(dataset_name="Test")
    
    # Missing 'type' and 'capacity'
    dataset = {
        "generators": [{"name": "Gen1"}]
    }
    schema = {"generators": ["name", "type", "capacity"]}
    
    is_valid = validator.validate(dataset, report, schema)
    assert not is_valid
    assert len(report.errors) == 1
    assert report.errors[0].error_type == "structural_missing_keys"


def test_engineering_validator():
    validator = EngineeringValidator()
    report = ValidationReport(dataset_name="Test")
    
    dataset = {
        "generators": [
            {"id": "1", "capacity": 100},
            {"id": "2", "capacity": -50}  # Invalid
        ]
    }
    
    valid_data = validator.validate(dataset, report)
    
    assert len(valid_data["generators"]) == 1
    assert valid_data["generators"][0]["id"] == "1"
    assert len(report.errors) == 1
    assert report.errors[0].error_type == "engineering_constraint"


def test_integrity_validator():
    validator = IntegrityValidator()
    report = ValidationReport(dataset_name="Test")
    
    dataset = {
        "generators": [
            {"id": "gen-1", "name": "Gen A"},
            {"id": "gen-1", "name": "Gen B"}  # Duplicate ID
        ]
    }
    
    valid_data = validator.validate(dataset, report)
    
    assert len(valid_data["generators"]) == 1
    assert report.duplicate_records_detected == 1


def test_cleaner():
    cleaner = Cleaner()
    report = ValidationReport(dataset_name="Test")
    
    dataset = {
        "generators": [
            {"id": "1", "desc": "N/A"},
            {"id": "2", "desc": "null"},
            {"id": "3", "desc": ""}
        ]
    }
    
    cleaned = cleaner.clean(dataset, report)
    
    for gen in cleaned["generators"]:
        assert gen["desc"] is None
        
    assert report.missing_values_detected == 3


def test_timestamp_validator():
    validator = TimestampValidator()
    report = ValidationReport(dataset_name="Test")
    
    dataset = {
        "eng_renewable_generation": [
            {"id": "1", "timestamp": "2026-07-24T12:00:00Z"},
            {"id": "2", "timestamp": "invalid_date"}
        ]
    }
    
    valid_data = validator.validate(dataset, report)
    
    assert len(valid_data["eng_renewable_generation"]) == 1
    assert len(report.errors) == 1
    assert report.errors[0].error_type == "timestamp_invalid"
