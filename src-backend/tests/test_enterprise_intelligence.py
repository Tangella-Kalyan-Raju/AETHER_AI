import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.asset_models import Asset, AssetHealth
from app.ai.services.context_engine import ContextEngine

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_context_engine_aggregation(db_session):
    # Setup some test assets
    a1 = Asset(id=1, name="Sierra XFMR 1", type="Transformer")
    a2 = Asset(id=2, name="Sierra Solar", type="Solar Farm")
    db_session.add_all([a1, a2])
    db_session.commit()

    # Add health scores
    h1 = AssetHealth(asset_id=1, health_score=90.0, condition="Nominal", efficiency=98.0, remaining_useful_life=15.0)
    h2 = AssetHealth(asset_id=2, health_score=80.0, condition="Nominal", efficiency=95.0, remaining_useful_life=12.0)
    db_session.add_all([h1, h2])
    db_session.commit()

    context = ContextEngine.gather_enterprise_context(db_session)
    assert context["assets"]["total_count"] == 2
    assert context["assets"]["average_health"] == 85.0
