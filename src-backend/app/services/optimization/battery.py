from typing import Dict, Any, List

class BatteryOptimizationEngine:
    """
    Optimizes charging and discharging cycles for utility-scale and regional batteries
    to manage reserve energy, shave load peaks, and utilize low-price charge windows.
    """

    def optimize(self, grid_state: Dict[str, Any], forecast_state: Dict[str, Any]) -> Dict[str, Any]:
        batteries = [
            {"id": "Battery_East_A", "name": "East Regional Battery", "capacity_mwh": 100.0, "max_power_mw": 25.0, "current_soc_pct": 42.0},
            {"id": "Battery_West_B", "name": "West Utility Battery", "capacity_mwh": 250.0, "max_power_mw": 50.0, "current_soc_pct": 74.0}
        ]

        schedules = {}
        for b in batteries:
            # Generate a mock 24h operational schedule
            # Charge during low-demand/high solar hours (10:00 - 15:00)
            # Discharge during peak demand hours (17:00 - 21:00)
            hourly_actions = []
            soc_profile = []
            current_soc = b["current_soc_pct"]

            for hour in range(24):
                action = 0.0 # IDLE
                # Charge window
                if 9 <= hour <= 14:
                    action = -b["max_power_mw"] # Charge is negative (injecting load)
                    current_soc = min(100.0, current_soc + (b["max_power_mw"] / b["capacity_mwh"]) * 100)
                # Discharge window
                elif 17 <= hour <= 21:
                    action = b["max_power_mw"] # Discharge is positive
                    current_soc = max(10.0, current_soc - (b["max_power_mw"] / b["capacity_mwh"]) * 100)
                else:
                    # Idle self-discharge
                    current_soc = max(10.0, current_soc - 0.05)

                hourly_actions.append(round(action, 2))
                soc_profile.append(round(current_soc, 1))

            schedules[b["id"]] = {
                "id": b["id"],
                "name": b["name"],
                "hourly_schedule_mw": hourly_actions,
                "hourly_soc_pct": soc_profile,
                "starting_soc_pct": b["current_soc_pct"],
                "ending_soc_pct": soc_profile[-1],
                "throughput_mwh": round(sum(abs(x) for x in hourly_actions) / 2, 2) # Total charged/discharged
            }

        return {
            "battery_schedules": list(schedules.values()),
            "metrics": {
                "total_storage_capacity_mwh": sum(b["capacity_mwh"] for b in batteries),
                "peak_discharge_delivered_mw": sum(b["max_power_mw"] for b in batteries),
                "storage_system_efficiency_pct": 89.5,
                "reserve_headroom_mwh": round(sum(b["capacity_mwh"] * (100 - b["current_soc_pct"]) / 100 for b in batteries), 1)
            }
        }
