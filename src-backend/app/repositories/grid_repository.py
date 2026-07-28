from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models.grid_models import GridAsset, Policy, PolicyVersion, PolicyExecution, Incident

class GridAssetRepository(BaseRepository[GridAsset]):
    """Repository handling database operations for the GridAsset model."""
    def __init__(self, db: Session):
        super().__init__(db, GridAsset)

    def get_by_org(self, organization_id: int) -> List[GridAsset]:
        """Fetch all grid assets linked to an organization."""
        return self.find_by({"organization_id": organization_id})

class PolicyRepository(BaseRepository[Policy]):
    """Repository handling database operations for the Policy model."""
    def __init__(self, db: Session):
        super().__init__(db, Policy)

    def get_by_name(self, name: str) -> Optional[Policy]:
        """Fetch policy by name."""
        return self.find_one({"name": name})

class PolicyVersionRepository(BaseRepository[PolicyVersion]):
    """Repository handling database operations for the PolicyVersion model."""
    def __init__(self, db: Session):
        super().__init__(db, PolicyVersion)

    def get_versions(self, policy_id: int) -> List[PolicyVersion]:
        """Fetch all versions of a specific policy."""
        return self.find_by({"policy_id": policy_id})

class PolicyExecutionRepository(BaseRepository[PolicyExecution]):
    """Repository handling database operations for the PolicyExecution model."""
    def __init__(self, db: Session):
        super().__init__(db, PolicyExecution)

    def get_by_version(self, policy_version_id: int) -> List[PolicyExecution]:
        """Fetch execution records for a specific policy version."""
        return self.find_by({"policy_version_id": policy_version_id})

class IncidentRepository(BaseRepository[Incident]):
    """Repository handling database operations for the Incident model."""
    def __init__(self, db: Session):
        super().__init__(db, Incident)

    def get_by_severity(self, severity: str) -> List[Incident]:
        """Fetch incidents filtered by severity."""
        return self.find_by({"severity": severity})
