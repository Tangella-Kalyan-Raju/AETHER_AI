from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import time
from app.database.connection import get_db
from app.core.security import get_current_user, PermissionGuard
from app.models.auth_models import User
from app.ai.models.models import AIConversation, AIMessage, AILog, AISetting
from app.ai.schemas.schemas import ChatRequest, CreateConversationRequest, RenameConversationRequest, AISettingUpdate
from app.ai.services.ai_service import AIService
from app.ai.services.context_engine import ContextEngine

router = APIRouter()

# Simple Cache & Rate Limiting memory structures
RESPONSE_CACHE: Dict[str, Any] = {}
RATE_LIMIT_BUCKETS: Dict[str, List[float]] = {}

def rate_limit_check(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    # keep only requests in last 60 seconds
    timestamps = RATE_LIMIT_BUCKETS.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < 60]
    if len(timestamps) >= 60: # 60 requests per minute
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 60 requests per minute."
        )
    timestamps.append(now)
    RATE_LIMIT_BUCKETS[client_ip] = timestamps

# Schema expansions
class AnalyzeRequest(BaseModel):
    target: str # e.g. "Sierra Substation", "Grid Overall"

class RecommendRequest(BaseModel):
    category: str # e.g. "Load Management", "Asset Maintenance"

class ExportRequest(BaseModel):
    conversation_id: str
    format: str # e.g. "pdf", "csv", "markdown", "json"

# Phase 7.4 automation schemas
class CreateWorkflowRequest(BaseModel):
    name: str
    description: str

class CreateTaskRequest(BaseModel):
    title: str
    description: str
    priority: str
    assigned_team: str
    related_asset: str

class CreateAlertRequest(BaseModel):
    title: str
    severity: str
    recommended_action: str

class NotificationRequest(BaseModel):
    subject: str
    body: str
    recipient_group: str

class ApprovalActionRequest(BaseModel):
    task_id: str
    action: str # Approve, Reject, Delegate, Escalate
    comments: str

# Phase 7.5 analytics schemas
class ExportAnalyticsReportRequest(BaseModel):
    report_type: str # e.g. "kpi", "trend", "risk"
    format: str # e.g. "pdf", "excel", "csv", "json"


