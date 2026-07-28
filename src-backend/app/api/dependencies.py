from typing import Optional, Dict, Any
from fastapi import Query
from pydantic import BaseModel

class QueryParams(BaseModel):
    page: int = 1
    page_size: int = 20
    search: Optional[str] = None
    sort: Optional[str] = None
    order: str = "asc"
    filters: Dict[str, Any] = {}

def get_query_params(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query string"),
    sort: Optional[str] = Query(None, description="Field to sort by"),
    order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
    # Additional filters can be passed via kwargs in specific routers,
    # but this forms the base standard for all list endpoints.
) -> QueryParams:
    return QueryParams(
        page=page,
        page_size=page_size,
        search=search,
        sort=sort,
        order=order
    )
