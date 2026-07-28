from sqlalchemy.orm import Session
from app.models.scenario_models import ScenarioTemplate, ScenarioEvent
from typing import List, Optional
import json

class ScenarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, category: Optional[str] = None) -> List[ScenarioTemplate]:
        query = self.db.query(ScenarioTemplate).filter(ScenarioTemplate.is_latest == True)
        if category:
            query = query.filter(ScenarioTemplate.category == category)
        return query.all()

    def get_by_id(self, scenario_id: str) -> Optional[ScenarioTemplate]:
        return self.db.query(ScenarioTemplate).filter(ScenarioTemplate.id == scenario_id).first()

    def create(self, data: dict) -> ScenarioTemplate:
        # Extract events if provided
        events_data = data.pop("events", [])
        
        scenario = ScenarioTemplate(**data)
        self.db.add(scenario)
        self.db.commit()
        self.db.refresh(scenario)
        
        # Add events
        if events_data:
            for event_data in events_data:
                event_data["scenario_id"] = scenario.id
                event = ScenarioEvent(**event_data)
                self.db.add(event)
            self.db.commit()
            
        return scenario

    def clone_and_update(self, base_id: str, new_data: dict) -> ScenarioTemplate:
        """
        Creates a new version of a scenario, deprecating the old one.
        """
        base_scenario = self.get_by_id(base_id)
        if not base_scenario:
            raise ValueError(f"Scenario {base_id} not found.")

        # Deprecate the old one
        base_scenario.is_latest = False
        
        # Merge old data with new data
        cloned_data = {
            "scenario_group_id": base_scenario.scenario_group_id,
            "version": base_scenario.version + 1,
            "is_latest": True,
            "name": new_data.get("name", base_scenario.name),
            "description": new_data.get("description", base_scenario.description),
            "category": new_data.get("category", base_scenario.category),
            "scenario_type": new_data.get("scenario_type", base_scenario.scenario_type),
            "severity": new_data.get("severity", base_scenario.severity),
            "region": new_data.get("region", base_scenario.region),
            "city": new_data.get("city", base_scenario.city),
            "estimated_duration_mins": new_data.get("estimated_duration_mins", base_scenario.estimated_duration_mins),
            "trigger_conditions_json": new_data.get("trigger_conditions_json", base_scenario.trigger_conditions_json),
            "expected_outcomes_json": new_data.get("expected_outcomes_json", base_scenario.expected_outcomes_json),
            "tags": new_data.get("tags", base_scenario.tags),
            "created_by": new_data.get("created_by", "operator")
        }
        
        new_scenario = ScenarioTemplate(**cloned_data)
        self.db.add(new_scenario)
        self.db.commit()
        self.db.refresh(new_scenario)
        return new_scenario
