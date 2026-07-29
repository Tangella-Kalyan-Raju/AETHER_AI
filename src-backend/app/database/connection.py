import logging
logger = logging.getLogger(__name__)

import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config import db_config
from app.core.exceptions import DatabaseConnectionError

DATABASE_URL = db_config.get_database_url()

# Configure SQLAlchemy engine depending on dialect (SQLite vs MySQL)
engine_args = {}
if db_config.is_sqlite():
    engine_args = {
        "connect_args": {"check_same_thread": False}
    }
else:
    engine_args = {
        "pool_size": db_config.DB_POOL_SIZE,
        "max_overflow": db_config.DB_MAX_OVERFLOW,
        "pool_recycle": db_config.DB_POOL_RECYCLE,
        "pool_timeout": db_config.DB_POOL_TIMEOUT,
        "pool_pre_ping": True  # Verification pings before executing statements
    }

try:
    engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True only for deep debugging
    **engine_args
)
except Exception as e:
    logger.info(f"[GPO-DB] Critical: Engine initialization failure: {e}")
    raise DatabaseConnectionError("Failed to initialize database engine.", str(e))

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Context generator returning database session contexts."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_health(db: Session) -> dict:
    """
    Executes a health verification script querying database ping,
    response latency, and pool attributes.
    """
    status = "healthy"
    details = {}
    
    start_time = time.time()
    try:
        # DB Ping
        db.execute(text("SELECT 1")).scalar()
        latency_ms = round((time.time() - start_time) * 1000, 2)
        details["connection"] = "connected"
        details["latency_ms"] = latency_ms
    except Exception as err:
        status = "unhealthy"
        details["connection"] = f"failed: {str(err)}"
        details["latency_ms"] = -1
        
    # Check Pool Statistics
    if not db_config.is_sqlite():
        try:
            pool = engine.pool
            details["pool"] = {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow() if hasattr(pool, 'overflow') else 0
            }
        except Exception as e:
            details["pool"] = f"Unavailable: {e}"
    else:
        details["pool"] = "SQLite (no pool settings)"
        
    # Check Migration status
    try:
        has_migrations_table = db.execute(text(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='migration_history'"
            if db_config.is_sqlite() else
            "SELECT count(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'migration_history'"
        )).scalar()
        
        if has_migrations_table and has_migrations_table > 0:
            current_ver = db.execute(text("SELECT version FROM migration_history ORDER BY id DESC LIMIT 1")).scalar()
            details["migration"] = {
                "status": "applied",
                "current_version": current_ver or "none"
            }
        else:
            details["migration"] = {
                "status": "pending",
                "current_version": "none"
            }
    except Exception as e:
        details["migration"] = f"Verification error: {e}"

    return {
        "status": status,
        "details": details,
        "dialect": engine.dialect.name
    }

def dispose_engine():
    """Graceful shutdown hook clearing the connection pool engines."""
    try:
        engine.dispose()
        logger.info("[GPO-DB] Connection pool cleared gracefully.")
    except Exception as e:
        logger.info(f"[GPO-DB] Error cleaning up connection pool: {e}")
