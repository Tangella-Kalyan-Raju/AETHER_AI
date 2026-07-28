import os
from pydantic_settings import BaseSettings

parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    # Environment Setup
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = ENV.lower() == "development"

    # MySQL Configuration
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "gpo_auth")

    # PostgreSQL Configuration
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "gpo_auth")

    # SQLite Configuration
    SQLITE_DB_NAME: str = os.getenv("SQLITE_DB_NAME", "gpo_auth.db")
    SQLITE_PATH: str = os.path.join(parent_dir, SQLITE_DB_NAME)

    # Database Pool Settings
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "1800"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))

    # Security Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "gpo-enterprise-jwt-decisions-secret-key-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR: str = os.path.join(parent_dir, "logs")

    # Groq AI Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama3-8b-8192")

    # OpenWeather API Settings
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

    class Config:
        env_file = os.path.join(parent_dir, ".env")
        env_file_encoding = "utf-8"

settings = Settings()
