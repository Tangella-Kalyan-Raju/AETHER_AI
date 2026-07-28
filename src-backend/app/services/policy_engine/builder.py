import logging
import json
from sqlalchemy.orm import Session
from app.models.grid_models import Policy, PolicyVersion
from app.repositories.grid_repository import PolicyRepository, PolicyVersionRepository
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger("gpo.policy_builder")

class PolicyBuilderService:
    def __init__(self, db: Session):
        self.db = db
        self.policy_repo = PolicyRepository(db)
        self.version_repo = PolicyVersionRepository(db)

    def clone_policy(self, policy_id: int, user_id: int) -> Policy:
        """Clones an existing policy configuration as a new draft policy."""
        source = self.policy_repo.get(policy_id)
        if not source:
            raise ValueError("Source policy not found.")
            
        cloned = Policy(
            name=f"Copy of {source.name}",
            description=source.description,
            organization_id=source.organization_id,
            created_by=user_id,
            status="draft",
            is_active=False,
            priority=source.priority,
            objective=source.objective,
            weights=source.weights,
            constraints=source.constraints,
            ai_explanation=source.ai_explanation,
            expected_outcome=source.expected_outcome,
            affected_systems=source.affected_systems
        )
        self.db.add(cloned)
        self.db.flush()
        
        # Seed version 1
        code_content = json.dumps({
            "weights": cloned.weights,
            "constraints": cloned.constraints,
            "changelog": "Initial cloned draft version."
        })
        v1 = PolicyVersion(
            policy_id=cloned.id,
            version="v1.0.0",
            code_content=code_content,
            created_by=user_id,
            status="active"
        )
        self.db.add(v1)
        self.db.commit()
        logger.info(f"Policy '{source.name}' successfully cloned as '{cloned.name}' by user {user_id}")
        return cloned

    def create_new_version(self, policy_id: int, changelog: str, user_id: int) -> PolicyVersion:
        """Creates a new policy version tracking changes."""
        policy = self.policy_repo.get(policy_id)
        if not policy:
            raise ValueError("Policy not found.")
            
        latest = self.db.query(PolicyVersion).filter(PolicyVersion.policy_id == policy_id).all()
        next_ver = len(latest) + 1
        
        code_content = json.dumps({
            "weights": policy.weights,
            "constraints": policy.constraints,
            "changelog": changelog
        })
        new_v = PolicyVersion(
            policy_id=policy_id,
            version=f"v{next_ver}.0.0",
            code_content=code_content,
            created_by=user_id,
            status="active"
        )
        self.db.add(new_v)
        self.db.commit()
        logger.info(f"New Policy Version v{next_ver}.0.0 registered for policy ID {policy_id}")
        return new_v

    def rollback_to_version(self, policy_id: int, version_id: int, user_id: int) -> Policy:
        """Rolls back the active weights/constraints of a policy to a previous version."""
        policy = self.policy_repo.get(policy_id)
        if not policy:
            raise ValueError("Policy not found.")
            
        ver = self.db.query(PolicyVersion).filter(PolicyVersion.id == version_id, PolicyVersion.policy_id == policy_id).first()
        if not ver:
            raise ValueError("Specified policy version not found.")
            
        try:
            parsed = json.loads(ver.code_content)
        except Exception:
            raise ValueError("Invalid version content format.")

        policy.weights = parsed.get("weights", {})
        policy.constraints = parsed.get("constraints", {})
        policy.updated_at = datetime.utcnow()
        
        latest = self.db.query(PolicyVersion).filter(PolicyVersion.policy_id == policy_id).all()
        next_ver = len(latest) + 1
        
        code_content = json.dumps({
            "weights": policy.weights,
            "constraints": policy.constraints,
            "changelog": f"Rolled back config parameters to version {ver.version}."
        })
        rollback_v = PolicyVersion(
            policy_id=policy_id,
            version=f"v{next_ver}.0.0",
            code_content=code_content,
            created_by=user_id,
            status="active"
        )
        self.db.add(rollback_v)
        self.db.commit()
        logger.info(f"Policy ID {policy_id} rolled back to version {ver.version} by user {user_id}")
        return policy

    def export_policy(self, policy_id: int) -> Dict[str, Any]:
        """Prepares a policy configuration dict for JSON/YAML export."""
        p = self.policy_repo.get(policy_id)
        if not p:
            raise ValueError("Policy not found.")
        return {
            "name": p.name,
            "description": p.description,
            "priority": p.priority,
            "objective": p.objective,
            "weights": p.weights,
            "constraints": p.constraints,
            "expected_outcome": p.expected_outcome,
            "ai_explanation": p.ai_explanation,
            "affected_systems": p.affected_systems
        }

    def import_policy(self, data: Dict[str, Any], org_id: int, user_id: int) -> Policy:
        """Validates and imports a policy configuration payload as a draft policy."""
        name = data.get("name")
        if not name:
            raise ValueError("Import failed: Name field is required.")
            
        # Check duplicate
        if self.policy_repo.get_by_name(name):
            name = f"{name} (Imported)"

        p = Policy(
            name=name,
            description=data.get("description", "Imported operational policy configuration."),
            organization_id=org_id,
            created_by=user_id,
            status="draft",
            is_active=False,
            priority=data.get("priority", 1),
            objective=data.get("objective", "BALANCED"),
            weights=data.get("weights", {}),
            constraints=data.get("constraints", {}),
            expected_outcome=data.get("expected_outcome", "Nominal outcomes."),
            ai_explanation=data.get("ai_explanation", "AI explainability context."),
            affected_systems=data.get("affected_systems", [])
        )
        self.db.add(p)
        self.db.flush()
        
        # Save version 1
        code_content = json.dumps({
            "weights": p.weights,
            "constraints": p.constraints,
            "changelog": "Imported initial policy configurations."
        })
        v1 = PolicyVersion(
            policy_id=p.id,
            version="v1.0.0",
            code_content=code_content,
            created_by=user_id,
            status="active"
        )
        self.db.add(v1)
        self.db.commit()
        logger.info(f"Custom Policy '{name}' successfully imported as draft (ID: {p.id})")
        return p
