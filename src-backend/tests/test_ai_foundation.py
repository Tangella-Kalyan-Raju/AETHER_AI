import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.ai_models import AIConversation, AIMessage, AIPromptTemplate, AISession
from app.services.ai_service import AIService, PromptManager, MemoryManager

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

def test_prompt_assembling(db_session):
    # Verify default prompt retrieval
    system_prompt = PromptManager.get_template(db_session, "Enterprise System Prompt")
    assert "Enterprise AI Grid Copilot" in system_prompt
    
    # Assemble
    assembled = PromptManager.assemble_prompt(db_session, "Check status", "Enterprise System Prompt", "USER: hello")
    assert "Check status" in assembled
    assert "USER: hello" in assembled

def test_conversation_and_message_processing(db_session):
    # Create conversation
    conv = AIConversation(title="Test Threads")
    db_session.add(conv)
    db_session.commit()
    
    # Submit chat via service
    service = AIService(db_session)
    res = service.process_chat(
        conversation_id=conv.id,
        user_query="Status check block B",
        user_id=1,
        template_name="Enterprise System Prompt"
    )
    
    assert res["conversation_id"] == conv.id
    assert "response" in res
    assert "Situation" in res["response"]
    
    # Verify messages are saved
    msgs = db_session.query(AIMessage).filter(AIMessage.conversation_id == conv.id).all()
    assert len(msgs) == 2
    assert msgs[0].role == "user"
    assert msgs[1].role == "assistant"
