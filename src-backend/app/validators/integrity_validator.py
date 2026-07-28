from typing import Dict, Any, List
from app.schemas.validation_schemas import ValidationReport

class IntegrityValidator:
    """
    Validates data integrity constraints across the dataset.
    Detects duplicates and ensures relational integrity if applicable.
    """

    def validate(self, dataset: Dict[str, List[Dict[str, Any]]], report: ValidationReport) -> Dict[str, List[Dict[str, Any]]]:
        valid_dataset = {}
        
        for entity_type, records in dataset.items():
            seen_ids = set()
            valid_records = []
            
            for idx, record in enumerate(records):
                # Using name or id as unique identifier within dataset
                record_id = record.get("id") or record.get("name") or f"{entity_type}_{idx}"
                
                if record_id in seen_ids:
                    report.duplicate_records_detected += 1
                    report.add_error(
                        entity_type,
                        "integrity_duplicate",
                        f"Duplicate record detected with identifier: {record_id}",
                        record_id=str(record_id)
                    )
                else:
                    seen_ids.add(record_id)
                    valid_records.append(record)
                    
            valid_dataset[entity_type] = valid_records

        return valid_dataset
