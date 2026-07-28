from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, JSON, Boolean
from sqlalchemy.orm import relationship, backref
from app.models.base import Base, BaseModelMixin

class GridAsset(Base, BaseModelMixin):
    __tablename__ = "grid_assets"

    name = Column(String(255), index=True, nullable=False)
    type = Column(String(100), index=True, nullable=False)  # e.g., Substation, Feeder, Battery
    details = Column(JSON, nullable=True)                  # Technical parameters (capacity, voltage limit, etc.)
    
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    org_relation = relationship("Organization", back_populates="assets")
    creator = relationship("User", back_populates="created_assets")

class Policy(Base, BaseModelMixin):
    __tablename__ = "policies"

    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    priority = Column(Integer, default=1, nullable=False)
    objective = Column(String(100), nullable=True)
    weights = Column(JSON, nullable=True)
    constraints = Column(JSON, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    expected_outcome = Column(String(512), nullable=True)
    affected_systems = Column(JSON, nullable=True)
    category = Column(String(100), nullable=True)
    
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    org_relation = relationship("Organization", back_populates="policies")
    creator = relationship("User", back_populates="created_policies")
    versions = relationship("PolicyVersion", back_populates="policy", cascade="all, delete-orphan")

class PolicyVersion(Base, BaseModelMixin):
    __tablename__ = "policy_versions"

    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(50), index=True, nullable=False)  # e.g., v1.0.0
    code_content = Column(Text, nullable=False)               # Executable compilation policy content
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    policy = relationship("Policy", back_populates="versions")
    creator = relationship("User", back_populates="created_policy_versions")
    executions = relationship("PolicyExecution", back_populates="policy_version", cascade="all, delete-orphan")

class PolicyExecution(Base, BaseModelMixin):
    __tablename__ = "policy_executions"

    policy_version_id = Column(Integer, ForeignKey("policy_versions.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), index=True, nullable=False)  # e.g., success, failed, blocked
    details = Column(JSON, nullable=True)                    # Audit log trail of compiler run
    execution_time = Column(Float, nullable=False, default=0.0)

    # Relationships
    policy_version = relationship("PolicyVersion", back_populates="executions")

class Incident(Base, BaseModelMixin):
    __tablename__ = "incidents"

    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), index=True, nullable=False)  # e.g., high, medium, low
    
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    org_relation = relationship("Organization", back_populates="incidents")

class PolicyIntelligence(Base, BaseModelMixin):
    __tablename__ = "policy_intelligence"

    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False, unique=True)
    advantages = Column(JSON, nullable=True)
    disadvantages = Column(JSON, nullable=True)
    emission_impact = Column(String(100), nullable=True)
    expected_cost = Column(Float, nullable=True)
    expected_renewable_pct = Column(Float, nullable=True)
    reliability_score = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)

    # Relationships
    policy = relationship("Policy", backref=backref("intelligence", uselist=False, cascade="all, delete-orphan"))

class PolicyDeployment(Base, BaseModelMixin):
    __tablename__ = "policy_deployments"

    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    policy_name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False) # e.g. "Deploy", "Rollback"
    user_email = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False) # e.g. "success", "failed"
    comments = Column(Text, nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)

    # Relationships
    policy = relationship("Policy", backref=backref("deployments", cascade="all, delete-orphan"))


