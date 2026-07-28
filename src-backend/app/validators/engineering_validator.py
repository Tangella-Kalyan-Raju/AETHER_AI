from typing import Dict, Any, List
from app.schemas.validation_schemas import ValidationReport

class EngineeringValidator:
    """
    Validates physical engineering constraints.
    - Capacity >= 0
    - Demand >= 0
    - Transmission length > 0
    """

    def validate(self, dataset: Dict[str, List[Dict[str, Any]]], report: ValidationReport) -> Dict[str, List[Dict[str, Any]]]:
        valid_dataset = {}

        # Validate Generators
        valid_gens = []
        for idx, gen in enumerate(dataset.get("generators", [])):
            record_id = gen.get("id") or gen.get("name") or f"gen_{idx}"
            capacity = gen.get("installed_capacity") or gen.get("capacity")
            if capacity is not None and float(capacity) < 0:
                report.add_error("generators", "engineering_constraint", f"Negative capacity not allowed: {capacity}", record_id)
            else:
                valid_gens.append(gen)
        if "generators" in dataset:
            valid_dataset["generators"] = valid_gens

        # Validate Transmission Lines
        valid_lines = []
        for idx, line in enumerate(dataset.get("transmission_lines", [])):
            record_id = line.get("id") or line.get("name") or f"line_{idx}"
            length = line.get("line_length")
            if length is not None and float(length) <= 0:
                report.add_error("transmission_lines", "engineering_constraint", f"Transmission length must be > 0: {length}", record_id)
            else:
                valid_lines.append(line)
        if "transmission_lines" in dataset:
            valid_dataset["transmission_lines"] = valid_lines

        # Validate Battery Storage
        valid_bats = []
        for idx, bat in enumerate(dataset.get("battery_storage", [])):
            record_id = bat.get("id") or bat.get("name") or f"bat_{idx}"
            capacity = bat.get("capacity")
            if capacity is not None and float(capacity) < 0:
                report.add_error("battery_storage", "engineering_constraint", f"Negative battery capacity not allowed: {capacity}", record_id)
            else:
                valid_bats.append(bat)
        if "battery_storage" in dataset:
            valid_dataset["battery_storage"] = valid_bats

        # Validate Demand
        valid_demands = []
        for idx, dem in enumerate(dataset.get("demand_profiles", [])):
            record_id = dem.get("id") or f"demand_{idx}"
            demand_val = dem.get("demand")
            if demand_val is not None and float(demand_val) < 0:
                report.add_error("demand_profiles", "engineering_constraint", f"Negative demand not allowed: {demand_val}", record_id)
            else:
                valid_demands.append(dem)
        if "demand_profiles" in dataset:
            valid_dataset["demand_profiles"] = valid_demands
            
        # Copy over anything else untouched
        for key, value in dataset.items():
            if key not in valid_dataset:
                valid_dataset[key] = value

        return valid_dataset
