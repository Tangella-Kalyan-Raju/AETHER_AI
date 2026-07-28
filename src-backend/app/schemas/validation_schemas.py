from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ValidationErrorDetail(BaseModel):
    record_id: Optional[str] = None
    entity_type: str
    error_type: str
    message: str

class ValidationWarningDetail(BaseModel):
    record_id: Optional[str] = None
    entity_type: str
    warning_type: str
    message: str

class ValidationReport(BaseModel):
    dataset_name: str
    import_timestamp: datetime = Field(default_factory=datetime.utcnow)
    records_processed: int = 0
    records_accepted: int = 0
    records_rejected: int = 0
    missing_values_detected: int = 0
    duplicate_records_detected: int = 0
    errors: List[ValidationErrorDetail] = []
    warnings: List[ValidationWarningDetail] = []
    
    def add_error(self, entity_type: str, error_type: str, message: str, record_id: str = None):
        self.errors.append(ValidationErrorDetail(
            entity_type=entity_type,
            error_type=error_type,
            message=message,
            record_id=record_id
        ))
        self.records_rejected += 1

    def add_warning(self, entity_type: str, warning_type: str, message: str, record_id: str = None):
        self.warnings.append(ValidationWarningDetail(
            entity_type=entity_type,
            warning_type=warning_type,
            message=message,
            record_id=record_id
        ))
