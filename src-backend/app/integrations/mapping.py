from typing import Optional
from sqlalchemy.orm import Session
from app.models.integration_models import AssetMapping

class AssetMappingEngine:
    """
    Translates external identifiers to internal Asset UUIDs.
    Uses an in-memory cache backed by the database.
    """

    def __init__(self, db: Session):
        self.db = db
        # Cache format: { "provider_type:external_id": "internal_asset_id_str" }
        self._cache = {}

    def get_internal_id(self, provider_type: str, external_id: str) -> Optional[str]:
        """Looks up the internal asset ID for a given external provider and ID."""
        cache_key = f"{provider_type}:{external_id}"
        
        # Check cache
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # Fallback to DB
        mapping = self.db.query(AssetMapping).filter_by(
            provider_type=provider_type,
            external_id=external_id
        ).first()
        
        if mapping:
            internal_id_str = str(mapping.internal_asset_id)
            self._cache[cache_key] = internal_id_str
            return internal_id_str
            
        return None

    def add_mapping(self, provider_type: str, external_id: str, internal_id: str):
        """Adds a new mapping to the database and cache."""
        # Note: In a real app we'd validate the internal_id exists in the assets table.
        mapping = AssetMapping(
            provider_type=provider_type,
            external_id=external_id,
            internal_asset_id=internal_id
        )
        self.db.add(mapping)
        self.db.commit()
        
        self._cache[f"{provider_type}:{external_id}"] = internal_id
