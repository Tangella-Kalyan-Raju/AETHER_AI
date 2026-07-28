import logging
from sqlalchemy.orm import Session
from app.models.digital_twin_models import Substation, Bus, Transformer, Generator

logger = logging.getLogger(__name__)

class KnowledgeGraphEngine:
    """
    Traverses the Digital Twin relational models to build a graph representation
    of grid assets and their physical relationships.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_asset_context(self, region_name: str = None) -> str:
        """
        Retrieves a topological summary for the LLM to understand what assets exist
        and how they are connected.
        """
        # For Phase 5.5, we will generate a summarized topology report
        logger.info("[KnowledgeGraph] Traversing grid topology for context.")
        
        substations = self.db.query(Substation).limit(5).all()
        if not substations:
            return "Knowledge Graph: No physical grid assets found in the region."
            
        context = "KNOWLEDGE GRAPH TOPOLOGY:\n"
        for sub in substations:
            region = getattr(sub, "region", None) or getattr(sub, "metadata_json", {}) or "N/A"
            context += f"Substation: {sub.name} (Region: {region})\n"
            
            buses = self.db.query(Bus).filter(Bus.substation_id == sub.id).all()
            for bus in buses:
                voltage = getattr(bus, "voltage_level", None) or getattr(bus, "base_kv", "N/A")
                context += f"  - Bus: {bus.name} ({voltage} kV)\n"
                
                generators = self.db.query(Generator).filter(Generator.bus_id == bus.id).all()
                for gen in generators:
                    context += f"    - Generator: {gen.name} ({gen.type}, Capacity: {gen.capacity_mw} MW)\n"
                    
        return context
