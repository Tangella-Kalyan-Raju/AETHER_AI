import asyncio
import random
from datetime import datetime, timezone
from app.integrations.base_connector import BaseIntegrationConnector
from app.integrations.normalization import NormalizationEngine
from app.core.streaming import event_bus

class IoTConnector(BaseIntegrationConnector):
    """
    Simulates a connection to an MQTT broker aggregating field IoT sensors.
    """

    async def connect(self):
        await asyncio.sleep(0.5)
        self.is_connected = True

    async def disconnect(self):
        self.is_connected = False

    async def receive_data(self):
        await asyncio.sleep(self.settings.get('polling_interval', 10))
        
        assets = ["iot-temp-1", "iot-transformer-oil-1"]
        
        for asset in assets:
            if not self._running:
                break
                
            metrics = [
                {
                    "asset_id": asset,
                    "asset_type": "sensor",
                    "measurement_type": "temperature",
                    "value": round(random.normalvariate(65, 5), 1),
                    "unit": "C",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "quality": "GOOD",
                    "source": "IoT",
                    "confidence": 95.0
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
