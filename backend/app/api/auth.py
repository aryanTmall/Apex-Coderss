from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.auth_service import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication & Government Access"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department_id: str | None = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates government officials, operators, and reviewers."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(email)).first()
    
    if not user or not user.is_active or not verify_password(payload.password, user.hashed_password, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid municipal credentials or account inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            department_id=user.department_id
        )
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated profile of the current government user."""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        department_id=current_user.department_id
    )

@router.post("/logout")
def logout():
    """Stateless JWT logout confirmation."""
    return {"status": "logged_out", "message": "Session invalidated successfully."}
