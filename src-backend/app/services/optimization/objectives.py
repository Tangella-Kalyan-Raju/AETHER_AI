from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseObjective(ABC):
    """
    Abstract interface for all GPO optimization objective functions.
    """

    def __init__(self, weight: float = 1.0):
        self.weight = weight

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def evaluate(self, state: Dict[str, Any]) -> float:
        """
        Evaluates the current state and returns a normalized penalty/cost score.
        Minimization is the standard objective across all modules.
        """
        pass

    def validate(self) -> bool:
        """Verifies if weights are mathematically valid."""
        return self.weight >= 0.0


class CostObjective(BaseObjective):
    """Evaluates the financial cost of dispatching conventional thermal generation."""
    
    @property
    def name(self) -> str:
        return "CostMinimization"

    def evaluate(self, state: Dict[str, Any]) -> float:
        # Base fuel rate * generated power (MW)
        load = state.get("load_mw", 1000.0)
        fuel_price = state.get("fuel_price_usd_mwh", 50.0)
        return load * fuel_price * self.weight


class CarbonObjective(BaseObjective):
    """Evaluates the environmental penalty of thermal emissions."""

    @property
    def name(self) -> str:
        return "CarbonReduction"

    def evaluate(self, state: Dict[str, Any]) -> float:
        intensity = state.get("carbon_intensity", 180.0)
        emission_tax_multiplier = 0.8
        return intensity * emission_tax_multiplier * self.weight


class StabilityObjective(BaseObjective):
    """Evaluates voltage and frequency deviations from target nominal points."""

    @property
    def name(self) -> str:
        return "GridStability"

    def evaluate(self, state: Dict[str, Any]) -> float:
        freq_dev = abs(state.get("frequency", 60.0) - 60.0)
        volt_dev = abs(state.get("voltage", 1.0) - 1.0)
        # Sum of squared deviations weighted
        return ( (freq_dev * 100) ** 2 + (volt_dev * 100) ** 2 ) * self.weight


class ObjectiveRegistry:
    """Registry to load and scale objectives dynamically based on configurations."""

    def __init__(self):
        self._registry = {
            "CostMinimization": CostObjective,
            "CarbonReduction": CarbonObjective,
            "GridStability": StabilityObjective
        }

    def get_objective(self, name: str, weight: float) -> BaseObjective:
        cls = self._registry.get(name)
        if not cls:
            raise ValueError(f"Objective '{name}' is not registered in GPO registry.")
        return cls(weight)
