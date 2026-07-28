import logging
from sqlalchemy.orm import Session
from app.models.simulation_models import SimulationEventLog
from app.models.analysis_models import AIExplainabilityTrace

logger = logging.getLogger(__name__)

class ExplainabilityEngine:
    """
    Generates causal links to explain AI decisions made during the simulation.
    """
    
    @staticmethod
    def generate_traces(db: Session, report_id: str, simulation_id: str):
        # Fetch the logs that represented AI actions
        ai_events = db.query(SimulationEventLog)\
            .filter(SimulationEventLog.simulation_id == simulation_id)\
            .filter(SimulationEventLog.event_category == 'AI')\
            .all()
            
        for event in ai_events:
            # We construct a trace answering 'Why?'
            trace = AIExplainabilityTrace(
                report_id=report_id,
                question="Why was this optimization strategy selected?",
                answer=f"The AI detected constraints at T+{event.sim_time_offset_mins} and recommended this action to prevent grid failure.",
                evidence_json={
                    "trigger_event_id": event.id,
                    "sim_time": event.sim_time_offset_mins,
                    "raw_message": event.message
                }
            )
            db.add(trace)
        
        db.commit()
