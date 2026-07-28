import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.schemas.validation_schemas import ValidationReport
from app.validators.structural_validator import StructuralValidator
from app.validators.integrity_validator import IntegrityValidator
from app.validators.engineering_validator import EngineeringValidator
from app.validators.timestamp_validator import TimestampValidator
from app.preprocessors.cleaner import Cleaner
from app.preprocessors.normalizer import Normalizer
from app.preprocessors.chronological_preprocessor import ChronologicalPreprocessor
from app.core.exceptions import GPOException

logger = logging.getLogger("gpo.importers")

class BaseImporter(ABC):
    """
    Abstract Base Class for importing datasets.
    Defines the standard pipeline:
    Reader -> Parser -> Validator -> Cleaner -> Normalizer -> Preprocessor -> Storage
    """
    
    def __init__(self, repository, dataset_name: str = "Unknown Dataset"):
        self.repository = repository
        self.report = ValidationReport(dataset_name=dataset_name)
        
        # Initialize pipeline components
        self.structural_validator = StructuralValidator()
        self.integrity_validator = IntegrityValidator()
        self.engineering_validator = EngineeringValidator()
        self.timestamp_validator = TimestampValidator()
        self.cleaner = Cleaner()
        self.normalizer = Normalizer()
        self.chronological_preprocessor = ChronologicalPreprocessor()

    def import_dataset(self, raw_data: Any) -> Dict[str, Any]:
        logger.info(f"Starting import using {self.__class__.__name__}")
        try:
            # 1. Reader / Parser
            parsed_data = self.parse(raw_data)
            
            # Count initial records
            for key, val in parsed_data.items():
                if isinstance(val, list):
                    self.report.records_processed += len(val)

            # 2. Structural Validation
            if not self.structural_validator.validate(parsed_data, self.report, self.get_required_schema()):
                logger.error("Structural validation failed. Aborting import.")
                return self.report.model_dump()

            # 3. Validation Phase
            validated_data = self.integrity_validator.validate(parsed_data, self.report)
            validated_data = self.engineering_validator.validate(validated_data, self.report)
            validated_data = self.timestamp_validator.validate(validated_data, self.report)

            # 4. Cleaning
            cleaned_data = self.cleaner.clean(validated_data, self.report)
            
            # 5. Normalization
            normalized_data = self.normalizer.normalize(cleaned_data, self.report)
            
            # 6. Preprocessing
            preprocessed_data = self.chronological_preprocessor.preprocess(normalized_data, self.report)
            
            # Count accepted records
            for key, val in preprocessed_data.items():
                if isinstance(val, list):
                    self.report.records_accepted += len(val)

            # 7. Repository / Database Load
            if self.report.records_accepted > 0:
                if hasattr(self, 'dry_run') and getattr(self, 'dry_run'):
                    logger.info("Dry run enabled. Skipping database load.")
                    self.report.add_warning("pipeline", "dry_run", "Dry run enabled. No data was saved to the database.")
                else:
                    self.load(preprocessed_data)
            
            logger.info(f"Import complete. Processed: {self.report.records_processed}, Accepted: {self.report.records_accepted}, Rejected: {self.report.records_rejected}")
            return self.report.model_dump()
            
        except Exception as e:
            logger.error(f"Import failed critically: {str(e)}")
            self.report.add_error("pipeline", "critical_failure", str(e))
            raise GPOException(f"Pipeline execution failed: {str(e)}") from e

    @abstractmethod
    def parse(self, raw_data: Any) -> Dict[str, List[Dict[str, Any]]]:
        """Parses raw data into a structured dictionary of lists."""
        pass

    def get_required_schema(self) -> Dict[str, List[str]]:
        """Returns the structural schema requirements for this importer."""
        return {}

    @abstractmethod
    def load(self, transformed_data: Dict[str, List[Dict[str, Any]]]) -> None:
        """Loads final preprocessed data into the repository."""
        pass
