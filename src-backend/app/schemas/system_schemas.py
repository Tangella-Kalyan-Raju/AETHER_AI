from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PermissionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    permissions_list: List[PermissionResponse] = []

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    title: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    content: Optional[str] = None
    organization_id: int

class ReportResponse(BaseModel):
    id: int
    title: str
    type: str
    content: Optional[str]
    organization_id: int
    created_by: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SystemSettingCreate(BaseModel):
    key: str = Field(..., min_length=1)
    value: Optional[str] = None
    description: Optional[str] = None

class SystemSettingResponse(BaseModel):
    key: str
    value: Optional[str]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
