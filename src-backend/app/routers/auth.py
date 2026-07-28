from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.repositories.user_repository import UserRepository
from app.repositories.system_repository import RoleRepository, OrganizationRepository
from app.schemas.auth_schemas import UserRegister, UserLogin, Token, UserResponse, ProfileResponse
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.response import send_success, send_error
from app.config.settings import settings
import logging

logger = logging.getLogger("gpo.api.auth")
router = APIRouter()

@router.post("/register", response_model=dict)
@router.post("/signup", response_model=dict)
def register(req: UserRegister, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    role_repo = RoleRepository(db)
    org_repo = OrganizationRepository(db)
    
    # 1. Check if user already exists
    if user_repo.get_by_email(req.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered."
        )
    
    # 2. Get or create Organization
    org = org_repo.get_by_name(req.organization)
    if not org:
        org = org_repo.create({"name": req.organization, "description": f"Auto-created organization {req.organization}"})
        
    # 3. Hash password and prepare user record
    hashed_pwd = get_password_hash(req.password)
    user_data = {
        "email": req.email,
        "password_hash": hashed_pwd,
        "full_name": req.full_name,
        "organization": req.organization,
        "role": req.role or "Viewer",
        "organization_id": org.id,
        "status": "active"
    }
    
    try:
        new_user = user_repo.create(user_data)
        
        # Assign role object link
        role = role_repo.get_by_name(req.role or "Viewer")
        if role:
            new_user.roles_list.append(role)
            db.commit()
            db.refresh(new_user)
            
        logger.info(f"User registered successfully: {new_user.email}")
        
        # Serialize user for response
        user_res = UserResponse.model_validate(new_user)
        return send_success(user_res.model_dump())
    except Exception as e:
        logger.error(f"Failed to register user: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=dict)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(req.email)
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
        
    # Create token payload
    token_data = {"sub": user.email, "id": user.id, "role": user.role}
    access_token = create_access_token(data=token_data)
    
    logger.info(f"User logged in: {user.email}")
    
    # Structure return response
    user_res = UserResponse.model_validate(user)
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_res.model_dump()
    }
    return response_data  # Wrapped automatically or returned directly

@router.get("/me", response_model=dict)
def get_current_user_profile(current_user = Depends(get_current_user)):
    user_res = UserResponse.model_validate(current_user)
    return user_res.model_dump()

@router.post("/logout", response_model=dict)
def logout():
    return send_success({"status": "logged_out"})

@router.post("/refresh", response_model=dict)
def refresh_token(current_user = Depends(get_current_user)):
    token_data = {"sub": current_user.email, "id": current_user.id, "role": current_user.role}
    access_token = create_access_token(data=token_data)
    return send_success({
        "access_token": access_token,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    })
