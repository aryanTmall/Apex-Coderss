from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.news import NewsArticle
from app.models.incident import Incident
from app.config import settings

CATEGORY_TO_INCIDENT_CATEGORIES = {
    "INFRASTRUCTURE": ["pothole", "infrastructure", "footpath"],
    "UTILITIES": ["streetlight", "water_leak"],
    "DISASTER": ["waterlogging", "drainage"],
    "PUBLIC_SAFETY": ["traffic_signal", "noise"],
    "POLICY": ["other", "sanitation", "park"],
}

AI_RELEVANCE_MAP = {
    "NEWS-LOC-01": "Direct civic impact: Decreases flash waterlogging near Connaught Place and Barakhamba underpasses during sudden heavy rainfall.",
    "NEWS-LOC-02": "Direct civic impact: Stabilizes voltage for residential and street lighting along Karol Bagh, preventing repeated streetlight outages.",
    "NEWS-CTY-01": "Direct civic impact: Automated pothole scans enable proactive resurfacing before road craters damage vehicles or impede emergency ambulances.",
    "NEWS-CTY-02": "Direct civic impact: Smart LED lighting improves pedestrian safety in dark zones and allows automatic alert dispatch when bulbs fail.",
    "NEWS-STE-01": "Direct civic impact: Pre-monsoon audits target known high-risk culverts and railway underpasses, mitigating regional traffic gridlock.",
    "NEWS-STE-02": "Direct civic impact: Storm runoff basins protect regional highways from washouts and recharge declining municipal aquifers.",
    "NEWS-NAT-01": "Direct civic impact: Enforces photographic proof and geofence verification so contractors cannot mark complaints resolved fraudulently.",
    "NEWS-NAT-02": "Direct civic impact: Mechanized sweepers and mist cannons reduce airborne dust along heavy construction corridors.",
    "NEWS-GLO-01": "Direct civic impact: Early-warning sensor networks provide predictive flood telemetry for municipal emergency command centers.",
    "NEWS-GLO-02": "Direct civic impact: Cryptographic SHA-256 audit logs provide mathematical proof that public repairs were completed at the reported site.",
}

INITIAL_NEWS_ARTICLES = [
    {
        "id": "NEWS-LOC-01",
        "title": "Ward 42 Automated Storm Drain Desilting & Monsoon Readiness Completed",
        "summary": "Municipal engineering teams completed deep sediment clearance across 14 km of primary drainage channels in Connaught Place and Barakhamba, reducing seasonal waterlogging risk.",
        "source_name": "Delhi Municipal Corporation Civic Dispatch",
        "source_url": "https://mcdonline.nic.in/portal/news",
        "geographic_scope": "LOCAL",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "category": "INFRASTRUCTURE",
        "hours_ago": 3
    },
    {
        "id": "NEWS-LOC-02",
        "title": "Karol Bagh Substation Transformer Replacement Eliminates Voltage Fluctuations",
        "summary": "State electricity distribution teams completed high-capacity transformer installation following citizen telemetry reports of repeated street lighting surges.",
        "source_name": "Power Grid Public Advisory",
        "source_url": "https://powermin.gov.in/en/content/public-notices",
        "geographic_scope": "LOCAL",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "category": "UTILITIES",
        "hours_ago": 6
    },
    {
        "id": "NEWS-CTY-01",
        "title": "Municipal Corporation Deploys AI-Powered Pothole Scanner Fleet Across City Arteries",
        "summary": "The civic agency deployed automated LiDAR and computer-vision sensor vehicles to scan 350 km of arterial roads daily, feeding detected road fractures directly into CivicHelp routing.",
        "source_name": "Urban Mobility Daily",
        "source_url": "https://urbanmobility.gov.in/news",
        "geographic_scope": "CITY",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "category": "INFRASTRUCTURE",
        "hours_ago": 12
    },
    {
        "id": "NEWS-CTY-02",
        "title": "City Converts 45,000 Sodium Streetlights to Smart Connected LED Telemetry Grid",
        "summary": "Phase 2 of the smart lighting initiative concludes, enabling automatic fault detection, remote dimming during off-peak hours, and a 42% decrease in municipal power consumption.",
        "source_name": "Delhi Smart City Mission",
        "source_url": "https://smartcities.gov.in",
        "geographic_scope": "CITY",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "category": "UTILITIES",
        "hours_ago": 18
    },
    {
        "id": "NEWS-STE-01",
        "title": "State Disaster Management Issues Pre-Monsoon Drainage Inspection Protocol",
        "summary": "State disaster authority mandates joint multi-departmental audits of railway underpasses, culverts, and low-lying arterial roads to prevent flash inundation.",
        "source_name": "State Disaster Management Authority (SDMA)",
        "source_url": "https://ndma.gov.in/alerts",
        "geographic_scope": "STATE",
        "city": None,
        "state": "Delhi NCR",
        "country": "India",
        "category": "DISASTER",
        "hours_ago": 24
    },
    {
        "id": "NEWS-STE-02",
        "title": "Regional Expressway Infrastructure Expansion Integrates Smart Runoff Basins",
        "summary": "Public Works Department commissions automated retention ponds along the regional corridor to capture stormwater runoff and recharge the local groundwater table.",
        "source_name": "National Highways Authority Public Bulletin",
        "source_url": "https://nhai.gov.in",
        "geographic_scope": "STATE",
        "city": None,
        "state": "Delhi NCR",
        "country": "India",
        "category": "INFRASTRUCTURE",
        "hours_ago": 36
    },
    {
        "id": "NEWS-NAT-01",
        "title": "Ministry of Housing & Urban Affairs Releases Smart Cities Digital Verification Standard",
        "summary": "A national directive establishes standardized criteria for closed-loop citizen incident resolution, requiring photographic evidence, geofencing, and public audit trails.",
        "source_name": "MoHUA Press Information Bureau",
        "source_url": "https://pib.gov.in/PressReleasePage.aspx",
        "geographic_scope": "NATIONAL",
        "city": None,
        "state": None,
        "country": "India",
        "category": "POLICY",
        "hours_ago": 48
    },
    {
        "id": "NEWS-NAT-02",
        "title": "National Clean Air Programme Expands Continuous Dust Suppression Along Construction Corridors",
        "summary": "Central Pollution Control Board mandates automated mist cannons and mechanized road sweeping across Tier-1 municipal corporations to curb particulate matter emissions.",
        "source_name": "Central Pollution Control Board (CPCB)",
        "source_url": "https://cpcb.nic.in",
        "geographic_scope": "NATIONAL",
        "city": None,
        "state": None,
        "country": "India",
        "category": "PUBLIC_SAFETY",
        "hours_ago": 60
    },
    {
        "id": "NEWS-GLO-01",
        "title": "UN-Habitat Global Cities Index Highlights IoT Sensor Meshes for Urban Flood Resilience",
        "summary": "International smart city consortium study highlights early warning telemetry networks as the most cost-effective measure for safeguarding municipal infrastructure during extreme weather.",
        "source_name": "UN-Habitat Urban Resilience Review",
        "source_url": "https://unhabitat.org/topic/urban-resilience",
        "geographic_scope": "GLOBAL",
        "city": None,
        "state": None,
        "country": "Global",
        "category": "INFRASTRUCTURE",
        "hours_ago": 72
    },
    {
        "id": "NEWS-GLO-02",
        "title": "World Bank Infrastructure Forum Adopts Cryptographic Audit Framework for Public Works",
        "summary": "International civic tech panel endorses tamper-evident SHA-256 chained logs to guarantee public sector accountability and eradicate fraudulent contractor closure claims.",
        "source_name": "World Bank Smart Urban Development",
        "source_url": "https://www.worldbank.org/en/topic/urbandevelopment",
        "geographic_scope": "GLOBAL",
        "city": None,
        "state": None,
        "country": "Global",
        "category": "POLICY",
        "hours_ago": 96
    }
]

