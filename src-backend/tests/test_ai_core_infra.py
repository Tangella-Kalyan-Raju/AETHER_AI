import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.ai_models import AIConversation, AIMessage, AILog
from app.ai.services.ai_service import AIService
from app.ai.prompts.manager import PromptManager

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

def test_prompt_manager_default(db_session):
    prompt = PromptManager.get_template(db_session, "Enterprise System Prompt")
    assert "Enterprise AI Grid Copilot" in prompt

def test_ai_service_flow(db_session):
    # Setup conversation
    conv = AIConversation(title="Sierra Outages Thread", user_id=1)
    db_session.add(conv)
    db_session.commit()

    service = AIService(db_session)
    res = service.process_chat(
        conversation_id=conv.id,
        query="Check battery dispatch load warnings",
        user_id=1
    )

    assert res["conversation_id"] == conv.id
    assert "success" in res
    assert "Situation" in res["response"]

    # Verify messages saved
    msgs = db_session.query(AIMessage).filter(AIMessage.conversation_id == conv.id).all()
    assert len(msgs) == 2
    assert msgs[0].role == "user"
    assert msgs[1].role == "assistant"
