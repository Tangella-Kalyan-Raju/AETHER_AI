from typing import Dict, Any, List
from datetime import datetime
import dateutil.parser
from app.schemas.validation_schemas import ValidationReport

class TimestampValidator:
    """
    Validates timestamp formats and converts them to standard datetime objects.
    """

    def validate(self, dataset: Dict[str, List[Dict[str, Any]]], report: ValidationReport) -> Dict[str, List[Dict[str, Any]]]:
        valid_dataset = {}

        for entity_type, records in dataset.items():
            valid_records = []
            
            for idx, record in enumerate(records):
                record_id = record.get("id") or record.get("name") or f"{entity_type}_{idx}"
                timestamp_val = record.get("timestamp")
                
                if timestamp_val is not None:
                    try:
                        if isinstance(timestamp_val, str):
                            # Parse ISO string
                            dt = dateutil.parser.isoparse(timestamp_val)
                            record["timestamp"] = dt
                        elif isinstance(timestamp_val, (int, float)):
                            # Parse unix timestamp
                            dt = datetime.fromtimestamp(timestamp_val)
                            record["timestamp"] = dt
                        elif isinstance(timestamp_val, datetime):
                            pass
                        else:
                            raise ValueError(f"Unknown timestamp format type: {type(timestamp_val)}")
                        
                        valid_records.append(record)
                    except Exception as e:
                        report.add_error(
                            entity_type, 
                            "timestamp_invalid", 
                            f"Invalid timestamp format '{timestamp_val}': {e}", 
                            record_id
                        )
                else:
                    valid_records.append(record)
                    
            valid_dataset[entity_type] = valid_records

        return valid_dataset
