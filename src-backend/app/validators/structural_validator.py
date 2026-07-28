from typing import Dict, Any, List
from app.schemas.validation_schemas import ValidationReport

class StructuralValidator:
    """
    Validates the structure of incoming datasets.
    Ensures required columns/keys are present and the dataset is not empty.
    """
    
    def validate(self, dataset: Dict[str, List[Dict[str, Any]]], report: ValidationReport, required_schema: Dict[str, List[str]]) -> bool:
        """
        required_schema = {
            "generators": ["name", "type", "capacity"],
            "transmission_lines": ["from_bus", "to_bus"]
        }
        """
        is_valid = True
        
        if not dataset:
            report.add_error("dataset", "structural", "Dataset is empty or incorrectly formatted.")
            return False

        for entity_type, required_keys in required_schema.items():
            records = dataset.get(entity_type, [])
            if not isinstance(records, list):
                report.add_error(entity_type, "structural", f"Expected list of records, got {type(records).__name__}")
                is_valid = False
                continue
                
            for idx, record in enumerate(records):
                missing_keys = [key for key in required_keys if key not in record]
                if missing_keys:
                    report.add_error(
                        entity_type,
                        "structural_missing_keys",
                        f"Record missing required keys: {missing_keys}",
                        record_id=f"{entity_type}_{idx}"
                    )
                    is_valid = False
                    
        return is_valid
