import logging
from sqlalchemy.orm import Session
from app.models.scenario_models import ScenarioTemplate
import json

logger = logging.getLogger(__name__)

PREDEFINED_SCENARIOS = [
    {
        "name": "Festival Demand Spike",
        "description": "Sudden 25% increase in residential demand starting at 18:00.",
        "category": "Demand",
        "scenario_type": "Spike",
        "severity": "High",
        "trigger_conditions_json": {"load_modifier": 1.25, "time_start": "18:00", "time_end": "23:00"},
        "expected_outcomes_json": {"battery_depletion": True, "thermal_dispatch": True},
        "tags": "demand, festival, peak",
        "is_system_default": True
    },
    {
        "name": "Sudden Solar Drop",
        "description": "Rapid moving cloud cover causing a 60% loss in solar irradiance.",
        "category": "Weather",
        "scenario_type": "Drop",
        "severity": "Medium",
        "trigger_conditions_json": {"solar_irradiance_modifier": 0.40, "ramp_down_mins": 15},
        "expected_outcomes_json": {"green_mode_risk": True},
        "tags": "solar, weather, cloud_cover",
        "is_system_default": True
    },
    {
        "name": "Transmission Line Outage (T1)",
        "description": "Unexpected trip of 220kV transmission line causing local congestion.",
        "category": "Grid",
        "scenario_type": "Failure",
        "severity": "Critical",
        "trigger_conditions_json": {"offline_lines": ["T1_HYD_SEC"]},
        "expected_outcomes_json": {"load_shedding_risk": True},
        "tags": "grid, outage, failure",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Winter Heat Wave (Demand Spike)",
        "description": "Sudden peak heat wave causing a 35% increase in industrial & residential cooling demand.",
        "category": "Demand",
        "scenario_type": "Spike",
        "severity": "High",
        "trigger_conditions_json": {"load_modifier": 1.35, "duration": 180},
        "expected_outcomes_json": {"voltage_instability": True, "contingency_dispatch": True},
        "tags": "historical, peak_load, demand_spike",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Unit 3 Gas Turbine Trip (Generator Failure)",
        "description": "Sudden mechanical failure and trip of Unit 3 Gas Turbine generator (250MW).",
        "category": "Grid",
        "scenario_type": "Failure",
        "severity": "Critical",
        "trigger_conditions_json": {"failed_assets": ["GEN_UNIT_3"], "generation_loss_mw": 250},
        "expected_outcomes_json": {"frequency_deviation": True, "load_shedding_warning": True},
        "tags": "historical, outage, generator_failure",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - 400kV Trunk Line Trip (Transmission Failure)",
        "description": "Lightning strike causing lightning arrestor trip on the main 400kV trunk line.",
        "category": "Grid",
        "scenario_type": "Failure",
        "severity": "Critical",
        "trigger_conditions_json": {"offline_lines": ["LINE_400KV_TRUNK"]},
        "expected_outcomes_json": {"loop_flows": True, "overload_lines": ["LINE_220KV_BYPASS"]},
        "tags": "historical, outage, transmission_failure",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Substation B BESS Thermal Runaway (Battery Failure)",
        "description": "Thermal anomaly triggering emergency shutdown of the 100MW Battery Storage at Substation B.",
        "category": "Grid",
        "scenario_type": "Failure",
        "severity": "High",
        "trigger_conditions_json": {"offline_batteries": ["BESS_SUBSTATION_B"]},
        "expected_outcomes_json": {"frequency_control_loss": True},
        "tags": "historical, battery, storage_failure",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Heavy Cloud Cover (Solar Drop)",
        "description": "Fast-moving storm front causing solar irradiance to fall by 80% across the Western region.",
        "category": "Weather",
        "scenario_type": "Drop",
        "severity": "Medium",
        "trigger_conditions_json": {"solar_irradiance_modifier": 0.20, "region": "West"},
        "expected_outcomes_json": {"ramp_up_reserves": True},
        "tags": "historical, weather, solar_drop",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Sudden Wind Dwindle (Wind Drop)",
        "description": "High pressure system causing wind speeds to plunge below cut-in speeds across the wind farms.",
        "category": "Weather",
        "scenario_type": "Drop",
        "severity": "Medium",
        "trigger_conditions_json": {"wind_speed_modifier": 0.15, "region": "North"},
        "expected_outcomes_json": {"gas_turbine_ramp": True},
        "tags": "historical, wind_drop, renewable_variability",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Negative Pricing Curtailment (Renewable Curtailment)",
        "description": "Excess solar generation leading to negative spot prices, requiring 400MW curtailment of wind and solar.",
        "category": "Renewable",
        "scenario_type": "Drop",
        "severity": "Low",
        "trigger_conditions_json": {"curtailment_target_mw": 400},
        "expected_outcomes_json": {"renewable_spill": True},
        "tags": "historical, curtailment, pricing",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Coal Unit Ramping (Carbon Spike)",
        "description": "Forced operation of inefficient coal units due to gas shortage, causing a 50% increase in grid carbon intensity.",
        "category": "Grid",
        "scenario_type": "Spike",
        "severity": "High",
        "trigger_conditions_json": {"coal_units_online": ["COAL_UNIT_1", "COAL_UNIT_2"]},
        "expected_outcomes_json": {"carbon_limit_exceeded": True},
        "tags": "historical, carbon_spike, emissions",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - West-East Corridor (Grid Congestion)",
        "description": "High power flow exceeding thermal capacity of the West-East tie-lines, causing thermal limits violation.",
        "category": "Grid",
        "scenario_type": "Spike",
        "severity": "High",
        "trigger_conditions_json": {"congestion_corridor": "WEST_EAST", "flow_mw": 1200},
        "expected_outcomes_json": {"redispatch_active": True},
        "tags": "historical, congestion, redispatch",
        "is_system_default": True
    },
    {
        "name": "Historical Incident - Polar Vortex Freeze (Extreme Weather)",
        "description": "Sub-zero temperatures causing fuel supply freezes, pipeline failure, and simultaneous trips of 3 gas plants.",
        "category": "Weather",
        "scenario_type": "Failure",
        "severity": "Critical",
        "trigger_conditions_json": {"temperature_deg_c": -15, "failed_units": ["GAS_PLANT_A", "GAS_PLANT_B", "GAS_PLANT_C"]},
        "expected_outcomes_json": {"grid_blackout_risk": True, "demand_response_active": True},
        "tags": "historical, weather, polar_vortex",
        "is_system_default": True
    }
]

def seed_scenarios(db: Session):
    existing = db.query(ScenarioTemplate).filter(ScenarioTemplate.is_system_default == True).first()
    if existing:
        logger.info("System scenarios already seeded. Skipping.")
        return
        
    for data in PREDEFINED_SCENARIOS:
        scenario = ScenarioTemplate(**data)
        db.add(scenario)
        
    db.commit()
    logger.info(f"Seeded {len(PREDEFINED_SCENARIOS)} predefined scenarios.")
