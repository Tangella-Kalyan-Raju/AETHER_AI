from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=1)
    organization: str = Field(..., min_length=1)
    role: Optional[str] = "Viewer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    organization: Optional[str]
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: str = ""
    role: str
    organization: str
    created_at: str
    updated_at: str
