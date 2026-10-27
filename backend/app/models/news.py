from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean
from app.database import Base, UTCDateTime

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    summary = Column(String(2000), nullable=False)
    source_name = Column(String(150), nullable=False)
    source_url = Column(String(500), nullable=False)
    published_at = Column(UTCDateTime, nullable=False, index=True)
    retrieved_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    geographic_scope = Column(String(30), default="CITY", nullable=False, index=True) # LOCAL, CITY, STATE, NATIONAL, GLOBAL
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    country = Column(String(100), default="India", nullable=False)
    category = Column(String(50), default="INFRASTRUCTURE", nullable=False) # INFRASTRUCTURE, PUBLIC_SAFETY, UTILITIES, DISASTER, POLICY
    is_live = Column(Boolean, default=True, nullable=False)
    cached_until = Column(UTCDateTime, nullable=True)
