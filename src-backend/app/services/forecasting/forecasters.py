import logging
import math
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

class WeatherForecaster:
    """Predicts future weather conditions using physics heuristics and diurnal cycles."""
    @staticmethod
    def generate(current_temp: float, horizon_minutes: int, base_time: datetime) -> dict:
        target_time = base_time + timedelta(minutes=horizon_minutes)
        hour = target_time.hour + (target_time.minute / 60.0)
        
        # Diurnal temperature cycle: peak around 15:00, trough around 04:00
        # Cosine wave offset
        time_offset = (hour - 4) / 24.0 * 2 * math.pi
        cycle_var = -math.cos(time_offset) * 4.0 # +/- 4 degrees fluctuation from mean
        
        predicted = current_temp + cycle_var
        confidence = max(10, 95 - (horizon_minutes / 60) * 2) # Confidence drops 2% every hour
        
        return {
            "predicted_value": predicted,
            "lower_bound": predicted - (100-confidence)/10,
            "upper_bound": predicted + (100-confidence)/10,
            "confidence_score": confidence
        }

class RenewableForecaster:
    """Predicts Solar and Wind generation."""
    @staticmethod
    def generate_solar(current_ghi: float, plant_capacity: float, horizon_minutes: int, base_time: datetime) -> dict:
        target_time = base_time + timedelta(minutes=horizon_minutes)
        hour = target_time.hour
        
        # Solar is zero at night
        if hour < 6 or hour > 19:
            return {
                "predicted_value": 0.0,
                "lower_bound": 0.0,
                "upper_bound": 0.0,
                "confidence_score": 99.0
            }
            
        # Parabolic solar curve peaking at 12:30
        peak_offset = abs(12.5 - (hour + target_time.minute/60.0))
        efficiency = max(0, 1.0 - (peak_offset / 6.5) ** 2)
        
        predicted = plant_capacity * efficiency * 0.8 # max 80% capacity factor
        confidence = max(10, 90 - (horizon_minutes / 60) * 3)
        
        return {
            "predicted_value": predicted,
            "lower_bound": predicted * 0.85,
            "upper_bound": predicted * 1.15,
            "confidence_score": confidence
        }
        
    @staticmethod
    def generate_wind(current_wind_speed: float, plant_capacity: float, horizon_minutes: int) -> dict:
        # Wind is highly volatile, confidence drops fast
        predicted = plant_capacity * min(1.0, current_wind_speed / 12.0) * 0.5
        
        # Add random walk expectation
        expected_drift = (horizon_minutes / 60) * 0.05 * plant_capacity
        confidence = max(10, 85 - (horizon_minutes / 60) * 4)
        
        return {
            "predicted_value": predicted,
            "lower_bound": max(0, predicted - expected_drift),
            "upper_bound": min(plant_capacity, predicted + expected_drift),
            "confidence_score": confidence
        }

class DemandForecaster:
    """Predicts total electrical load."""
    @staticmethod
    def generate(current_demand: float, horizon_minutes: int, base_time: datetime) -> dict:
        target_time = base_time + timedelta(minutes=horizon_minutes)
        hour = target_time.hour
        
        # Duck curve profile multiplier
        curve = [
            0.6, 0.55, 0.5, 0.5, 0.55, 0.65, 0.8, 0.9, 0.95, 0.9, 0.85, 0.8,
            0.8, 0.8, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2, 1.15, 1.0, 0.8, 0.65
        ]
        
        base_multiplier = curve[hour]
        predicted = (current_demand / curve[base_time.hour]) * base_multiplier
        
        confidence = max(10, 95 - (horizon_minutes / 60) * 1.5)
        
        return {
            "predicted_value": predicted,
            "lower_bound": predicted * 0.9,
            "upper_bound": predicted * 1.1,
            "confidence_score": confidence
        }

class CarbonForecaster:
    """Predicts Grid Carbon Intensity (gCO2/kWh)"""
    @staticmethod
    def generate(predicted_demand: float, predicted_renewable: float, horizon_minutes: int) -> dict:
        fossil_required = max(0, predicted_demand - predicted_renewable)
        
        # Assume fossil emits 450g/kWh, renewable emits 20g/kWh
        total_emissions = (fossil_required * 450) + (predicted_renewable * 20)
        predicted_intensity = total_emissions / predicted_demand if predicted_demand > 0 else 0
        
        confidence = max(10, 90 - (horizon_minutes / 60) * 2)
        
        return {
            "predicted_value": predicted_intensity,
            "lower_bound": predicted_intensity * 0.9,
            "upper_bound": predicted_intensity * 1.1,
            "confidence_score": confidence
        }

class StorageForecaster:
    """Predicts future Battery State of Charge requirements based on net load."""
    @staticmethod
    def generate(predicted_net_load: float, current_soc_mwh: float, capacity_mwh: float, horizon_minutes: int) -> dict:
        # Net load = demand - renewable
        # If net_load > 0, batteries might discharge to cover it (if economic mode, etc, but we just predict decay)
        
        # Simplistic decay/charge assuming batteries absorb 10% of net load imbalance
        expected_change = (-predicted_net_load * 0.1) * (horizon_minutes / 60.0)
        predicted_soc = max(0.0, min(capacity_mwh, current_soc_mwh + expected_change))
        
        confidence = max(10, 80 - (horizon_minutes / 60) * 3)
        
        return {
            "predicted_value": predicted_soc,
            "lower_bound": predicted_soc * 0.8,
            "upper_bound": predicted_soc * 1.2,
            "confidence_score": confidence
        }
