import asyncio
import random
from typing import Any, Dict
from datetime import datetime, timezone
from app.integrations.base_connector import BaseIntegrationConnector
from app.core.normalization import NormalizationEngine
from app.core.validation import ValidationEngine
from app.core.streaming import event_bus

class WeatherProvider(BaseIntegrationConnector):
    """
    Implements the Phase 5.1 Weather Provider interface.
    """

    async def connect(self):
        await asyncio.sleep(0.1)
        self.is_connected = True

    async def disconnect(self):
        self.is_connected = False
        
    async def authenticate(self) -> bool:
        # Mock auth
        return True

    async def fetch_data(self) -> Any:
        # Mock fetching from an external provider API
        return {
            "temperature": round(random.uniform(10, 40), 1),
            "temp_unit": "C",
            "humidity": round(random.uniform(30, 90), 1),
            "wind_speed": round(random.uniform(0, 25), 1),
            "wind_unit": "km/h",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def normalize(self, raw_data: Any) -> Dict[str, Any]:
        return NormalizationEngine.normalize_payload(raw_data, "weather")

    async def receive_data(self):
        await asyncio.sleep(self.settings.get('polling_interval', 15))
        
        if not self._running:
            return
            
        try:
            auth_ok = await self.authenticate()
            if not auth_ok:
                raise Exception("Authentication failed")

            raw_payload = await self.fetch_data()
            normalized = await self.normalize(raw_payload)
            
            is_valid, quality, issues = ValidationEngine.validate_payload(normalized, "weather")
            
            if is_valid:
                normalized["quality_score"] = quality
                await event_bus.publish("integration.weather", normalized)
                self.metrics["messages_received"] += 1
            else:
                self.metrics["errors"] += 1
                
        except Exception as e:
            self.metrics["errors"] += 1
            
        self.metrics["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
