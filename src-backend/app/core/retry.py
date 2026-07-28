import asyncio
import logging
from functools import wraps
from typing import Callable, Any

logger = logging.getLogger("gpo.system")

def with_retry(max_retries: int = 3, initial_backoff: float = 1.0, factor: float = 2.0):
    """
    Decorator for robust asynchronous retries with exponential backoff.
    Suitable for database deadlocks or transient network failures.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            retries = 0
            backoff = initial_backoff
            
            while retries < max_retries:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        logger.error(f"Function {func.__name__} failed after {max_retries} retries. Error: {e}")
                        raise
                    
                    logger.warning(f"Transient error in {func.__name__} (Attempt {retries}/{max_retries}): {e}. Retrying in {backoff}s...")
                    await asyncio.sleep(backoff)
                    backoff *= factor
        return wrapper
    return decorator
