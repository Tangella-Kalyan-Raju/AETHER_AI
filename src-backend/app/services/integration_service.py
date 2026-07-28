import logging
from typing import Dict, List, Type
from sqlalchemy.orm import Session
from app.models.integration_models import IntegrationConfig
from app.integrations.base_connector import BaseIntegrationConnector
from app.integrations.providers.scada_connector import SCADAConnector
from app.integrations.providers.pmu_connector import PMUConnector
from app.integrations.providers.smart_meter_connector import SmartMeterConnector
from app.integrations.providers.iot_connector import IoTConnector
from app.integrations.providers.renewable_connector import RenewableConnector
from app.integrations.providers.weather_connector import WeatherProvider

logger = logging.getLogger(__name__)

class IntegrationManager:
    """
    Service layer orchestrating the lifecycle of all external data connectors.
    Acts as a centralized registry and control plane.
    """
    
    # Registry mapping string names to Connector classes
    _CONNECTOR_REGISTRY: Dict[str, Type[BaseIntegrationConnector]] = {
        "SCADA": SCADAConnector,
        "PMU": PMUConnector,
        "SMART_METER": SmartMeterConnector,
        "IOT": IoTConnector,
        "RENEWABLE": RenewableConnector,
        "WEATHER": WeatherProvider,
    }

    def __init__(self):
        # In-memory store of active connector instances
        self.active_connectors: Dict[str, BaseIntegrationConnector] = {}

    async def bootstrap(self, db: Session):
        """Loads all enabled configurations from the database and starts them."""
        configs = db.query(IntegrationConfig).filter(IntegrationConfig.is_enabled == True).all()
        logger.info(f"Bootstrapping {len(configs)} enabled integration connectors.")
        
        for config in configs:
            await self.start_connector(config.name, config.provider_type, config.settings)

    async def start_connector(self, name: str, provider_type: str, settings: dict) -> bool:
        """Starts a specific connector by name."""
        if name in self.active_connectors:
            logger.warning(f"Connector {name} is already running.")
            return False
            
        provider_class = self._CONNECTOR_REGISTRY.get(provider_type.upper())
        if not provider_class:
            logger.error(f"Unknown provider type: {provider_type}")
            return False
            
        connector = provider_class(config_id=name, settings=settings)
        self.active_connectors[name] = connector
        
        try:
            await connector.start()
            return True
        except Exception as e:
            logger.error(f"Failed to start connector {name}: {e}")
            del self.active_connectors[name]
            return False

    async def stop_connector(self, name: str) -> bool:
        """Stops a running connector."""
        connector = self.active_connectors.get(name)
        if not connector:
            return False
            
        await connector.stop()
        del self.active_connectors[name]
        return True

    def get_all_health(self) -> List[dict]:
        """Returns the health status of all active connectors."""
        health_reports = []
        for name, connector in self.active_connectors.items():
            report = connector.get_health()
            report["name"] = name
            report["provider_type"] = connector.__class__.__name__
            health_reports.append(report)
        return health_reports

# Singleton instance to be used across the application
integration_manager = IntegrationManager()
