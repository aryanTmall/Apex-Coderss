from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Validates the Authorization Bearer token and returns the authenticated User."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Returns the authenticated User if token is present and valid, otherwise None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    return db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()

def require_government_user(current_user: User = Depends(get_current_user)) -> User:
    """Enforces that the authenticated user possesses an official government operational role."""
    gov_roles = {"ADMIN", "REVIEWER", "DEPARTMENT_OPERATOR", "FIELD_OFFICER", "FINANCE_OFFICER", "WHISTLEBLOWER_AUDITOR"}
    if current_user.role not in gov_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Authorized Government personnel only."
        )
    return current_user

require_gov_user = require_government_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforces administrator-level privileges."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Administrator privileges required."
        )
    return current_user

def require_finance_officer(current_user: User = Depends(get_current_user)) -> User:
    """Enforces finance officer or administrator role for fiscal updates."""
    if current_user.role not in {"ADMIN", "FINANCE_OFFICER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Municipal Finance Officer authorization required."
        )
    return current_user

def require_whistleblower_auditor(current_user: User = Depends(get_current_user)) -> User:
    """Strictly restricts access to confidential whistleblower cases."""
    if current_user.role not in {"ADMIN", "WHISTLEBLOWER_AUDITOR"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Confidential Anti-Corruption Auditor authorization required."
        )
    return current_user

__all__ = [
    "get_db",
    "get_current_user",
    "get_current_user_optional",
    "require_government_user",
    "require_admin",
    "require_finance_officer",
    "require_whistleblower_auditor"
]
