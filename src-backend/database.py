import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load env variables from backend .env
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "gpo_auth")

DATABASE_URL = None
engine = None

try:
    import pymysql
    # Try connecting to MySQL to verify if it's online
    connection = pymysql.connect(
        host=MYSQL_HOST,
        port=int(MYSQL_PORT),
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        connect_timeout=2
    )
    with connection.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE}")
    connection.close()

    DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    print(f"[GPO-DB] Connected to MySQL database: {MYSQL_DATABASE}")
except Exception as e:
    # Fallback to local SQLite database so there are no connection Refused errors
    print(f"[GPO-DB] MySQL server offline ({e}). Falling back to SQLite database...")
    # Store SQLite file locally in the backend directory
    DATABASE_URL = "sqlite:///gpo_auth.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    print("[GPO-DB] Connected to SQLite database: gpo_auth.db")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
