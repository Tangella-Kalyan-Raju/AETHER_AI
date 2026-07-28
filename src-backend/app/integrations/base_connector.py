import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any

logger = logging.getLogger(__name__)

class BaseIntegrationConnector(ABC):
    """
    Abstract base class for all external data connectors (SCADA, PMU, IoT, etc).
    Enforces a strict enterprise contract for lifecycle management.
    """

    def __init__(self, config_id: str, settings: Dict[str, Any]):
        self.config_id = config_id
        self.settings = settings
        self.is_connected = False
        self._running = False
        self._task = None
        self.metrics = {
            "messages_received": 0,
            "errors": 0,
            "last_heartbeat": None
        }

    async def start(self):
        """Starts the connector loop."""
        if self._running:
            return
        self._running = True
        logger.info(f"[{self.__class__.__name__}] Starting connector (Config: {self.config_id})")
        
        try:
            await self.connect()
            self._task = asyncio.create_task(self._run_loop())
        except Exception as e:
            logger.error(f"[{self.__class__.__name__}] Failed to start: {e}")
            self._running = False
            self.metrics["errors"] += 1
            raise

    async def stop(self):
        """Stops the connector loop and disconnects."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        await self.disconnect()
        logger.info(f"[{self.__class__.__name__}] Stopped connector.")

    async def _run_loop(self):
        while self._running:
            try:
                if not self.is_connected:
                    logger.warning(f"[{self.__class__.__name__}] Connection lost, attempting reconnect...")
                    await self.reconnect()
                
                await self.receive_data()
            except Exception as e:
                self.metrics["errors"] += 1
                logger.error(f"[{self.__class__.__name__}] Error in run loop: {e}")
                await asyncio.sleep(5)  # Backoff before retry

    @abstractmethod
    async def connect(self):
        """Establish connection to the external system."""
        pass

    @abstractmethod
    async def disconnect(self):
        """Close connection to the external system."""
        pass
    
    async def reconnect(self):
        """Reconnect logic with backoff."""
        await self.disconnect()
        await asyncio.sleep(2)
        await self.connect()

    @abstractmethod
    async def authenticate(self) -> bool:
        """Authenticate with the external provider."""
        pass

    @abstractmethod
    async def fetch_data(self) -> Any:
        """Fetch raw payload from provider."""
        pass

    @abstractmethod
    async def normalize(self, raw_data: Any) -> Dict[str, Any]:
        """Normalize raw payload into standard GPO schema."""
        pass

    @abstractmethod
    async def receive_data(self):
        """Poll or wait for data, then process and publish."""
        pass

    def get_health(self) -> Dict[str, Any]:
        """Return health metrics for this connector."""
        return {
            "status": "CONNECTED" if self.is_connected else "DISCONNECTED",
            "metrics": self.metrics
        }
