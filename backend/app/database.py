from datetime import datetime, timezone
import logging
from sqlalchemy import create_engine, TypeDecorator, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("civichelp.database")

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UTCDateTime(TypeDecorator):
    """
    Ensures datetime objects are stored as naive UTC in SQLite,
    and retrieved as timezone-aware UTC in Python.
    """
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if isinstance(value, datetime):
                if value.tzinfo is not None:
                    return value.astimezone(timezone.utc).replace(tzinfo=None)
                return value
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            if isinstance(value, datetime):
                if value.tzinfo is None:
                    return value.replace(tzinfo=timezone.utc)
                return value.astimezone(timezone.utc)
        return value

def ensure_schema_compatibility():
    """
    Safely adds any new columns to existing SQLite tables if not present,
    preventing any need for destructive database drops.
    """
    if "sqlite" not in settings.DATABASE_URL:
        return

    columns_to_ensure = {
        "departments": [
            ("trust_score", "INTEGER DEFAULT 100 NOT NULL"),
            ("spoofing_flags_count", "INTEGER DEFAULT 0 NOT NULL"),
        ],
        "audit_events": [
            ("previous_hash", "VARCHAR(64)"),
            ("event_hash", "VARCHAR(64)"),
        ],
        "incidents": [
            ("location_mode", "VARCHAR(20) DEFAULT 'PRECISE' NOT NULL"),
            ("location_status", "VARCHAR(30) DEFAULT 'USER_SELECTED' NOT NULL"),
            ("custom_category", "VARCHAR(100)"),
            ("address", "VARCHAR(500)"),
            ("approximate_locality", "VARCHAR(200)"),
            ("photo_data", "TEXT"),
            ("sha256_hash", "VARCHAR(64)"),
            ("escalation_tier", "INTEGER DEFAULT 0 NOT NULL"),
            ("hotspot_id", "VARCHAR(50)"),
            ("is_demo", "INTEGER DEFAULT 0 NOT NULL"),
            ("dataset", "VARCHAR(50) DEFAULT 'LIVE' NOT NULL"),
        ],
        "citizen_reports": [
            ("location_mode", "VARCHAR(20) DEFAULT 'PRECISE' NOT NULL"),
            ("location_status", "VARCHAR(30) DEFAULT 'USER_SELECTED' NOT NULL"),
            ("custom_category", "VARCHAR(100)"),
            ("address", "VARCHAR(500)"),
            ("approximate_locality", "VARCHAR(200)"),
            ("observation_time", "VARCHAR(100)"),
            ("photo_data", "TEXT"),
            ("sha256_hash", "VARCHAR(64)"),
            ("is_demo", "INTEGER DEFAULT 0 NOT NULL"),
            ("dataset", "VARCHAR(50) DEFAULT 'LIVE' NOT NULL"),
        ]
    }

    with engine.connect() as conn:
        for table, cols in columns_to_ensure.items():
            try:
                # Check if table exists
                tbl_check = conn.execute(text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")).fetchone()
                if not tbl_check:
                    continue

                existing_cols_rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                existing_cols = {row[1] for row in existing_cols_rows}

                for col_name, col_def in cols:
                    if col_name not in existing_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
                            conn.commit()
                            logger.info(f"Added column {col_name} to {table}")
                        except Exception as e:
                            logger.warning(f"Could not add {col_name} to {table}: {e}")
            except Exception as e:
                logger.warning(f"Error checking schema for table {table}: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import app.models  # ensure all models are registered
    Base.metadata.create_all(bind=engine)
    ensure_schema_compatibility()
    db = SessionLocal()
    try:
        from app.services.routing import router_service
        from app.services.auth_service import seed_initial_users
        from app.services.emergency_service import seed_initial_emergency_resources, seed_initial_emergency_stations
        from app.services.news_service import seed_initial_news_articles
        from app.services.funds_service import seed_initial_funds
        from app.services.contractor_service import seed_contractors
        from app.services.participation_service import seed_proposals
        from app.services.rewards_service import seed_rewards
        from app.services.whistleblower_service import seed_whistleblower_cases

        router_service.seed_departments(db)
        seed_initial_users(db)
        seed_initial_emergency_resources(db)
        seed_initial_emergency_stations(db)
        seed_initial_news_articles(db)
        seed_initial_funds(db)
        seed_contractors(db)
        seed_proposals(db)
        seed_rewards(db)
        seed_whistleblower_cases(db)
    finally:
        db.close()
