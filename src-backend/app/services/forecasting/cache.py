from typing import Any, Optional
import time

class ForecastCache:
    def __init__(self):
        self._cache = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry['expiry']:
                return entry['data']
            else:
                del self._cache[key]
        return None

    def set(self, key: str, data: Any, ttl_seconds: int = 300):
        self._cache[key] = {
            'data': data,
            'expiry': time.time() + ttl_seconds
        }

    def invalidate(self, key: str):
        if key in self._cache:
            del self._cache[key]

forecast_cache = ForecastCache()
