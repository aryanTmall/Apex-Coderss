import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal, ensure_schema_compatibility, init_db
from app.api.reports import router as reports_router
from app.api.incidents import router as incidents_router
from app.api.departments import router as departments_router
from app.api.events import router as events_router
from app.api.metrics import router as metrics_router
from app.api.track import router as track_router
from app.api.intelligence import router as intelligence_router
from app.api.attachments import router as attachments_router
from app.api.location import router as location_router
from app.api.chat import router as chat_router
from app.api.auth import router as auth_router
from app.api.emergency import router as emergency_router
from app.api.news import router as news_router
from app.api.simulation import router as simulation_router, sim_alias_router
from app.api.funds import router as funds_router
from app.api.contractors import router as contractors_router
from app.api.participation import router as participation_router
from app.api.rewards import router as rewards_router
from app.api.voice import router as voice_router
from app.api.messaging import router as messaging_router
from app.api.whistleblower import router as whistleblower_router
from app.services.routing import router_service
from app.services.sim_clock import sim_clock

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("civichelp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CivicHelp Database and Entities...")
    init_db()
    logger.info("CivicHelp Core Entities, Users, Emergency Directories & Municipal Nodes verified.")
    yield
    logger.info("CivicHelp service shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.4.0",
    description="Autonomous Civic Incident Intelligence & Accountability Platform — From Citizen Reports to Verified Resolution",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "2.4.0",
        "simulated_utc_now": sim_clock.now().isoformat(),
        "clock_offset_minutes": sim_clock.offset_minutes
    }

# Mount API Routers
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(departments_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(metrics_router, prefix=settings.API_V1_STR)
app.include_router(track_router, prefix=settings.API_V1_STR)
app.include_router(intelligence_router, prefix=settings.API_V1_STR)
app.include_router(attachments_router, prefix=settings.API_V1_STR)
app.include_router(location_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(emergency_router, prefix=settings.API_V1_STR)
app.include_router(news_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(sim_alias_router, prefix=settings.API_V1_STR)
app.include_router(funds_router, prefix=settings.API_V1_STR)
app.include_router(contractors_router, prefix=settings.API_V1_STR)
app.include_router(participation_router, prefix=settings.API_V1_STR)
app.include_router(rewards_router, prefix=settings.API_V1_STR)
app.include_router(voice_router, prefix=settings.API_V1_STR)
app.include_router(messaging_router, prefix=settings.API_V1_STR)
app.include_router(whistleblower_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
