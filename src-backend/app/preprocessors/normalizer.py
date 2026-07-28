from typing import Dict, Any, List
from app.schemas.validation_schemas import ValidationReport

class Normalizer:
    """
    Standardizes units and text formatting across the dataset.
    """

    def normalize(self, dataset: Dict[str, List[Dict[str, Any]]], report: ValidationReport) -> Dict[str, List[Dict[str, Any]]]:
        normalized_dataset = {}

        for entity_type, records in dataset.items():
            normalized_records = []
            
            for idx, record in enumerate(records):
                normalized_record = dict(record)
                
                # Standardize generator types (e.g., "Thermal", "THERMAL" -> "thermal")
                if "generator_type" in normalized_record and isinstance(normalized_record["generator_type"], str):
                    normalized_record["generator_type"] = normalized_record["generator_type"].strip().lower()
                    
                if "type" in normalized_record and isinstance(normalized_record["type"], str):
                    normalized_record["type"] = normalized_record["type"].strip().lower()

                # Basic unit normalizations if explicit keys are provided, e.g. capacity_kw to capacity
                if "capacity_kw" in normalized_record:
                    kw = float(normalized_record.pop("capacity_kw"))
                    normalized_record["installed_capacity"] = kw / 1000.0
                    
                normalized_records.append(normalized_record)
                
            normalized_dataset[entity_type] = normalized_records
            
        return normalized_dataset
