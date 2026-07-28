import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Dict
from fastapi import Request
from fastapi.responses import JSONResponse

def generate_request_id() -> str:
    return str(uuid.uuid4())

def get_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def send_success(data: Any, message: str = "Request successful", request_id: Optional[str] = None, meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Wraps positive response data into the standard enterprise JSON envelope."""
    response = {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": get_iso_timestamp(),
        "request_id": request_id or generate_request_id(),
        "errors": None
    }
    if meta:
        response["meta"] = meta
    return response

def send_error(message: str, errors: Optional[Any] = None, request_id: Optional[str] = None) -> Dict[str, Any]:
    """Wraps error conditions into the standard enterprise JSON error envelope."""
    return {
        "success": False,
        "message": message,
        "data": None,
        "timestamp": get_iso_timestamp(),
        "request_id": request_id or generate_request_id(),
        "errors": errors
    }

class GPOJSONResponse(JSONResponse):
    """Custom JSONResponse that automatically ensures the output matches GPO envelopes."""
    def render(self, content: Any) -> bytes:
        if isinstance(content, dict) and ("success" in content) and ("request_id" in content):
            # Already formatted
            return super().render(content)
        # Wrap raw data
        formatted = send_success(content)
        return super().render(formatted)
