import asyncio
import random
from datetime import datetime, timezone
from app.integrations.base_connector import BaseIntegrationConnector
from app.integrations.normalization import NormalizationEngine
from app.core.streaming import event_bus

class SmartMeterConnector(BaseIntegrationConnector):
    """
    Simulates a connection to an AMI (Advanced Metering Infrastructure) head-end system.
    Polls in bulk for energy consumption.
    """

    async def connect(self):
        await asyncio.sleep(1)
        self.is_connected = True

    async def disconnect(self):
        self.is_connected = False

    async def receive_data(self):
        # Meters typically poll every 15 mins, we simulate a faster rate
        await asyncio.sleep(self.settings.get('polling_interval', 15))
        
        assets = ["meter-res-1", "meter-com-1"]
        
        for asset in assets:
            if not self._running:
                break
                
            metrics = [
                {
                    "asset_id": asset,
                    "asset_type": "smart_meter",
                    "measurement_type": "active_power",
                    "value": round(random.normalvariate(5, 1), 2),
                    "unit": "kW",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "quality": "GOOD",
                    "source": "AMI",
                    "confidence": 99.0
                },
                {
                    "asset_id": asset,
                    "asset_type": "smart_meter",
                    "measurement_type": "energy_consumption",
                    "value": round(random.uniform(100, 200), 2),
                    "unit": "kWh",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "quality": "GOOD",
                    "source": "AMI",
                    "confidence": 99.0
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