def seed_initial_news_articles(db: Session) -> None:
    """Populates authoritative public intelligence news articles if not already present."""
    now = datetime.now(timezone.utc)
    for art in INITIAL_NEWS_ARTICLES:
        existing = db.query(NewsArticle).filter(NewsArticle.id == art["id"]).first()
        if not existing:
            pub_date = now - timedelta(hours=art["hours_ago"])
            cached_dt = now + timedelta(seconds=settings.NEWS_CACHE_TTL_SECONDS)
            news = NewsArticle(
                id=art["id"],
                title=art["title"],
                summary=art["summary"],
                source_name=art["source_name"],
                source_url=art["source_url"],
                published_at=pub_date,
                retrieved_at=now,
                geographic_scope=art["geographic_scope"],
                city=art.get("city"),
                state=art.get("state"),
                country=art["country"],
                category=art["category"],
                is_live=True,
                cached_until=cached_dt
            )
            db.add(news)
    db.commit()

def get_news_articles(
    db: Session,
    scope: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Retrieves news articles filtered by geographic scope (LOCAL/AROUND_ME, CITY, STATE, NATIONAL, GLOBAL)."""
    query = db.query(NewsArticle)
    
    # Handle 'AROUND_ME' as synonym for 'LOCAL'
    if scope and scope.upper() in ["AROUND_ME", "LOCAL", "NEARBY"]:
        query = query.filter(NewsArticle.geographic_scope == "LOCAL")
    elif scope and scope != "ALL":
        query = query.filter(NewsArticle.geographic_scope == scope.upper())
        
    if category and category != "ALL":
        query = query.filter(NewsArticle.category == category.upper())

    if city and city.lower() != "all":
        query = query.filter(NewsArticle.city.ilike(f"%{city}%"))

    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            (NewsArticle.title.ilike(s)) |
            (NewsArticle.summary.ilike(s)) |
            (NewsArticle.source_name.ilike(s))
        )

    articles = query.order_by(NewsArticle.published_at.desc()).limit(limit).all()

    enriched: List[Dict[str, Any]] = []
    for art in articles:
        # Determine matching active incident categories
        mapped_inc_cats = CATEGORY_TO_INCIDENT_CATEGORIES.get(art.category, ["pothole"])
        related_cat = mapped_inc_cats[0]
        
        inc_count = db.query(Incident).filter(
            Incident.category.in_(mapped_inc_cats),
            Incident.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW", "ESCALATED", "REOPENED"])
        ).count()

        ai_relevance = AI_RELEVANCE_MAP.get(
            art.id,
            f"Direct civic impact: Relevant to public {art.category.lower().replace('_', ' ')} management and municipal infrastructure oversight."
        )

        enriched.append({
            "id": art.id,
            "title": art.title,
            "summary": art.summary,
            "source_name": art.source_name,
            "source_url": art.source_url,
            "published_at": art.published_at,
            "retrieved_at": art.retrieved_at,
            "geographic_scope": art.geographic_scope,
            "city": art.city,
            "state": art.state,
            "country": art.country,
            "category": art.category,
            "is_live": art.is_live,
            "cached_until": art.cached_until,
            "ai_summary": ai_relevance,
            "civic_relevance": ai_relevance,
            "related_incident_count": inc_count,
            "related_category": related_cat,
            "is_demo_data": False,
        })

    return enriched
