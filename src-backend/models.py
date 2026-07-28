from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

# Grid Policy Orchestrator (GPO) User Database Model
# Path: src-backend/models.py

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Viewer")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
