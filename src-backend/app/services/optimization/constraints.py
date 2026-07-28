from typing import Dict, List, Tuple, Any

class ConstraintEngine:
    """
    Evaluates system and assets operational constraints before running
    iterative mathematical optimization solvers.
    """

    def validate(self, state: Dict[str, Any], enabled_constraints: List[str]) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Validates state parameters against NERC grid safety bounds.
        Returns:
            (is_valid, violation_logs)
        """
        violations = []
        is_valid = True

        # 1. Frequency Hard Boundary check
        if "Frequency" in enabled_constraints:
            freq = state.get("frequency", 60.0)
            if freq < 59.90:
                is_valid = False
                violations.append({
                    "constraint": "Frequency Under-deviation (Hard)",
                    "type": "HARD",
                    "value": freq,
                    "limit": ">= 59.90 Hz",
                    "msg": "NERC BAL-001 frequency limit exceeded."
                })
            elif freq > 60.10:
                is_valid = False
                violations.append({
                    "constraint": "Frequency Over-deviation (Hard)",
                    "type": "HARD",
                    "value": freq,
                    "limit": "<= 60.10 Hz",
                    "msg": "NERC frequency envelope ceiling exceeded."
                })

        # 2. Voltage Hard Boundary check
        if "Voltage" in enabled_constraints:
            voltage = state.get("voltage", 1.0)
            if voltage < 0.95:
                is_valid = False
                violations.append({
                    "constraint": "Voltage Under-deviation (Hard)",
                    "type": "HARD",
                    "value": voltage,
                    "limit": ">= 0.95 p.u.",
                    "msg": "IEEE 1547 voltage envelope lower bound crossed."
                })
            elif voltage > 1.05:
                is_valid = False
                violations.append({
                    "constraint": "Voltage Over-deviation (Hard)",
                    "type": "HARD",
                    "value": voltage,
                    "limit": "<= 1.05 p.u.",
                    "msg": "IEEE 1547 voltage envelope ceiling bound crossed."
                })

        # 3. Transmission Thermal Limits check
        if "ThermalLimits" in enabled_constraints:
            line_load = state.get("line_load_mw", 1000)
            capacity = state.get("line_capacity_mw", 1800)
            if line_load > capacity:
                is_valid = False
                violations.append({
                    "constraint": "Transmission Line Overload (Hard)",
                    "type": "HARD",
                    "value": line_load,
                    "limit": f"<= {capacity} MW",
                    "msg": "Transmission path thermal overloading detected."
                })

        # 4. Carbon Intensity Target check (Soft Constraint)
        if "CarbonCeiling" in enabled_constraints:
            carbon = state.get("carbon_intensity", 180)
            cap = state.get("carbon_cap", 250)
            if carbon > cap:
                # Soft violation does not invalidate execution, just logs warning penalty
                violations.append({
                    "constraint": "Carbon Intensity Cap (Soft)",
                    "type": "SOFT",
                    "value": carbon,
                    "limit": f"<= {cap} gCO2/kWh",
                    "msg": "Regional carbon intensity ceiling breached."
                })

        # 5. Battery State of Charge (Soft Constraint)
        if "BatterySOC" in enabled_constraints:
            soc = state.get("battery_soc", 50.0)
            if soc < 20.0:
                violations.append({
                    "constraint": "Battery Depth of Discharge (Soft)",
                    "type": "SOFT",
                    "value": soc,
                    "limit": ">= 20.0%",
                    "msg": "Battery system operating below nominal cycle health reserve."
                })

        return is_valid, violations
