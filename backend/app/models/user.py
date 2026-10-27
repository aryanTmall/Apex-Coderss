from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    salt = Column(String(64), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="CITIZEN", nullable=False, index=True) # ADMIN, DEPARTMENT_OPERATOR, FIELD_OFFICER, REVIEWER, CITIZEN
    department_id = Column(String(50), ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    department = relationship("Department")
