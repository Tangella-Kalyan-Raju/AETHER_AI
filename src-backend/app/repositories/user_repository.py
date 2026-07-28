from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models.auth_models import User, Role, Organization

class UserRepository(BaseRepository[User]):
    """Repository handling database operations for the User model."""
    def __init__(self, db: Session):
        super().__init__(db, User)

    def get_by_email(self, email: str) -> Optional[User]:
        """Fetch a user record by email (active users only)."""
        return self.find_one({"email": email})

    def assign_role(self, user_id: int, role_id: int) -> bool:
        """Assign an authorization security role to a user by ID."""
        user = self.get(user_id)
        if not user:
            return False
        
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return False
            
        if role not in user.roles_list:
            user.roles_list.append(role)
            # Update legacy role string field
            user.role = role.name
            self.db.commit()
        return True

    def assign_role_by_name(self, user_id: int, role_name: str) -> bool:
        """Assign an authorization security role to a user by role name."""
        user = self.get(user_id)
        if not user:
            return False
        
        role = self.db.query(Role).filter(Role.name == role_name).first()
        if not role:
            return False
            
        if role not in user.roles_list:
            user.roles_list.append(role)
            user.role = role.name
            self.db.commit()
        return True

    def update_organization(self, user_id: int, org_id: int) -> bool:
        """Link a user to a specific organization."""
        user = self.get(user_id)
        if not user:
            return False
            
        org = self.db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            return False
            
        user.organization_id = org.id
        user.organization = org.name
        self.db.commit()
        return True
