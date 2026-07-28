import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List

logger = logging.getLogger("gpo.streaming")

class EventPublisher(ABC):
    @abstractmethod
    async def publish(self, topic: str, message: dict) -> None:
        pass

class EventSubscriber(ABC):
    @abstractmethod
    def subscribe(self, topic: str, callback: Callable[[dict], Any]) -> None:
        pass

class InMemoryEventBus(EventPublisher, EventSubscriber):
    """
    A foundational in-memory event bus using asyncio.Queue.
    Allows easy migration to Kafka or Redis Streams in the future.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[dict], Any]]] = {}
        self._queue = asyncio.Queue()
        self._worker_task = None

    def subscribe(self, topic: str, callback: Callable[[dict], Any]) -> None:
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(callback)
        logger.info(f"Subscribed to topic: {topic}")

    async def publish(self, topic: str, message: dict) -> None:
        await self._queue.put((topic, message))

    async def _worker(self):
        """Background worker that dispatches events from the queue."""
        logger.info("InMemoryEventBus worker started.")
        while True:
            try:
                topic, message = await self._queue.get()
                callbacks = self._subscribers.get(topic, [])
                for callback in callbacks:
                    try:
                        # Synchronous or asynchronous callbacks
                        if asyncio.iscoroutinefunction(callback):
                            await callback(message)
                        else:
                            callback(message)
                    except Exception as e:
                        logger.error(f"Error in subscriber callback for topic {topic}: {e}")
                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Event bus worker error: {e}")

    def start(self):
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker())

    def stop(self):
        if self._worker_task is not None:
            self._worker_task.cancel()
            self._worker_task = None

# Global singleton instance for the API
event_bus = InMemoryEventBus()
