from typing import Dict, Any, List
from datetime import datetime
from app.schemas.validation_schemas import ValidationReport

class ChronologicalPreprocessor:
    """
    Ensures time-series data (like Renewables and Demand) is chronologically sorted.
    """

    def preprocess(self, dataset: Dict[str, List[Dict[str, Any]]], report: ValidationReport) -> Dict[str, List[Dict[str, Any]]]:
        processed_dataset = dict(dataset)

        for entity_type in ["eng_renewable_generation", "eng_demand_profiles", "demand_profiles", "renewables"]:
            if entity_type in processed_dataset:
                records = processed_dataset[entity_type]
                
                # We can only sort if timestamps are valid datetimes
                try:
                    processed_dataset[entity_type] = sorted(
                        records, 
                        key=lambda x: x.get("timestamp", datetime.min) if isinstance(x.get("timestamp"), datetime) else datetime.min
                    )
                except Exception as e:
                    report.add_warning(
                        entity_type, 
                        "chronological_sort_failed", 
                        f"Failed to sort {entity_type} chronologically: {e}"
                    )
                    
        return processed_dataset
