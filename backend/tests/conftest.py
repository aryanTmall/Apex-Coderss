import pytest
import os
import sys

# Ensure backend root is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.services.routing import router_service
from app.services.sim_clock import sim_clock
from app.services.auth_service import seed_initial_users
from app.services.emergency_service import seed_initial_emergency_resources, seed_initial_emergency_stations
from app.services.news_service import seed_initial_news_articles
from app.services.funds_service import seed_initial_funds
from app.services.contractor_service import seed_contractors
from app.services.participation_service import seed_proposals
from app.services.rewards_service import seed_rewards
from app.services.whistleblower_service import seed_whistleblower_cases

TEST_DATABASE_URL = "sqlite:///./test_civichelp.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
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
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_civichelp.db"):
        try:
            os.remove("./test_civichelp.db")
        except Exception:
            pass

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Ensure departments, users, emergency, news seeded
    router_service.seed_departments(session)
    seed_initial_users(session)
    seed_initial_emergency_resources(session)
    seed_initial_emergency_stations(session)
    seed_initial_news_articles(session)
    seed_initial_funds(session)
    seed_contractors(session)
    seed_proposals(session)
    seed_rewards(session)
    seed_whistleblower_cases(session)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
    sim_clock.reset()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
