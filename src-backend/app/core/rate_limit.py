import time
from collections import defaultdict
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.response import send_error, generate_request_id

# Simple in-memory rate limiting dictionary
# Key: IP address, Value: (tokens, last_refilled)
RATE_LIMIT_STORE = defaultdict(lambda: [100, time.time()])

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_tokens: int = 100, refill_rate: int = 10):
        super().__init__(app)
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate  # tokens per second
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        
        # Specific rate limiting for auth and import endpoints to prevent abuse
        path = request.url.path
        if path.startswith("/api/v1/auth") or path.startswith("/api/v1/engineering/import"):
            bucket = RATE_LIMIT_STORE[client_ip]
            tokens, last_refilled = bucket
            
            # Refill tokens
            elapsed = now - last_refilled
            tokens += elapsed * self.refill_rate
            if tokens > self.max_tokens:
                tokens = self.max_tokens
                
            if tokens < 1:
                req_id = getattr(request.state, "request_id", generate_request_id())
                return JSONResponse(
                    status_code=429,
                    content=send_error("Too Many Requests. Rate limit exceeded.", request_id=req_id)
                )
            
            # Consume 1 token
            bucket[0] = tokens - 1
            bucket[1] = now
            
        return await call_next(request)
