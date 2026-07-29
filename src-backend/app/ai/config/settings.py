import os

class AISettings:
    DEFAULT_PROVIDER: str = os.getenv("AI_PROVIDER", "groq")
    DEFAULT_MODEL: str = os.getenv("AI_MODEL", "llama3-70b-8192")
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "2048"))
    TIMEOUT: float = float(os.getenv("TIMEOUT", "30.0"))
    RETRY_COUNT: int = int(os.getenv("RETRY_COUNT", "3"))
    DEBUG_MODE: bool = os.getenv("AI_DEBUG", "True").lower() == "true"
    ENABLE_AI: bool = True
    STREAMING: bool = False

settings = AISettings()
