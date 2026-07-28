from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class BaseModelMixin:
    """
    Common mixin class containing shared columns for standard tables,
    supporting timestamps, status tags, and soft delete functionality.
    """
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    status = Column(String(50), nullable=False, default="active")
    version = Column(Integer, nullable=False, default=1)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def soft_delete(self):
        """Helper to tag the row as soft-deleted."""
        self.is_deleted = True
        self.status = "deleted"
