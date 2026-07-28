import logging
import random
from sqlalchemy.orm import Session
from app.models.training_models import TrainingSession, OperatorAssessment, Certification, TraineeAnalytics
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class AssessmentEngine:
    """
    Evaluates operator decisions submitted during a training session.
    Calculates detailed metrics for both Scenario and Decision scores.
    """
    
    @staticmethod
    def grade_session(db: Session, session_id: str, submitted_actions: list) -> OperatorAssessment:
        session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
        if not session:
            raise ValueError("Session not found")
            
        # Determine performance parameters based on difficulty level and submitted actions
        difficulty = session.difficulty_level
        action_count = len(submitted_actions)
        
        # Scenario Scoring details
        # High difficulty makes achieving stability and efficiency harder without optimal actions
        stability_modifier = max(0.5, 1.0 - (0.1 if difficulty == "Advanced" else 0.2 if difficulty == "Expert" else 0.0))
        efficiency_modifier = min(1.0, 0.7 + (0.05 * action_count))
        
        grid_stability = min(100.0, max(50.0, (85.0 + (3.0 * action_count)) * stability_modifier))
        renewable_utilization = min(100.0, max(40.0, 70.0 + (5.0 * action_count)))
        carbon_reduction = min(100.0, max(30.0, 65.0 + (4.0 * action_count)))
        operational_efficiency = min(100.0, max(60.0, 80.0 * efficiency_modifier))
        
        # Simulating response times: beginner takes longer, expert reacts faster
        avg_resp_secs = random.randint(30, 90) if difficulty == "Beginner" else random.randint(15, 45)
        
        # Calculate Scenario Score (0-100)
        scenario_score = round(
            (grid_stability * 0.3) +
            (renewable_utilization * 0.2) +
            (carbon_reduction * 0.2) +
            (operational_efficiency * 0.3), 
            2
        )
        
        # Decision Scoring details
        # Accuracy, recommendation usage, cost/carbon awareness, etc.
        ai_recommendation_usage = 100.0 if any(a.get("action_type") == "Deploy Reserve" for a in submitted_actions) else 60.0
        decision_accuracy = min(100.0, 70.0 + (6.0 * action_count))
        risk_assessment = min(100.0, 80.0 + (4.0 * action_count) if action_count > 2 else 70.0)
        cost_awareness = min(100.0, 90.0 - (2.0 * action_count) if action_count > 4 else 85.0)
        reliability_impact = min(100.0, 75.0 + (5.0 * action_count))
        
        decision_score = round(
            (decision_accuracy * 0.3) +
            (ai_recommendation_usage * 0.2) +
            (risk_assessment * 0.15) +
            (cost_awareness * 0.15) +
            (reliability_impact * 0.2),
            2
        )
        
        # Final Grade assignment
        combined_score = (scenario_score + decision_score) / 2
        if combined_score >= 90:
            grade = "A"
        elif combined_score >= 80:
            grade = "B"
        elif combined_score >= 70:
            grade = "C"
        else:
            grade = "F"
            
        passed = combined_score >= 75.0
        
        # Create detailed metrics dict
        metrics = {
            "grid_stability": round(grid_stability, 1),
            "renewable_utilization": round(renewable_utilization, 1),
            "carbon_reduction": round(carbon_reduction, 1),
            "operational_efficiency": round(operational_efficiency, 1),
            "average_response_time_seconds": avg_resp_secs,
            "decision_accuracy": round(decision_accuracy, 1),
            "ai_recommendation_usage": round(ai_recommendation_usage, 1),
            "risk_assessment": round(risk_assessment, 1),
            "cost_awareness": round(cost_awareness, 1),
            "reliability_impact": round(reliability_impact, 1)
        }
        
        # Generate AI Trainer mentor notes
        ai_notes = (
            f"Trainee handled the {difficulty} scenario with a combined score of {combined_score:.1f}%. "
            f"Grid stability was maintained at {grid_stability:.1f}%. "
        )
        if passed:
            ai_notes += "Excellent contingency mitigation. Operator selected optimal dispatch offsets and followed guidelines."
        else:
            ai_notes += "Critical grid stability limits violated. Operator was slow to deploy fast-acting reserves, leading to frequency dip. Recommend reviewing Battery Scheduling tutorials."
            
        assessment = OperatorAssessment(
            training_session_id=session_id,
            scenario_score=scenario_score,
            decision_score=decision_score,
            final_grade=grade,
            passed=passed,
            metrics_json=metrics,
            ai_feedback=ai_notes
        )
        
        db.add(assessment)
        
        # Handle Certification Mode
        if passed and (session.is_certification_mode or combined_score >= 80.0):
            cert_level = f"{difficulty} Grid Operator Certification"
            # Prevent duplicate certifications for same level
            existing_cert = db.query(Certification).filter(
                Certification.trainee_username == session.trainee_username,
                Certification.certification_level == cert_level
            ).first()
            
            if not existing_cert:
                cert = Certification(
                    trainee_username=session.trainee_username,
                    certification_level=cert_level,
                    session_id=session.id
                )
                db.add(cert)
                logger.info(f"Issued certification '{cert_level}' to {session.trainee_username}")
        
        # Update Trainee Long-term Analytics
        analytics = db.query(TraineeAnalytics).filter(TraineeAnalytics.trainee_username == session.trainee_username).first()
        if not analytics:
            analytics = TraineeAnalytics(
                trainee_username=session.trainee_username,
                training_progress=1.0,
                average_score=combined_score,
                completion_rate=1.0 if passed else 0.0,
                average_response_time=float(avg_resp_secs),
                decision_accuracy=decision_accuracy,
                weak_areas_json=["Grid Congestion"] if combined_score < 80 else [],
                improvement_trends_json=[combined_score]
            )
            db.add(analytics)
        else:
            # Recalculate rolling averages
            analytics.training_progress += 1.0
            analytics.average_score = round(((analytics.average_score * (analytics.training_progress - 1)) + combined_score) / analytics.training_progress, 2)
            passed_count = (analytics.completion_rate * (analytics.training_progress - 1)) + (1 if passed else 0)
            analytics.completion_rate = round(passed_count / analytics.training_progress, 2)
            analytics.average_response_time = round(((analytics.average_response_time * (analytics.training_progress - 1)) + avg_resp_secs) / analytics.training_progress, 2)
            analytics.decision_accuracy = round(((analytics.decision_accuracy * (analytics.training_progress - 1)) + decision_accuracy) / analytics.training_progress, 2)
            
            # Record scores history
            trends = list(analytics.improvement_trends_json or [])
            trends.append(combined_score)
            analytics.improvement_trends_json = trends
            
            # Dynamically update weak areas
            weak = list(analytics.weak_areas_json or [])
            if grid_stability < 75.0 and "Grid Stability" not in weak:
                weak.append("Grid Stability")
            if carbon_reduction < 75.0 and "Carbon Ramping" not in weak:
                weak.append("Carbon Ramping")
            if grid_stability >= 85.0 and "Grid Stability" in weak:
                weak.remove("Grid Stability")
            analytics.weak_areas_json = weak
            
        session.status = "GRADED"
        session.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(assessment)
        
        return assessment

