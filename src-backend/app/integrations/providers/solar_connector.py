import asyncio
import random
from typing import Any, Dict
from datetime import datetime, timezone
from app.integrations.base_connector import BaseIntegrationConnector
from app.core.normalization import NormalizationEngine
from app.core.validation import ValidationEngine
from app.core.streaming import event_bus

class SolarProvider(BaseIntegrationConnector):
    """
    Implements the Phase 5.1 Solar Irradiance Provider interface (e.g., NASA POWER, PVGIS).
    """

    async def connect(self):
        await asyncio.sleep(0.1)
        self.is_connected = True

    async def disconnect(self):
        self.is_connected = False
        
    async def authenticate(self) -> bool:
        return True

    async def fetch_data(self) -> Any:
        return {
            "ghi": round(random.uniform(0, 1000), 1), # Global Horizontal Irradiance W/m2
            "dni": round(random.uniform(0, 800), 1),  # Direct Normal Irradiance
            "dhi": round(random.uniform(0, 300), 1),  # Diffuse Horizontal Irradiance
            "solar_elevation": round(random.uniform(0, 90), 1),
            "solar_azimuth": round(random.uniform(0, 360), 1),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def normalize(self, raw_data: Any) -> Dict[str, Any]:
        return NormalizationEngine.normalize_payload(raw_data, "solar")

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
            
            # Reusing weather schema for basic validation (timestamp check)
            is_valid, quality, issues = ValidationEngine.validate_payload(normalized, "solar")
            
            if is_valid:
                normalized["quality_score"] = quality
                await event_bus.publish("integration.solar", normalized)
                self.metrics["messages_received"] += 1
            else:
                self.metrics["errors"] += 1
                
        except Exception as e:
            self.metrics["errors"] += 1
            
        self.metrics["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
