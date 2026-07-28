import asyncio
import random
from datetime import datetime, timezone
from app.integrations.base_connector import BaseIntegrationConnector
from app.integrations.normalization import NormalizationEngine
from app.core.streaming import event_bus

class RenewableConnector(BaseIntegrationConnector):
    """
    Simulates integration with a Solar or Wind farm plant controller (PPC).
    """

    async def connect(self):
        await asyncio.sleep(1)
        self.is_connected = True

    async def disconnect(self):
        self.is_connected = False

    async def receive_data(self):
        await asyncio.sleep(self.settings.get('polling_interval', 10))
        
        assets = ["solar-farm-1", "wind-farm-1"]
        
        for asset in assets:
            if not self._running:
                break
                
            metrics = [
                {
                    "asset_id": asset,
                    "asset_type": "generator",
                    "measurement_type": "active_power",
                    "value": round(random.uniform(50, 100), 2),
                    "unit": "MW",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "quality": "GOOD",
                    "source": "RenewablePPC",
                    "confidence": 98.0
                }
            ]
                
            for m in metrics:
                norm = NormalizationEngine.normalize_measurement(m["value"], m["unit"])
                m["value"] = norm["value"]
                m["unit"] = norm["unit"]
                m["timestamp"] = NormalizationEngine.normalize_timestamp(m["timestamp"])
                
                await event_bus.publish(f"measurement.{m['asset_type']}.{m['asset_id']}", m)
                await event_bus.publish("global_telemetry", m)
                self.metrics["messages_received"] += 1
                
        self.metrics["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
