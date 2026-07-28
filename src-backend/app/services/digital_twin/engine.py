from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.dt_foundation_models import DigitalTwin, AssetRegistry, AssetMetadata, AssetState, AssetHealth, GridTopology
from app.models.digital_twin_models import Substation, Generator, TransmissionLine, Bus, Load, Transformer

class DigitalTwinEngine:
    def __init__(self, db: Session):
        self.db = db
        
    def _ensure_twin_exists(self) -> DigitalTwin:
        twin = self.db.query(DigitalTwin).first()
        if not twin:
            twin = DigitalTwin(name="Enterprise Grid Twin")
            self.db.add(twin)
            self.db.commit()
        return twin
        
    def sync_physical_to_registry(self):
        """Populate the DT Asset Registry from physical schemas if empty."""
        twin = self._ensure_twin_exists()
        
        # Check if empty
        if self.db.query(AssetRegistry).count() > 0:
            return "Already synced"
            
        # Substations
        for sub in self.db.query(Substation).all():
            self._register_asset(twin.id, sub.name, "Substation", "substations", sub.id)
            
        # Generators
        for gen in self.db.query(Generator).all():
            self._register_asset(twin.id, gen.name, f"{gen.type.capitalize()} Plant", "generators", gen.id, capacity=gen.capacity_mw)
            
        # Transmission Lines
        for line in self.db.query(TransmissionLine).all():
            self._register_asset(twin.id, line.name, "Transmission Line", "transmission_lines", line.id, capacity=line.rating_mva)
            
        # Loads
        for ld in self.db.query(Load).all():
            self._register_asset(twin.id, ld.name, "Load Center", "loads", ld.id)
            
        self.db.commit()
        
        # Build Topology
        self._build_topology(twin.id)
        return "Synced"
        
    def _register_asset(self, twin_id: str, name: str, type: str, source_table: str, source_id: int, capacity: float = None):
        asset = AssetRegistry(
            twin_id=twin_id,
            name=name,
            type=type,
            source_table=source_table,
            source_id=source_id,
            region="Northern Region",
            zone="Zone A"
        )
        self.db.add(asset)
        self.db.flush()
        
        # Metadata
        meta = AssetMetadata(asset_id=asset.id, capacity=capacity)
        self.db.add(meta)
        
        # State
        import random
        state = AssetState(
            asset_id=asset.id,
            active_power=random.uniform(10.0, 100.0) if type in ["Solar Plant", "Wind Plant", "Thermal Plant", "Hydro Plant", "Gas Plant", "Load Center"] else None,
            voltage=138.0,
            utilization_pct=random.uniform(40.0, 85.0),
            operational_state="Online"
        )
        self.db.add(state)
        
        # Health
        health = AssetHealth(
            asset_id=asset.id,
            health_score=random.uniform(85.0, 100.0),
            availability_pct=100.0
        )
        self.db.add(health)
        
    def _build_topology(self, twin_id: str):
        # Build logical connections
        subs = self.db.query(AssetRegistry).filter(AssetRegistry.type == "Substation").all()
        gens = self.db.query(AssetRegistry).filter(AssetRegistry.type.like("%Plant%")).all()
        lines = self.db.query(AssetRegistry).filter(AssetRegistry.type == "Transmission Line").all()
        
        # Map Generators to Substations arbitrarily for demo
        for i, gen in enumerate(gens):
            if subs:
                parent = subs[i % len(subs)]
                topo = GridTopology(
                    twin_id=twin_id,
                    parent_asset_id=parent.id,
                    child_asset_id=gen.id,
                    relationship_type="Contains"
                )
                self.db.add(topo)
                
        # Map Lines connecting Substations
        if len(subs) > 1 and len(lines) > 0:
            topo1 = GridTopology(twin_id=twin_id, parent_asset_id=subs[0].id, child_asset_id=lines[0].id, relationship_type="ConnectsTo")
            topo2 = GridTopology(twin_id=twin_id, parent_asset_id=lines[0].id, child_asset_id=subs[1].id, relationship_type="ConnectsTo")
            self.db.add_all([topo1, topo2])
            
        self.db.commit()

    def get_assets(self, filter_type: str = None) -> List[Dict]:
        self.sync_physical_to_registry()
        
        query = self.db.query(AssetRegistry)
        if filter_type:
            query = query.filter(AssetRegistry.type == filter_type)
            
        assets = query.all()
        
        res = []
        for a in assets:
            state = self.db.query(AssetState).filter(AssetState.asset_id == a.id).first()
            health = self.db.query(AssetHealth).filter(AssetHealth.asset_id == a.id).first()
            meta = self.db.query(AssetMetadata).filter(AssetMetadata.asset_id == a.id).first()
            
            res.append({
                "id": a.id,
                "name": a.name,
                "type": a.type,
                "region": a.region,
                "zone": a.zone,
                "state": {
                    "operational_state": state.operational_state if state else "Unknown",
                    "utilization_pct": state.utilization_pct if state else 0,
                    "active_power": state.active_power if state else 0,
                    "voltage": state.voltage if state else 0
                },
                "health": {
                    "health_score": health.health_score if health else 0,
                    "status": health.health_status if health else "Unknown"
                },
                "metadata": {
                    "capacity": meta.capacity if meta else 0
                }
            })
        return res

    def get_topology(self) -> List[Dict]:
        self.sync_physical_to_registry()
        
        topologies = self.db.query(GridTopology).all()
        res = []
        for t in topologies:
            res.append({
                "parent_asset_id": t.parent_asset_id,
                "child_asset_id": t.child_asset_id,
                "relationship_type": t.relationship_type
            })
        return res
