from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.news_service import get_news_articles
from app.models.news import NewsArticle
from app.config import settings

router = APIRouter(prefix="/news", tags=["Public Civic Intelligence & News Feed"])


class NewsArticleResponse(BaseModel):
    id: str
    title: str
    summary: str
    source_name: str
    source_url: str
    published_at: datetime
    retrieved_at: datetime
    geographic_scope: str # LOCAL, CITY, STATE, NATIONAL, GLOBAL
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    category: str
    is_live: bool
    cached_until: Optional[datetime] = None
    ai_summary: Optional[str] = None
    civic_relevance: Optional[str] = None
    related_incident_count: int = 0
    related_category: Optional[str] = None
    is_demo_data: bool = False

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[NewsArticleResponse])
@router.get("/articles", response_model=List[NewsArticleResponse])
def list_civic_news(
    scope: Optional[str] = Query(None, description="Geographic scope: LOCAL/AROUND_ME, CITY, STATE, NATIONAL, GLOBAL"),
    category: Optional[str] = Query(None, description="Topic category: INFRASTRUCTURE, UTILITIES, DISASTER, POLICY"),
    search: Optional[str] = Query(None, description="Search term for news"),
    city: Optional[str] = Query(None, description="City filter"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves public civic intelligence articles across geographic scopes:
    - Around Me / Locality
    - City
    - State / Region
    - National
    - Global Smart City Developments
    """
    return get_news_articles(db, scope=scope, category=category, search=search, city=city, limit=limit)


@router.get("/{article_id}", response_model=NewsArticleResponse)
def get_article_detail(article_id: str, db: Session = Depends(get_db)):
    art = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="News article not found.")
    return art
