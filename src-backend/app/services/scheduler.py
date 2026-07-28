import asyncio
import logging
from typing import List
from app.integrations.base_connector import BaseIntegrationConnector
from app.integrations.providers.weather_connector import WeatherProvider
from app.integrations.providers.solar_connector import SolarProvider
from app.integrations.providers.demand_connector import DemandProvider
from app.database.connection import SessionLocal
from app.services.forecasting.forecast_manager import ForecastManager
from app.services.forecasting.validation_engine import ForecastValidationEngine
from app.services.optimization.manager import OptimizationManager

logger = logging.getLogger("gpo.services.scheduler")

class IntegrationScheduler:
    """
    Manages the lifecycle of multiple provider connectors and forecasting jobs.
    """
    def __init__(self):
        self.providers: List[BaseIntegrationConnector] = []
        self._running = False

    def register_provider(self, provider: BaseIntegrationConnector):
        self.providers.append(provider)
        logger.info(f"Registered provider: {provider.__class__.__name__}")

    async def start_all(self):
        self._running = True
        logger.info("Starting Integration Scheduler & Forecast Jobs...")
        for provider in self.providers:
            await provider.start()
        
        # Start forecasting task
        asyncio.create_task(self._forecast_loop())

    async def _forecast_loop(self):
        while self._running:
            try:
                db = SessionLocal()
                # 1. Validate past forecasts
                validator = ForecastValidationEngine(db)
                validator.evaluate_past_forecasts()
                
                # 2. Generate new forecasts
                manager = ForecastManager(db)
                manager.generate_all_forecasts()
                
                # 3. Generate optimal operational strategies
                opt_manager = OptimizationManager(db)
                opt_manager.generate_recommendations()
                
                db.close()
            except Exception as e:
                logger.error(f"Error in forecast loop: {e}")
            
            # Run every 15 minutes in production, but 20 seconds for demo
            await asyncio.sleep(20)

    async def stop_all(self):
        self._running = False
        logger.info("Stopping Integration Scheduler...")
        for provider in self.providers:
            await provider.stop()

# Global instance
integration_scheduler = IntegrationScheduler()

# Register mock providers for Phase 5.1
integration_scheduler.register_provider(WeatherProvider(config_id="weather-mock", settings={"polling_interval": 15}))
integration_scheduler.register_provider(SolarProvider(config_id="solar-mock", settings={"polling_interval": 20}))
integration_scheduler.register_provider(DemandProvider(config_id="demand-mock", settings={"polling_interval": 10}))
