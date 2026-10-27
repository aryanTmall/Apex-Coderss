import hashlib
import os
import hmac
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns (hashed_password_hex, salt_hex).
    """
    if not salt:
        salt_bytes = os.urandom(16)
        salt = salt_bytes.hex()
    else:
        salt_bytes = bytes.fromhex(salt)
        
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt_bytes,
        100000
    )
    return hashed.hex(), salt

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """Verifies a plain password against the stored hash and salt."""
    computed_hash, _ = hash_password(plain_password, salt)
    return hmac.compare_digest(computed_hash, hashed_password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a secure JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None

def seed_initial_users(db: Session) -> None:
    """Ensures standard government accounts exist for operations and review."""
    default_accounts = [
        {
            "id": "USR-ADMIN-01",
            "email": settings.ADMIN_INITIAL_EMAIL,
            "password": settings.ADMIN_INITIAL_PASSWORD,
            "full_name": "Chief Administrative Officer",
            "role": "ADMIN",
            "department_id": None
        },
        {
            "id": "USR-REV-01",
            "email": "reviewer@civichelp.gov.in",
            "password": "CivicHelp@Review2026!",
            "full_name": "Senior Verification Officer",
            "role": "REVIEWER",
            "department_id": None
        },
        {
            "id": "USR-PWD-01",
            "email": "pwd.operator@civichelp.gov.in",
            "password": "CivicHelp@Pwd2026!",
            "full_name": "Roads & PWD Dispatcher",
            "role": "DEPARTMENT_OPERATOR",
            "department_id": "DEP-ROADS"
        },
        {
            "id": "USR-FIELD-01",
            "email": "field.crew@civichelp.gov.in",
            "password": "CivicHelp@Field2026!",
            "full_name": "Field Supervisor North Zone",
            "role": "FIELD_OFFICER",
            "department_id": "DEP-ROADS"
        },
        {
            "id": "USR-FIN-01",
            "email": "finance@civichelp.gov.in",
            "password": "CivicHelp@Finance2026!",
            "full_name": "Chief Municipal Finance Officer",
            "role": "FINANCE_OFFICER",
            "department_id": None
        },
        {
            "id": "USR-AUD-01",
            "email": "auditor@civichelp.gov.in",
            "password": "CivicHelp@Auditor2026!",
            "full_name": "Confidential Whistleblower Ombudsman",
            "role": "WHISTLEBLOWER_AUDITOR",
            "department_id": None
        }
    ]

    for acc in default_accounts:
        existing = db.query(User).filter(User.email == acc["email"]).first()
        if not existing:
            hashed, salt = hash_password(acc["password"])
            user = User(
                id=acc["id"],
                email=acc["email"],
                hashed_password=hashed,
                salt=salt,
                full_name=acc["full_name"],
                role=acc["role"],
                department_id=acc["department_id"],
                is_active=True
            )
            db.add(user)
    db.commit()
