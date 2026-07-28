import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Index, UniqueConstraint
from app.models.base import Base

class MeasurementLatest(Base):
    """
    Stores the most recent state for each asset-measurement pair.
    Optimized for fast lookups and dashboard states.
    """
    __tablename__ = "monitoring_measurements_latest"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id = Column(String(36), nullable=False, index=True)
    asset_type = Column(String(100), nullable=False, index=True)
    measurement_type = Column(String(100), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    quality = Column(String(50), nullable=False)
    source = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('asset_id', 'measurement_type', name='uix_asset_measurement_latest'),
    )


class MeasurementHistory(Base):
    """
    Append-only time-series table storing all historical telemetry.
    Optimized for time-series analytical queries.
    """
    __tablename__ = "monitoring_measurements_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id = Column(String(36), nullable=False, index=True)
    asset_type = Column(String(100), nullable=False, index=True)
    measurement_type = Column(String(100), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    quality = Column(String(50), nullable=False)
    source = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_history_asset_time', 'asset_id', 'timestamp'),
        Index('idx_history_type_time', 'measurement_type', 'timestamp'),
    )
