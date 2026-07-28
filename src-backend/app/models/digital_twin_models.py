import uuid
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin

# ──────────────────────────────────────────────────────────
# Digital Twin Infrastructure Models
# ──────────────────────────────────────────────────────────

class Substation(Base, BaseModelMixin):
    __tablename__ = "substations"

    uuid = Column(String(50), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)

    # Relationships
    buses = relationship("Bus", back_populates="substation", cascade="all, delete-orphan")


class Bus(Base, BaseModelMixin):
    __tablename__ = "buses"

    uuid = Column(String(50), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    base_kv = Column(Float, nullable=False, default=138.0)
    substation_id = Column(Integer, ForeignKey("substations.id", ondelete="CASCADE"), nullable=False, index=True)
    metadata_json = Column("metadata", JSON, nullable=True)

    # Relationships
    substation = relationship("Substation", back_populates="buses")
    generators = relationship("Generator", back_populates="bus", cascade="all, delete-orphan")
    loads = relationship("Load", back_populates="bus", cascade="all, delete-orphan")
    switches = relationship("Switch", back_populates="bus")

    # Double ended line/transformer relationships need explicit foreign keys specified
    outgoing_lines = relationship(
        "TransmissionLine",
        foreign_keys="TransmissionLine.from_bus_id",
        back_populates="from_bus",
        cascade="all, delete-orphan"
    )
    incoming_lines = relationship(
        "TransmissionLine",
        foreign_keys="TransmissionLine.to_bus_id",
        back_populates="to_bus",
        cascade="all, delete-orphan"
    )
    outgoing_transformers = relationship(
        "Transformer",
        foreign_keys="Transformer.from_bus_id",
        back_populates="from_bus",
        cascade="all, delete-orphan"
    )
    incoming_transformers = relationship(
        "Transformer",
        foreign_keys="Transformer.to_bus_id",
        back_populates="to_bus",
        cascade="all, delete-orphan"
    )


class TransmissionLine(Base, BaseModelMixin):
    __tablename__ = "transmission_lines"

    uuid = Column(String(50), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    from_bus_id = Column(Integer, ForeignKey("buses.id", ondelete="CASCADE"), nullable=False, index=True)
    to_bus_id = Column(Integer, ForeignKey("buses.id", ondelete="CASCADE"), nullable=False, index=True)
    r_pu = Column(Float, nullable=False, default=0.01)
    x_pu = Column(Float, nullable=False, default=0.05)
    b_pu = Column(Float, nullable=False, default=0.02)
    rating_mva = Column(Float, nullable=False, default=100.0)
    metadata_json = Column("metadata", JSON, nullable=True)

    # Relationships
    from_bus = relationship("Bus", foreign_keys=[from_bus_id], back_populates="outgoing_lines")
    to_bus = relationship("Bus", foreign_keys=[to_bus_id], back_populates="incoming_lines")
    switches = relationship("Switch", back_populates="line", cascade="all, delete-orphan")


class Transformer(Base, BaseModelMixin):
    __tablename__ = "transformers"

    uuid = Column(String(50), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    from_bus_id = Column(Integer, ForeignKey("buses.id", ondelete="CASCADE"), nullable=False, index=True)
    to_bus_id = Column(Integer, ForeignKey("buses.id", ondelete="CASCADE"), nullable=False, index=True)
    r_pu = Column(Float, nullable=False, default=0.005)
    x_pu = Column(Float, nullable=False, default=0.04)
    rating_mva = Column(Float, nullable=False, default=50.0)
    metadata_json = Column("metadata", JSON, nullable=True)

    # Relationships
    from_bus = relationship("Bus", foreign_keys=[from_bus_id], back_populates="outgoing_transformers")
    to_bus = relationship("Bus", foreign_keys=[to_bus_id], back_populates="incoming_transformers")


class Generator(Base, BaseModelMixin):
    __tablename__ = "generators"

    uuid = Column(String(50), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(100), nullable=False, default="thermal")  # e.g., solar, wind, thermal, hydro, gas
    capacity_mw = Column(Float, nullable=False, default=100.0)
    p_mw = Column(Float, nullable=False, default=0.0)
    q_mvar = Column(Float, nullable=False, default=0.0)
    metadata_json = Column("metadata", JSON, nullable=True)

    # Relationships
    bus = relationship("Bus", back_populates="generators")


class Load(Base, BaseModelMixin):
    __tablename__ = "loads"

    uuid = Column(String(50), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="CASCADE"), nullable=False, index=True)
    p_mw = Column(Float, nullable=False, default=0.0)
    q_mvar = Column(Float, nullable=False, default=0.0)
    metadata_json = Column("metadata", JSON, nullable=True)

    # Relationships
    bus = relationship("Bus", back_populates="loads")


class Switch(Base, BaseModelMixin):
    __tablename__ = "switches"

    uuid = Column(String(50), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    line_id = Column(Integer, ForeignKey("transmission_lines.id", ondelete="CASCADE"), nullable=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="SET NULL"), nullable=True, index=True)
    state = Column(String(20), nullable=False, default="closed")  # e.g., "open" or "closed"
    metadata_json = Column("metadata", JSON, nullable=True)

    # Relationships
    line = relationship("TransmissionLine", back_populates="switches")
    bus = relationship("Bus", back_populates="switches")
