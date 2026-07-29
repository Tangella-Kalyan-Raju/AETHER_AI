from typing import Generic, TypeVar, Type, Any, Optional, List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, asc, desc, String, cast, func
from datetime import datetime
from app.core.exceptions import handle_db_error, RecordNotFoundError

T = TypeVar("T")

class BaseRepository(Generic[T]):
    """
    Generic Repository Pattern base class handling CRUD transactions, pagination,
    filtering, dynamic sorting, search capability, range queries, and soft-delete filters.

    Supports:
    - Standard CRUD (create, get, update, delete)
    - Soft delete with is_deleted flag
    - Paginated listing with search, filters, sorting
    - Range filters for datetime and numeric columns
    - UUID-based lookups
    - Record counting
    """
    def __init__(self, db: Session, model: Type[T]):
        self.db = db
        self.model = model

    def create(self, data: dict) -> T:
        """Create a new database row entry."""
        instance = self.model(**data)
        try:
            self.db.add(instance)
            self.db.commit()
            self.db.refresh(instance)
            return instance
        except Exception as e:
            self.db.rollback()
            raise handle_db_error(e)

    def get(self, id: Any, include_deleted: bool = False) -> Optional[T]:
        """Fetch a single record by its primary key ID."""
        query = self.db.query(self.model).filter(self.model.id == id)
        
        # Apply soft delete filter if column exists
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.filter(self.model.is_deleted == False)
            
        return query.first()

    def get_by_uuid(self, uuid: str, include_deleted: bool = False) -> Optional[T]:
        """Fetch a single record by its UUID string."""
        if not hasattr(self.model, "uuid"):
            return None
        query = self.db.query(self.model).filter(self.model.uuid == uuid)
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.filter(self.model.is_deleted == False)
        return query.first()

    def get_all(self, include_deleted: bool = False) -> List[T]:
        """Fetch all table records."""
        query = self.db.query(self.model)
        
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.filter(self.model.is_deleted == False)
            
        return query.all()

    def count(self, filters: dict = None, include_deleted: bool = False) -> int:
        """Count total records matching optional filters without fetching data."""
        query = self.db.query(func.count(self.model.id))

        filter_clauses = []
        if filters:
            for key, val in filters.items():
                if hasattr(self.model, key):
                    filter_clauses.append(getattr(self.model, key) == val)

        if hasattr(self.model, "is_deleted") and not include_deleted:
            filter_clauses.append(self.model.is_deleted == False)

        if filter_clauses:
            query = query.filter(and_(*filter_clauses))

        return query.scalar()

    def update(self, id: Any, data: dict) -> Optional[T]:
        """Update an existing record's details with version concurrency checks."""
        instance = self.get(id)
        if not instance:
            raise RecordNotFoundError(f"Record with ID {id} not found in database.")
            
        # Concurrency Conflict Check
        if "version" in data and hasattr(instance, "version"):
            client_version = data["version"]
            if client_version is not None and client_version != instance.version:
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Conflict detected: Asset has been modified by another session (Database Version: {instance.version}, Submitted Version: {client_version})."
                )

        try:
            # Filter version out of the manual updates loop since it is incremented atomically
            data_to_update = {k: v for k, v in data.items() if k != "version"}
            for key, val in data_to_update.items():
                if hasattr(instance, key):
                    setattr(instance, key, val)
            
            if hasattr(instance, "version"):
                instance.version = (instance.version or 1) + 1
                    
            self.db.commit()
            self.db.refresh(instance)
            return instance
        except Exception as e:
            self.db.rollback()
            raise handle_db_error(e)

    def delete(self, id: Any, soft: bool = True) -> bool:
        """
        Delete a database record. Performs soft delete by default if the model
        implements BaseModelMixin.is_deleted, otherwise hard deletes the row.
        """
        instance = self.get(id, include_deleted=True)
        if not instance:
            raise RecordNotFoundError(f"Record with ID {id} not found to delete.")
            
        try:
            if soft and hasattr(instance, "soft_delete"):
                instance.soft_delete()
            else:
                self.db.delete(instance)
                
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise handle_db_error(e)

    def find_one(self, filters: dict, include_deleted: bool = False) -> Optional[T]:
        """Find a single record matching specific criteria filters."""
        query = self.db.query(self.model)
        
        filter_clauses = []
        for key, val in filters.items():
            if hasattr(self.model, key):
                filter_clauses.append(getattr(self.model, key) == val)
                
        if hasattr(self.model, "is_deleted") and not include_deleted:
            filter_clauses.append(self.model.is_deleted == False)
            
        if filter_clauses:
            query = query.filter(and_(*filter_clauses))
            
        return query.first()

    def find_by(self, filters: dict, include_deleted: bool = False) -> List[T]:
        """Find all records matching specific criteria filters."""
        query = self.db.query(self.model)
        
        filter_clauses = []
        for key, val in filters.items():
            if hasattr(self.model, key):
                filter_clauses.append(getattr(self.model, key) == val)
                
        if hasattr(self.model, "is_deleted") and not include_deleted:
            filter_clauses.append(self.model.is_deleted == False)
            
        if filter_clauses:
            query = query.filter(and_(*filter_clauses))
            
        return query.all()

    def _apply_range_filters(self, query, range_filters: Dict[str, Tuple[Any, Any]]):
        """
        Apply numeric or datetime range filters to a query.
        range_filters: dict of column_name -> (min_value, max_value)
        Either min or max can be None to create open-ended ranges.
        """
        for col_name, (min_val, max_val) in range_filters.items():
            if not hasattr(self.model, col_name):
                continue
            col_attr = getattr(self.model, col_name)
            if min_val is not None:
                query = query.filter(col_attr >= min_val)
            if max_val is not None:
                query = query.filter(col_attr <= max_val)
        return query

    def get_page(
        self,
        page: int = 1,
        page_size: int = 20,
        filters: dict = None,
        sort_by: str = None,
        sort_order: str = "asc",
        search_query: str = None,
        search_columns: List[str] = None,
        include_deleted: bool = False,
        range_filters: Dict[str, Tuple[Any, Any]] = None,
        options: List[Any] = None
    ) -> Dict[str, Any]:
        """
        Retrieves a paginated segment of records, applying search strings,
        property filters, range filters, sorting expressions, and soft-delete bounds.

        Args:
            page: Page number (1-indexed).
            page_size: Number of records per page.
            filters: Dict of column_name -> exact value for equality filtering.
            sort_by: Column name to sort by.
            sort_order: 'asc' or 'desc'.
            search_query: Free-text search string applied via ILIKE across search_columns.
            search_columns: List of column names to search across.
            include_deleted: Whether to include soft-deleted records.
            range_filters: Dict of column_name -> (min_value, max_value) for range queries.
        """
        query = self.db.query(self.model)
        
        # Apply standard equality filters
        filter_clauses = []
        if filters:
            for key, val in filters.items():
                if hasattr(self.model, key):
                    filter_clauses.append(getattr(self.model, key) == val)
                    
        if hasattr(self.model, "is_deleted") and not include_deleted:
            filter_clauses.append(self.model.is_deleted == False)
            
        if filter_clauses:
            query = query.filter(and_(*filter_clauses))

        # Apply range filters (datetime ranges, numeric ranges)
        if range_filters:
            query = self._apply_range_filters(query, range_filters)
            
        # Apply Search Query (dynamic ILIKE wildcard mapping)
        if search_query and search_columns:
            search_clauses = []
            for col in search_columns:
                if hasattr(self.model, col):
                    column_attr = getattr(self.model, col)
                    # Convert to string and apply ILIKE/like pattern
                    search_clauses.append(cast(column_attr, String).ilike(f"%{search_query}%"))
            if search_clauses:
                query = query.filter(or_(*search_clauses))
                
        # Get count before offset limits
        total_records = query.count()
        
        # Apply loader options (like joinedload)
        if options:
            for opt in options:
                query = query.options(opt)
                
        # Apply Sorting
        if sort_by and hasattr(self.model, sort_by):
            col_attr = getattr(self.model, sort_by)
            order_func = desc if sort_order.lower() == "desc" else asc
            query = query.order_by(order_func(col_attr))
        elif hasattr(self.model, "created_at"):
            query = query.order_by(desc(self.model.created_at))
            
        # Apply Pagination Offsets
        offset = (page - 1) * page_size
        records = query.offset(offset).limit(page_size).all()
        
        total_pages = (total_records + page_size - 1) // page_size if total_records > 0 else 0
        
        return {
            "items": records,
            "page": page,
            "page_size": page_size,
            "total": total_records,
            "total_records": total_records,
            "total_pages": total_pages
        }
