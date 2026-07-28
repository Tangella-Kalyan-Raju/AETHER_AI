from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models.auth_models import Organization, Role, Permission
from app.models.system_models import Notification, Report, AuditLog, ActivityLog, SystemSetting

class OrganizationRepository(BaseRepository[Organization]):
    """Repository handling database operations for the Organization model."""
    def __init__(self, db: Session):
        super().__init__(db, Organization)

    def get_by_name(self, name: str) -> Optional[Organization]:
        return self.find_one({"name": name})

class RoleRepository(BaseRepository[Role]):
    """Repository handling database operations for the Role model."""
    def __init__(self, db: Session):
        super().__init__(db, Role)

    def get_by_name(self, name: str) -> Optional[Role]:
        return self.find_one({"name": name})

class PermissionRepository(BaseRepository[Permission]):
    """Repository handling database operations for the Permission model."""
    def __init__(self, db: Session):
        super().__init__(db, Permission)

    def get_by_name(self, name: str) -> Optional[Permission]:
        return self.find_one({"name": name})

class NotificationRepository(BaseRepository[Notification]):
    """Repository handling database operations for the Notification model."""
    def __init__(self, db: Session):
        super().__init__(db, Notification)

    def get_unread_by_user(self, user_id: int) -> List[Notification]:
        return self.find_by({"user_id": user_id, "is_read": False})

class ReportRepository(BaseRepository[Report]):
    """Repository handling database operations for the Report model."""
    def __init__(self, db: Session):
        super().__init__(db, Report)

    def get_by_org(self, organization_id: int) -> List[Report]:
        return self.find_by({"organization_id": organization_id})

class AuditLogRepository(BaseRepository[AuditLog]):
    """Repository handling database operations for the AuditLog model."""
    def __init__(self, db: Session):
        super().__init__(db, AuditLog)

    def get_by_user(self, user_id: int) -> List[AuditLog]:
        return self.find_by({"user_id": user_id})

class ActivityLogRepository(BaseRepository[ActivityLog]):
    """Repository handling database operations for the ActivityLog model."""
    def __init__(self, db: Session):
        super().__init__(db, ActivityLog)

    def get_by_user(self, user_id: int) -> List[ActivityLog]:
        return self.find_by({"user_id": user_id})

class SystemSettingRepository(BaseRepository[SystemSetting]):
    """Repository handling database operations for the SystemSetting model."""
    def __init__(self, db: Session):
        super().__init__(db, SystemSetting)

    def get_value(self, key: str, default: Optional[str] = None) -> Optional[str]:
        setting = self.get(key)
        return setting.value if setting else default

    def set_value(self, key: str, value: str, description: Optional[str] = None) -> SystemSetting:
        setting = self.get(key)
        if setting:
            setting.value = value
            if description:
                setting.description = description
            self.db.commit()
            self.db.refresh(setting)
        else:
            setting = SystemSetting(key=key, value=value, description=description)
            self.db.add(setting)
            self.db.commit()
            self.db.refresh(setting)
        return setting
