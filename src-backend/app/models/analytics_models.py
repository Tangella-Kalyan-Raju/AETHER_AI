from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Integer, Text
from datetime import datetime, timezone
from app.models.base import Base
import uuid

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class AnalyticsReport(Base):
    """Structured report metadata for future export."""
    __tablename__ = "analytics_reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    report_type = Column(String(50)) # Executive, Optimization, Scenario
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    data_payload = Column(JSON, nullable=False)

class AnalyticsHistory(Base):
    """Historical tracking of generated reports and snapshots."""
    __tablename__ = "analytics_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    reference_id = Column(String(36), nullable=False)
    event_type = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now)

class KPI(Base):
    """Current snapshot of a key performance indicator."""
    __tablename__ = "analytics_kpis"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    current_value = Column(Float, nullable=False)
    previous_value = Column(Float, nullable=False)
    unit = Column(String(20))
    trend_direction = Column(String(20)) # UP, DOWN, STABLE
    percentage_change = Column(Float)
    last_updated = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class KPIHistory(Base):
    """Time-series history of KPI values."""
    __tablename__ = "analytics_kpi_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    kpi_name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=get_utc_now)

class TrendAnalysis(Base):
    """Aggregated long-term trend data."""
    __tablename__ = "analytics_trends"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    metric = Column(String(100), nullable=False)
    time_granularity = Column(String(20)) # Daily, Weekly, Monthly
    trend_data = Column(JSON, nullable=False) # [{time, value}]
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class ExecutiveSummary(Base):
    """Human-readable business intelligence summaries."""
    __tablename__ = "analytics_executive_summaries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    summary_text = Column(Text, nullable=False)
    key_achievements = Column(JSON)
    major_risks = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class Benchmark(Base):
    """Comparison against enterprise targets."""
    __tablename__ = "analytics_benchmarks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    metric_name = Column(String(100), nullable=False)
    current_performance = Column(Float, nullable=False)
    target_value = Column(Float, nullable=False)
    gap_value = Column(Float, nullable=False)
    status = Column(String(50)) # Achieved, At Risk, Failing

class AnalyticsSnapshot(Base):
    """Point-in-time snapshot of the entire BI state."""
    __tablename__ = "analytics_snapshots"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    snapshot_name = Column(String(200), nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