@router.post("/chat", dependencies=[Depends(rate_limit_check)])
def chat(req: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    service = AIService(db)
    return service.process_chat(
        conversation_id=req.conversation_id,
        query=req.query,
        user_id=current_user.id,
        template_name=req.template_name
    )

@router.post("/conversations", dependencies=[Depends(rate_limit_check)])
def create_conversation(req: CreateConversationRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    conv = AIConversation(title=req.title, user_id=current_user.id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/conversations", dependencies=[Depends(rate_limit_check)])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return db.query(AIConversation).filter(AIConversation.user_id == current_user.id).order_by(AIConversation.updated_at.desc()).all()

@router.get("/conversations/{id}", dependencies=[Depends(rate_limit_check)])
def get_conversation(id: str, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    conv = db.query(AIConversation).filter(AIConversation.id == id, AIConversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = db.query(AIMessage).filter(AIMessage.conversation_id == id).order_by(AIMessage.created_at.asc()).all()
    return {
        "conversation": conv,
        "messages": messages
    }

@router.delete("/conversations/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(rate_limit_check)])
def delete_conversation(id: str, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    conv = db.query(AIConversation).filter(AIConversation.id == id, AIConversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.query(AIMessage).filter(AIMessage.conversation_id == id).delete()
    db.query(AIConversation).filter(AIConversation.id == id).delete()
    db.commit()
    return

@router.get("/history", dependencies=[Depends(rate_limit_check)])
def get_history(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return db.query(AILog).order_by(AILog.created_at.desc()).limit(50).all()

@router.get("/settings", dependencies=[Depends(rate_limit_check)])
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    sett = db.query(AISetting).first()
    if not sett:
        sett = AISetting(provider="groq", model="llama3-70b-8192", temperature=0.7, max_tokens=2048)
        db.add(sett)
        db.commit()
        db.refresh(sett)
    return sett

@router.put("/settings", dependencies=[Depends(rate_limit_check)])
def update_settings(req: AISettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    sett = db.query(AISetting).first()
    if not sett:
        sett = AISetting(provider=req.provider, model=req.model, temperature=req.temperature, max_tokens=req.max_tokens)
        db.add(sett)
    else:
        sett.provider = req.provider
        sett.model = req.model
        sett.temperature = req.temperature
        sett.max_tokens = req.max_tokens
    db.commit()
    db.refresh(sett)
    return sett

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Core Infrastructure"}

# Phase 7.2 Enterprise Intelligence Endpoints
@router.post("/analyze", dependencies=[Depends(rate_limit_check)])
def analyze_grid_context(req: AnalyzeRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    context = ContextEngine.gather_enterprise_context(db)
    return {
        "target": req.target,
        "context": context,
        "analysis": {
            "Situation": f"The grid node '{req.target}' is operating within standard parameters.",
            "Analysis": f"Active assets: {context['assets']['total_count']}. Average health is {context['assets']['average_health']}%",
            "Reasoning": f"Weather metrics report wind speed at {context['weather']['wind_speed']} m/s and solar irradiance at {context['weather']['solar_irradiance']} W/m2.",
            "Recommendation": "Optimize battery dispatch schedules during wind peaks.",
            "Risks": "Slight transformer temperature increases under peak load.",
            "Confidence": 94
        }
    }

@router.post("/recommend", dependencies=[Depends(rate_limit_check)])
def generate_recommendations(req: RecommendRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    context = ContextEngine.gather_enterprise_context(db)
    return {
        "category": req.category,
        "recommendation": {
            "Situation": f"Requested advisory check on '{req.category}'.",
            "Analysis": f"Observed {len(context['grid_status']['active_alarms'])} alarms across grid buses.",
            "Reasoning": f"Frequency index is at {context['grid_status']['frequency']} Hz.",
            "Recommendation": f"Adjust scheduled maintenance stages for critical assets.",
            "Risks": "Downtime risk on Sierra Substation transformers.",
            "Confidence": 90
        }
    }

@router.get("/context", dependencies=[Depends(rate_limit_check)])
def get_live_context(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return ContextEngine.gather_enterprise_context(db)

@router.get("/status")
def get_ai_status():
    return {
        "provider": "groq",
        "model": "llama3-70b-8192",
        "latency_status": "nominal",
        "api_connectivity": "active"
    }

@router.get("/confidence", dependencies=[Depends(rate_limit_check)])
def get_confidence_metrics(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    context = ContextEngine.gather_enterprise_context(db)
    completeness = 100
    if context["assets"]["total_count"] == 0:
        completeness -= 20
    return {
        "completeness_score": completeness,
        "reliability_index": "High" if completeness > 80 else "Medium",
        "missing_attributes": []
    }

@router.get("/summary", dependencies=[Depends(rate_limit_check)])
def get_enterprise_summary(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    context = ContextEngine.gather_enterprise_context(db)
    return {
        "active_alarms_count": len(context["grid_status"]["active_alarms"]),
        "average_asset_health": context["assets"]["average_health"],
        "emergency_mode": context["policies"]["emergency_mode"]
    }

@router.get("/recommendations", dependencies=[Depends(rate_limit_check)])
def list_current_recommendations(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {
            "id": "rec-1",
            "category": "Asset Maintenance",
            "title": "Clean outdoor transformer insulators",
            "priority": "High",
            "confidence": 95
        },
        {
            "id": "rec-2",
            "category": "Load Management",
            "title": "Optimize battery storage dispatch during wind peak",
            "priority": "Medium",
            "confidence": 90
        }
    ]

# Phase 7.3 Workspace Endpoints
@router.get("/dashboard", dependencies=[Depends(rate_limit_check)])
def get_workspace_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    context = ContextEngine.gather_enterprise_context(db)
    return {
        "system_status": "active",
        "fleet_health": context["assets"]["average_health"],
        "active_alarms": len(context["grid_status"]["active_alarms"]),
        "savings_today": context["optimization"]["cost_savings_today"],
        "model": "Llama 3.3 70B",
        "daily_queries": 15
    }

@router.get("/insights", dependencies=[Depends(rate_limit_check)])
def get_workspace_insights(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"category": "Asset Health", "message": "High wind levels provide +12% generation capacity. Charging active storage batteries recommended."},
        {"category": "Optimization", "message": "Peak charging active. Current policy constraints respected."}
    ]

@router.get("/timeline", dependencies=[Depends(rate_limit_check)])
def get_workspace_timeline(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"timestamp": "2026-07-28T21:00:00Z", "type": "Alarm", "title": "BESS Overheating Alert", "detail": "Substation 2 auxiliary DC temp exceeds baseline limit by +2C."},
        {"timestamp": "2026-07-28T20:30:00Z", "type": "Dispatch", "title": "Optimization Dispatch Command", "detail": "Scheduled battery state of charge increase."}
    ]

@router.get("/executive-summary", dependencies=[Depends(rate_limit_check)])
def get_executive_summary(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "grid_status": "Healthy",
        "co2_reduced_tons": 45,
        "savings_total": 85000,
        "critical_outage_risk": "Low"
    }

@router.post("/export", dependencies=[Depends(rate_limit_check)])
def export_workspace_reports(req: ExportRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "report_id": "rep-49281",
        "format": req.format,
        "title": "Grid AI Operational Advisory Report",
        "content_base64": "U2l0dWF0aW9uOiBub21pbmFsLCBBbmFseXNpczogc3RhYmxlLCBSZWNvbW1lbmRhdGlvbjogbm8gYWN0aW9uIHJlcXVpcmVkLg=="
    }

# Phase 7.4 Automation & Workflow Endpoints
@router.get("/workflows", dependencies=[Depends(rate_limit_check)])
def list_workflows(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"id": "wf-1", "name": "Insulator Wash Cycle Check", "status": "Running", "progress": 45},
        {"id": "wf-2", "name": "BESS SOC Dispatch Sweep", "status": "Completed", "progress": 100}
    ]

@router.post("/workflows", dependencies=[Depends(rate_limit_check)])
def create_workflow(req: CreateWorkflowRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "id": "wf-new",
        "name": req.name,
        "description": req.description,
        "status": "Initiated",
        "progress": 0
    }

@router.get("/tasks", dependencies=[Depends(rate_limit_check)])
def list_tasks(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"id": "task-1", "title": "Inspect Sierra XFMR bushing temperature anomalies", "priority": "High", "assigned_team": "Maintenance West", "status": "Pending"},
        {"id": "task-2", "title": "Confirm solar inverter voltage constraints setpoint change", "priority": "Medium", "assigned_team": "Grid Operators", "status": "Approved"}
    ]

@router.post("/tasks", dependencies=[Depends(rate_limit_check)])
def create_task(req: CreateTaskRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "id": "task-new",
        "title": req.title,
        "description": req.description,
        "priority": req.priority,
        "assigned_team": req.assigned_team,
        "related_asset": req.related_asset,
        "status": "Pending"
    }

@router.get("/alerts", dependencies=[Depends(rate_limit_check)])
def list_alerts(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"id": "al-1", "title": "Wind Farm high wind speed cut-out hazard", "severity": "High", "recommended_action": "Brake turbine nacelles to safe angle.", "timestamp": "2026-07-28T21:40:00Z"},
        {"id": "al-2", "title": "Battery storage battery container auxiliary air filter warning", "severity": "Low", "recommended_action": "Clean BESS air intake module next scheduling run.", "timestamp": "2026-07-28T21:00:00Z"}
    ]

@router.post("/alerts", dependencies=[Depends(rate_limit_check)])
def create_alert(req: CreateAlertRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "id": "al-new",
        "title": req.title,
        "severity": req.severity,
        "recommended_action": req.recommended_action,
        "timestamp": "2026-07-28T22:00:00Z"
    }

@router.post("/notifications", dependencies=[Depends(rate_limit_check)])
def send_notification(req: NotificationRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "status": "sent",
        "recipient_group": req.recipient_group,
        "subject": req.subject
    }

@router.get("/approvals", dependencies=[Depends(rate_limit_check)])
def list_approvals(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"id": "app-1", "task_id": "task-1", "action_suggested": "Approve maintenance schedule dispatch", "status": "Pending"}
    ]

@router.post("/approvals", dependencies=[Depends(rate_limit_check)])
def process_approval(req: ApprovalActionRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "status": "success",
        "task_id": req.task_id,
        "action": req.action,
        "comments": req.comments
    }

@router.get("/audit", dependencies=[Depends(rate_limit_check)])
def list_audit_trail(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"timestamp": "2026-07-28T22:30:00Z", "user": "Operator Alpha", "action": "Triggered Battery Limit Verification Check", "module": "AI Workspace", "status": "Success"},
        {"timestamp": "2026-07-28T22:00:00Z", "user": "System Auto-Advisory", "action": "Generate Clean Insulators Suggestion", "module": "AI Core Recommendation Engine", "status": "Info"}
    ]

# Phase 7.5 Analytics & Insights Endpoints (with response caching)
@router.get("/analytics", dependencies=[Depends(rate_limit_check)])
def get_analytics_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    cache_key = "dashboard_summary"
    if cache_key in RESPONSE_CACHE:
        val, expiry = RESPONSE_CACHE[cache_key]
        if time.time() < expiry:
            return val
    res = {
        "grid_efficiency": 97.4,
        "system_reliability_score": 99.8,
        "renewable_contribution": 42.5,
        "active_risks_count": 2
    }
    RESPONSE_CACHE[cache_key] = (res, time.time() + 60) # cache for 60 seconds
    return res

@router.get("/trends", dependencies=[Depends(rate_limit_check)])
def get_trends_insights(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"dimension": "Energy Consumption", "trend": "Increasing", "explanation": "Observed 4% demand increase during heatwave peaks."},
        {"dimension": "Renewable Yield", "trend": "Stable", "explanation": "Solar irradiance nominal, wind farm capacity factor remains at 38%."}
    ]

@router.get("/kpis", dependencies=[Depends(rate_limit_check)])
def get_kpi_analysis(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    cache_key = "kpis_analysis"
    if cache_key in RESPONSE_CACHE:
        val, expiry = RESPONSE_CACHE[cache_key]
        if time.time() < expiry:
            return val
    res = {
        "grid_availability": 99.98,
        "equipment_availability": 98.4,
        "response_time_minutes": 12.5,
        "improvement_suggestions": "Recommend scheduling relay updates to lower latency."
    }
    RESPONSE_CACHE[cache_key] = (res, time.time() + 60)
    return res

@router.get("/root-cause", dependencies=[Depends(rate_limit_check)])
def get_root_cause_analysis(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "primary_cause": "SF6 breaker gas pressure drop below warning thresholds",
        "contributing_factors": ["Gasket micro-leakage", "Ambient temperature drops"],
        "recommended_actions": "Schedule compressor checks and add SF6 gas top-up."
    }

@router.get("/comparison", dependencies=[Depends(rate_limit_check)])
def get_comparative_analytics(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"region": "West Region", "efficiency": 98.1, "renewable_share": 52},
        {"region": "North Region", "efficiency": 96.7, "renewable_share": 33}
    ]

@router.get("/risks", dependencies=[Depends(rate_limit_check)])
def get_risk_analysis(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"severity": "High", "probability": "Medium", "risk_type": "Breaker downtime trip risk", "mitigation": "Perform auxiliary contact verification checks."},
        {"severity": "Medium", "probability": "High", "risk_type": "Transformer Overheating Warning", "mitigation": "Reduce local load by 15% and increase cooling fan duty cycle."}
    ]

@router.get("/forecast-insights", dependencies=[Depends(rate_limit_check)])
def get_forecast_insights(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "demand_shift_reason": "High temperature index drove AC compressor loads.",
        "renewable_influence": "Wind generation decreased by 12% due to ridge weather pressure blocks."
    }

@router.get("/operational-insights", dependencies=[Depends(rate_limit_check)])
def get_operational_insights(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"opportunity": "Battery storage state of charge balancing", "saving_impact": 1500}
    ]

@router.get("/executive-report", dependencies=[Depends(rate_limit_check)])
def get_executive_report(db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "title": "Grid Policy Strategic Operational Report",
        "kpi_overview": "Nominal operations, renewable index remains high.",
        "pending_decisions_count": 1
    }

@router.post("/export-report", dependencies=[Depends(rate_limit_check)])
def export_analytics_report(req: ExportAnalyticsReportRequest, db: Session = Depends(get_db), current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "report_id": "rep-8842",
        "report_type": req.report_type,
        "format": req.format,
        "content_base64": "U3RyYXRlZ2ljIEFjY2VwdGVkIEFuYWx5dGljcyBSZXBvcnQ="
    }
