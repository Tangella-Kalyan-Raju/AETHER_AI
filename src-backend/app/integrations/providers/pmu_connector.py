import asyncio
import random
from datetime import datetime, timezone
from app.integrations.base_connector import BaseIntegrationConnector
from app.integrations.normalization import NormalizationEngine
from app.core.streaming import event_bus

class PMUConnector(BaseIntegrationConnector):
    """
    Simulates a high-frequency Phasor Measurement Unit (IEEE C37.118).
    Normally PMUs stream at 30-120 fps. We will simulate a faster polling interval.
    """

    async def connect(self):
        await asyncio.sleep(0.5)
        self.is_connected = True

    async def disconnect(self):
        self.is_connected = False

    async def receive_data(self):
        # PMUs stream fast, we'll simulate 1 second intervals for demo purposes
        await asyncio.sleep(1)
        
        assets = ["pmu-101", "pmu-102"]
        
        for asset in assets:
            if not self._running:
                break
                
            metrics = [
                {
                    "asset_id": asset,
                    "asset_type": "pmu",
                    "measurement_type": "voltage_phasor_mag",
                    "value": round(random.normalvariate(500, 5), 2),
                    "unit": "kV",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "quality": "GOOD",
                    "source": "PMU",
                    "confidence": 100.0
                },
                {
                    "asset_id": asset,
                    "asset_type": "pmu",
                    "measurement_type": "voltage_phasor_ang",
                    "value": round(random.uniform(-180, 180), 2),
                    "unit": "deg",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "quality": "GOOD",
                    "source": "PMU",
                    "confidence": 100.0
                }
            ]
                
            for m in metrics:
                # Normalization
                norm = NormalizationEngine.normalize_measurement(m["value"], m["unit"])
                m["value"] = norm["value"]
                m["unit"] = norm["unit"]
                m["timestamp"] = NormalizationEngine.normalize_timestamp(m["timestamp"])
                
                await event_bus.publish(f"measurement.{m['asset_type']}.{m['asset_id']}", m)
                await event_bus.publish("global_telemetry", m)
                self.metrics["messages_received"] += 1
                
        self.metrics["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
