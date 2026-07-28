class GPOException(Exception):
    """Base exception class for all GPO errors."""
    def __init__(self, message: str, details: str = None):
        super().__init__(message)
        self.message = message
        self.details = details

class GPODatabaseError(GPOException):
    """Base exception for all database operations."""
    pass

class DatabaseConnectionError(GPODatabaseError):
    """Raised when connecting to the database fails."""
    pass

class RecordNotFoundError(GPODatabaseError):
    """Raised when a requested resource does not exist."""
    pass

class ConstraintViolationError(GPODatabaseError):
    """Raised when a foreign key or check constraint is violated."""
    pass

class DuplicateKeyError(GPODatabaseError):
    """Raised when a unique constraint or duplicate primary key occurs."""
    pass

class TransactionError(GPODatabaseError):
    """Raised when a database transaction transaction commit or rollback fails."""
    pass

def handle_db_error(error: Exception) -> GPODatabaseError:
    """
    Parses driver-specific exceptions (SQLAlchemy / PyMySQL / SQLite)
    and maps them to structured custom GPODatabaseError classes.
    """
    error_msg = str(error)
    
    if "Duplicate entry" in error_msg or "UNIQUE constraint failed" in error_msg:
        return DuplicateKeyError("A record with these unique details already exists.", error_msg)
        
    if "FOREIGN KEY constraint failed" in error_msg or "Cannot add or update a child row" in error_msg or "cannot delete or update a parent row" in error_msg:
        return ConstraintViolationError("Database constraint or relational integrity violated.", error_msg)
        
    if "Can't connect" in error_msg or "Connection refused" in error_msg or "timeout" in error_msg.lower():
        return DatabaseConnectionError("Unable to establish connection with the database engine.", error_msg)
        
    return GPODatabaseError("An unexpected database error occurred.", error_msg)
