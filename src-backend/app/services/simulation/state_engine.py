class StateTransitionEngine:
    """
    Responsible for mutating the simulated isolated state of the Grid
    based on ScenarioEvents, without touching live telemetry.
    """
    
    @staticmethod
    def apply_event(current_state: dict, event: dict) -> dict:
        """
        Pure function. Takes a state snapshot dict and an event dict.
        Returns the new state snapshot dict.
        """
        new_state = current_state.copy()
        
        event_type = event.get("event_type")
        params = event.get("parameters_json", {})
        
        if event_type == "Weather":
            if "cloud_cover" in params:
                new_state["solar_irradiance_modifier"] = 1.0 - (params["cloud_cover"] / 100.0)
                
        elif event_type == "Demand":
            if "load_increase" in params:
                new_state["demand_modifier"] = 1.0 + (params["load_increase"] / 100.0)
                
        elif event_type == "Failure":
            if "asset_id" in params:
                failed_assets = new_state.get("failed_assets", [])
                if params["asset_id"] not in failed_assets:
                    failed_assets.append(params["asset_id"])
                new_state["failed_assets"] = failed_assets
                
        return new_state
