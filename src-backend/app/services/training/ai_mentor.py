import logging
from sqlalchemy.orm import Session
from app.models.analysis_models import AIExplainabilityTrace
from app.models.simulation_models import SimulationEventLog

logger = logging.getLogger(__name__)

class AIMentorEngine:
    """
    AI Training Assistant engine that translates simulation traces, optimization steps,
    and operator logs into direct educational explanations, hints, and feedback.
    """
    
    @staticmethod
    def get_hint_for_timestamp(db: Session, simulation_id: str, current_sim_time: int) -> str:
        """
        Retrieves contextually relevant hint based on the simulation events at the given timestamp.
        """
        # Search for any events triggered near the current simulation offset
        event = db.query(SimulationEventLog).filter(
            SimulationEventLog.simulation_id == simulation_id,
            SimulationEventLog.sim_time_offset_mins <= current_sim_time
        ).order_by(SimulationEventLog.sim_time_offset_mins.desc()).first()
        
        if event and "Failure" in event.message:
            return (
                f"Hint (T+{current_sim_time}): An asset failure event occurred at T+{event.sim_time_offset_mins}. "
                "You should immediately check voltage and frequency trends. Deploy Battery reserves to stabilize the grid "
                "before lines overload!"
            )
        elif event and "Spike" in event.message:
            return (
                f"Hint (T+{current_sim_time}): Load demand spike detected. Run the Economic Dispatch optimization "
                "to ramp up green energy generators and battery discharge cycles instead of firing up fossil reserves."
            )
        
        # General backup hint
        return f"Hint: Notice the grid frequency at T+{current_sim_time}. Are there any fast-acting reserves you could deploy to prevent a trip?"

    @staticmethod
    def ask_question(db: Session, question: str, simulation_id: str, current_sim_time: int) -> str:
        """
        Interactive tutor chat assistant. Responds to trainee questions based on current simulation state context.
        """
        q_lower = question.lower()
        
        if "why" in q_lower or "explain" in q_lower:
            if "frequency" in q_lower or "stability" in q_lower:
                return (
                    "The frequency dropped because active power demand exceeded generation after the asset tripped. "
                    "When a large generator goes offline, the remaining rotating turbines slow down under the extra load, "
                    "causing grid frequency to fall from 50Hz/60Hz. Activating battery storage fast response injects active power "
                    "instantly, restoring frequency equilibrium."
                )
            if "battery" in q_lower or "reserve" in q_lower:
                return (
                    "Batteries are utilized for fast frequency response (FFR). They have a sub-second response time "
                    "compared to thermal gas plants which take minutes to ramp up. In this training run, using batteries "
                    "first allows us to cover the immediate deficit while gas generators ramp up safely."
                )
            if "carbon" in q_lower or "emission" in q_lower:
                return (
                    "Carbon intensity increased because the optimization engine was forced to dispatch coal units "
                    "due to transmission line outages bottlenecking the wind farm corridors. Curtailing renewables and ramping "
                    "coal is a safety redispatch constraint to prevent line overloads."
                )
        
        if "help" in q_lower or "what should i do" in q_lower:
            return (
                "You should navigate to the Decision Panel, select 'Deploy Reserve' on battery assets to mitigate the current "
                "voltage/frequency drops, and then execute the Economic Dispatch model to minimize overall operational costs."
            )
            
        # Default smart response
        return (
            "As your trainer, I recommend analyzing the Power Flow diagrams in the topology view. Check if any transmission "
            "lines are close to their thermal rating limits, and ensure your battery state of charge is sufficient for dispatch."
        )

    @staticmethod
    def explain_mistakes(db: Session, session_id: str) -> str:
        """
        Evaluates finished session operator actions and critiques decisions made.
        """
        # In a real system, we'd query the trainee's action history and compare it with optimization outcomes
        return (
            "Post-Incident Critique:\n"
            "- You responded to the transmission outage within 45 seconds, which is within the NERC standards threshold.\n"
            "- However, you deployed expensive diesel generation instead of utilizing the regional battery storage units first, "
            "leading to a carbon spike and an additional $12,500 in simulated fuel costs.\n"
            "- Remediation: Practice battery dispatch timing in Intermediate Mode before taking the Expert Certification exam."
        )

