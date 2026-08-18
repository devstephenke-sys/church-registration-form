from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.models import AdminUser
from backend.app.schemas import AdminLogin, Token, AdminUserResponse
from backend.app.security import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin-auth"])

@router.post("/login", response_model=Token)
def login_admin(credentials: AdminLogin, db: Session = Depends(get_db)):
    """Logs in an administrator and returns a JWT access token."""
    user = db.query(AdminUser).filter(AdminUser.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate access token containing subject and role
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.get("/me", response_model=AdminUserResponse)
def get_admin_me(current_user: AdminUser = Depends(get_current_user)):
    """Retrieves current admin profile details."""
    return current_user
