import json
import logging
from typing import Dict, Any, List
from pydantic import ValidationError
from app.importers.base_importer import BaseImporter
from app.schemas.engineering_schemas import EngGeneratorBase, EngTransmissionLineBase
from app.core.exceptions import GPOException

logger = logging.getLogger("gpo.importers.ieee")

class IEEEImporter(BaseImporter):
    """
    Configuration-driven importer for IEEE bus systems.
    Currently assumes JSON format data in a standard structure.
    """
    def __init__(self, repository, system_type: str, region_id: str, dry_run: bool = False):
        super().__init__(repository, dataset_name=f"IEEE_{system_type}")
        self.system_type = system_type # e.g., '14_bus', '30_bus'
        self.region_id = region_id
        self.dry_run = dry_run

    def get_required_schema(self) -> Dict[str, List[str]]:
        return {
            "generators": ["type", "capacity"],
            "transmission_lines": ["from_bus", "to_bus"]
        }

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        import csv
        from io import StringIO
        
        if isinstance(raw_data, str):
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                # Attempt CSV parsing if JSON fails
                try:
                    f = StringIO(raw_data)
                    reader = csv.DictReader(f)
                    lines = list(reader)
                    if not lines:
                        raise GPOException("Invalid data format")
                    # Naive mapping: assume all are generators if 'type' in first row, else branches
                    if 'capacity' in lines[0] or 'installed_capacity' in lines[0]:
                        data = {"generators": lines, "branches": []}
                    else:
                        data = {"generators": [], "branches": lines}
                except Exception as e:
                    raise GPOException(f"Invalid JSON or CSV data: {str(e)}")
        elif isinstance(raw_data, dict):
            data = raw_data
        else:
            raise GPOException("Unsupported data format. Expected JSON string or dictionary.")
        
        # Typically IEEE data is grouped by entities: generators, branches(transmission lines)
        generators = data.get("generators", [])
        transmission_lines = data.get("branches", [])
        
        return {
            "generators": generators,
            "transmission_lines": transmission_lines
        }

    def load(self, transformed_data: Dict[str, List[Any]]) -> None:
        for gen in transformed_data.get("generators", []):
            try:
                # Need to map raw dict to EngGeneratorBase schema
                gen_data = EngGeneratorBase(
                    name=gen.get("name", f"Gen-{gen.get('bus_id', 'Unknown')}"),
                    region_id=self.region_id,
                    generator_type=gen.get("type", "thermal"),
                    installed_capacity=gen.get("installed_capacity", gen.get("capacity", 0.0)),
                    minimum_output=gen.get("min_p", 0.0),
                    maximum_output=gen.get("max_p", 0.0)
                )
                self.repository.create_generator(gen_data)
            except Exception as e:
                logger.error(f"Failed to load generator {gen.get('name')}: {e}")
                self.report.add_error("generators", "load_failure", str(e), record_id=gen.get('id'))

        for line in transformed_data.get("transmission_lines", []):
            try:
                line_data = EngTransmissionLineBase(
                    name=line.get("name", f"Line-{line.get('from_bus')}-{line.get('to_bus')}"),
                    region_id=self.region_id,
                    source_substation=str(line.get("from_bus")),
                    destination_substation=str(line.get("to_bus")),
                    resistance=line.get("r"),
                    reactance=line.get("x")
                )
                self.repository.create_transmission_line(line_data)
            except Exception as e:
                logger.error(f"Failed to load transmission line {line.get('name')}: {e}")
                self.report.add_error("transmission_lines", "load_failure", str(e), record_id=line.get('id'))
