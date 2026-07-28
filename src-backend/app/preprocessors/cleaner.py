from typing import Dict, Any, List
from app.schemas.validation_schemas import ValidationReport

class Cleaner:
    """
    Cleans the dataset by handling missing non-critical values.
    We default them to None or a standard value instead of fabricating.
    """

    def clean(self, dataset: Dict[str, List[Dict[str, Any]]], report: ValidationReport) -> Dict[str, List[Dict[str, Any]]]:
        cleaned_dataset = {}

        for entity_type, records in dataset.items():
            cleaned_records = []
            
            for idx, record in enumerate(records):
                cleaned_record = dict(record)
                
                # Check for explicit None or empty strings that should be null
                for k, v in cleaned_record.items():
                    if v == "" or str(v).strip().lower() in ["nan", "null", "none", "n/a"]:
                        cleaned_record[k] = None
                        report.missing_values_detected += 1
                        report.add_warning(
                            entity_type, 
                            "missing_value_handled", 
                            f"Field '{k}' was missing and handled as null.", 
                            record_id=cleaned_record.get("id") or cleaned_record.get("name") or f"{entity_type}_{idx}"
                        )
                        
                cleaned_records.append(cleaned_record)
                
            cleaned_dataset[entity_type] = cleaned_records
            
        return cleaned_dataset
