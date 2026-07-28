from app.config.settings import settings

# Expose variables for backward compatibility
MYSQL_HOST = settings.MYSQL_HOST
MYSQL_PORT = settings.MYSQL_PORT
MYSQL_USER = settings.MYSQL_USER
MYSQL_PASSWORD = settings.MYSQL_PASSWORD
MYSQL_DATABASE = settings.MYSQL_DATABASE

POSTGRES_HOST = settings.POSTGRES_HOST
POSTGRES_PORT = settings.POSTGRES_PORT
POSTGRES_USER = settings.POSTGRES_USER
POSTGRES_PASSWORD = settings.POSTGRES_PASSWORD
POSTGRES_DB = settings.POSTGRES_DB

DB_POOL_SIZE = settings.DB_POOL_SIZE
DB_MAX_OVERFLOW = settings.DB_MAX_OVERFLOW
DB_POOL_RECYCLE = settings.DB_POOL_RECYCLE
DB_POOL_TIMEOUT = settings.DB_POOL_TIMEOUT

SQLITE_DB_NAME = settings.SQLITE_DB_NAME
SQLITE_PATH = settings.SQLITE_PATH

def get_database_url() -> str:
    """
    Constructs the database URL. Prioritizes PostgreSQL if configured, then MySQL,
    and falls back to local SQLite file.
    """
    # 1. Try PostgreSQL
    if POSTGRES_HOST:
        try:
            import psycopg2
            connection = psycopg2.connect(
                host=POSTGRES_HOST,
                port=int(POSTGRES_PORT),
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                dbname=POSTGRES_DB,
                connect_timeout=2
            )
            connection.close()
            return f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
        except Exception as e:
            pass # Fallback

    # 2. Try MySQL
    try:
        import pymysql
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=int(MYSQL_PORT),
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            connect_timeout=2
        )
        connection.close()
        return f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    except Exception:
        # Fallback to local SQLite file
        return f"sqlite:///{SQLITE_PATH}"

def is_sqlite() -> bool:
    url = get_database_url()
    return url.startswith("sqlite")
