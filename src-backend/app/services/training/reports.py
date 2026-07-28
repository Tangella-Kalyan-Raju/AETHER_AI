import csv
import io
from sqlalchemy.orm import Session
from app.models.training_models import TrainingSession, OperatorAssessment, Certification, TraineeAnalytics

class TrainingReportGenerator:
    """
    Generates training performance reports (Individual, Team, Scenario, Decision, Certification, AI Mentor)
    and formats them as CSV or simulated Excel files.
    """
    
    @staticmethod
    def generate_csv(report_type: str, db: Session, username: str) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        
        if report_type == "individual":
            writer.writerow(["Report", "Individual Operator Performance Report"])
            writer.writerow(["Trainee Username", username])
            writer.writerow([])
            writer.writerow(["Session ID", "Difficulty", "Status", "Scenario Score", "Decision Score", "Grade", "Passed", "Completed At"])
            
            sessions = db.query(TrainingSession).filter(TrainingSession.trainee_username == username).all()
            for s in sessions:
                assess = s.assessment
                writer.writerow([
                    s.id,
                    s.difficulty_level,
                    s.status,
                    assess.scenario_score if assess else "N/A",
                    assess.decision_score if assess else "N/A",
                    assess.final_grade if assess else "N/A",
                    assess.passed if assess else "N/A",
                    s.completed_at.isoformat() if s.completed_at else "N/A"
                ])
                
        elif report_type == "team":
            writer.writerow(["Report", "Team Collaboration Performance Report"])
            writer.writerow([])
            writer.writerow(["Session ID", "Team ID", "Trainee Username", "Difficulty", "Scenario Score", "Decision Score", "Passed"])
            
            # Find all sessions associated with a team
            sessions = db.query(TrainingSession).filter(TrainingSession.team_id.isnot(None)).all()
            for s in sessions:
                assess = s.assessment
                writer.writerow([
                    s.id,
                    s.team_id,
                    s.trainee_username,
                    s.difficulty_level,
                    assess.scenario_score if assess else "N/A",
                    assess.decision_score if assess else "N/A",
                    assess.passed if assess else "N/A"
                ])
                
        elif report_type == "scenario":
            writer.writerow(["Report", "Scenario Completion & Quality Report"])
            writer.writerow([])
            writer.writerow(["Session ID", "Trainee", "Difficulty", "Stability Score", "Renewable Util %", "Carbon Reduc %", "Efficiency %", "Total Scenario Score"])
            
            sessions = db.query(TrainingSession).filter(TrainingSession.status == "GRADED").all()
            for s in sessions:
                assess = s.assessment
                if assess and assess.metrics_json:
                    m = assess.metrics_json
                    writer.writerow([
                        s.id,
                        s.trainee_username,
                        s.difficulty_level,
                        m.get("grid_stability", "N/A"),
                        m.get("renewable_utilization", "N/A"),
                        m.get("carbon_reduction", "N/A"),
                        m.get("operational_efficiency", "N/A"),
                        assess.scenario_score
                    ])
                    
        elif report_type == "decision":
            writer.writerow(["Report", "Decision Quality and Risk Awareness Report"])
            writer.writerow([])
            writer.writerow(["Session ID", "Trainee", "Difficulty", "Decision Accuracy", "AI Rec Usage", "Risk Score", "Cost Awareness", "Decision Score"])
            
            sessions = db.query(TrainingSession).filter(TrainingSession.status == "GRADED").all()
            for s in sessions:
                assess = s.assessment
                if assess and assess.metrics_json:
                    m = assess.metrics_json
                    writer.writerow([
                        s.id,
                        s.trainee_username,
                        s.difficulty_level,
                        m.get("decision_accuracy", "N/A"),
                        m.get("ai_recommendation_usage", "N/A"),
                        m.get("risk_assessment", "N/A"),
                        m.get("cost_awareness", "N/A"),
                        assess.decision_score
                    ])
                    
        elif report_type == "certification":
            writer.writerow(["Report", "Digital Certification Status Report"])
            writer.writerow([])
            writer.writerow(["Certification ID", "Trainee Username", "Certification Level", "Issued At", "Passed Session ID"])
            
            certs = db.query(Certification).all()
            for c in certs:
                writer.writerow([
                    c.id,
                    c.trainee_username,
                    c.certification_level,
                    c.issued_at.isoformat() if c.issued_at else "N/A",
                    c.session_id or "N/A"
                ])
                
        elif report_type == "mentor":
            writer.writerow(["Report", "AI Mentor Feedback & Recommendations Report"])
            writer.writerow([])
            writer.writerow(["Session ID", "Trainee", "Difficulty", "Combined Score", "AI Mentor Commentary"])
            
            sessions = db.query(TrainingSession).filter(TrainingSession.status == "GRADED").all()
            for s in sessions:
                assess = s.assessment
                if assess:
                    comb = (assess.scenario_score + assess.decision_score) / 2
                    writer.writerow([
                        s.id,
                        s.trainee_username,
                        s.difficulty_level,
                        f"{comb:.2f}%",
                        assess.ai_feedback or "No feedback recorded."
                    ])
        else:
            writer.writerow(["Error", f"Unknown report type: {report_type}"])
            
        return output.getvalue()

    @staticmethod
    def generate_excel(report_type: str, db: Session, username: str) -> bytes:
        # Mock Excel generation by writing CSV structure and encoding to bytes 
        # (This avoids heavy dependencies like pandas/openpyxl while fulfilling export criteria)
        csv_str = TrainingReportGenerator.generate_csv(report_type, db, username)
        return csv_str.encode('utf-8-sig')
