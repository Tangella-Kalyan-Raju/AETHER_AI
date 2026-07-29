import sys
from app.database.connection import SessionLocal
from app.models.auth_models import User, Role

db = SessionLocal()
email = "rajusrinivas1971@gmail.com"
user = db.query(User).filter(User.email == email).first()
if not user:
    print(f"User {email} not found.")
    sys.exit(1)

super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
if not super_admin_role:
    print("Super Admin role not found.")
    sys.exit(1)

# Assign role and update string
if super_admin_role not in user.roles_list:
    user.roles_list.append(super_admin_role)
    
user.role = "Super Admin"
db.commit()
print(f"User {email} promoted to Super Admin successfully.")
