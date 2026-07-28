import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
from app.config.settings import settings

# Create logs directory if it does not exist
os.makedirs(settings.LOG_DIR, exist_ok=True)

log_format = '%(asctime)s %(levelname)s %(name)s %(process)d %(message)s'
log_formatter = logging.Formatter(log_format)
json_formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(process)d %(message)s',
    datefmt="%Y-%m-%dT%H:%M:%S%z"
)

# Root logger setup
root_logger = logging.getLogger()
root_logger.setLevel(getattr(logging, settings.LOG_LEVEL, logging.INFO))

# Clear existing handlers
if root_logger.hasHandlers():
    root_logger.handlers.clear()

# Console Handler (Stdout)
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
root_logger.addHandler(console_handler)

def get_rotating_file_handler(filename: str, level: int) -> RotatingFileHandler:
    handler = RotatingFileHandler(
        os.path.join(settings.LOG_DIR, filename),
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    handler.setLevel(level)
    handler.setFormatter(json_formatter)
    return handler

# App General Log File
app_handler = get_rotating_file_handler("app.log", logging.INFO)
root_logger.addHandler(app_handler)

# Specific Loggers
# 1. API Logger
api_logger = logging.getLogger("gpo.api")
api_logger.setLevel(logging.INFO)
api_handler = get_rotating_file_handler("api.log", logging.INFO)
api_logger.addHandler(api_handler)

# 2. Database Logger
db_logger = logging.getLogger("gpo.db")
db_logger.setLevel(logging.INFO)
db_handler = get_rotating_file_handler("db.log", logging.INFO)
db_logger.addHandler(db_handler)
# Direct SQLAlchemy engine logs to this db logger as well
logging.getLogger("sqlalchemy.engine").addHandler(db_handler)

# 3. Error Logger
error_logger = logging.getLogger("gpo.error")
error_logger.setLevel(logging.ERROR)
error_handler = get_rotating_file_handler("error.log", logging.ERROR)
error_logger.addHandler(error_handler)
root_logger.addHandler(error_handler)  # Capture all root error logs in error.log

# 4. Performance Logger
perf_logger = logging.getLogger("gpo.performance")
perf_logger.setLevel(logging.INFO)
perf_handler = get_rotating_file_handler("performance.log", logging.INFO)
perf_logger.addHandler(perf_handler)

api_logger.info("GPO API Logging initialized.")
db_logger.info("GPO Database Logging initialized.")
perf_logger.info("GPO Performance Logging initialized.")
root_logger.info("GPO Root Logger initialized.")
