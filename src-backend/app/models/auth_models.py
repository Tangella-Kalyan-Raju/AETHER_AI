from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, BaseModelMixin

# Association Table for User <-> Role (Many-to-Many)
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow, nullable=False),
    Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
)

# Association Table for Role <-> Permission (Many-to-Many)
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow, nullable=False),
    Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
)

class Organization(Base, BaseModelMixin):
    __tablename__ = "organizations"

    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(String(512), nullable=True)

    # Relationships
    users = relationship("User", back_populates="org_relation", cascade="all, delete-orphan")
    assets = relationship("GridAsset", back_populates="org_relation", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="org_relation", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="org_relation", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="org_relation", cascade="all, delete-orphan")

class User(Base, BaseModelMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    
    # Backward Compatibility columns (for root main.py endpoints)
    organization = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="Viewer")
    
    # 3NF normalized Foreign Key relations
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    org_relation = relationship("Organization", back_populates="users")
    roles_list = relationship("Role", secondary=user_roles, back_populates="users_list")
    
    created_assets = relationship("GridAsset", back_populates="creator", cascade="all, delete-orphan")
    created_policies = relationship("Policy", back_populates="creator", cascade="all, delete-orphan")
    created_policy_versions = relationship("PolicyVersion", back_populates="creator", cascade="all, delete-orphan")
    created_reports = relationship("Report", back_populates="creator", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user_relation", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user_relation", cascade="all, delete-orphan")

class Role(Base, BaseModelMixin):
    __tablename__ = "roles"

    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)

    # Relationships
    users_list = relationship("User", secondary=user_roles, back_populates="roles_list")
    permissions_list = relationship("Permission", secondary=role_permissions, back_populates="roles_list")

class Permission(Base, BaseModelMixin):
    __tablename__ = "permissions"

    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)

    # Relationships
    roles_list = relationship("Role", secondary=role_permissions, back_populates="permissions_list")
