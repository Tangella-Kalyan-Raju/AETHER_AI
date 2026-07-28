from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, BaseModelMixin

class Notification(Base, BaseModelMixin):
    __tablename__ = "notifications"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False, index=True)

    # Relationships
    recipient = relationship("User", back_populates="notifications")

class Report(Base, BaseModelMixin):
    __tablename__ = "reports"

    title = Column(String(255), index=True, nullable=False)
    type = Column(String(100), index=True, nullable=False)  # e.g., Operations, Compliance
    content = Column(Text, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="created_reports")
    org_relation = relationship("Organization", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Nullable for anonymous/guest actions
    action = Column(String(100), index=True, nullable=False)                              # e.g., user.login, policy.deploy
    details = Column(Text, nullable=True)                                                 # Parameters passed / description
    ip_address = Column(String(45), nullable=True)                                        # IP address (IPv4 / IPv6)
    status = Column(String(50), nullable=False, default="success")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user_relation = relationship("User", back_populates="audit_logs")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="success")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user_relation = relationship("User", back_populates="activity_logs")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(255), primary_key=True, index=True, unique=True)
    value = Column(Text, nullable=True)
    description = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
