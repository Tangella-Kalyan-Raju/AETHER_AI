from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import time
from app.database.connection import get_db
from app.core.security import get_current_user, PermissionGuard
from app.models.auth_models import User

router = APIRouter()

# Schema structures
class AgentChatRequest(BaseModel):
    query: str

class AgentPlanRequest(BaseModel):
    objective: str

class AgentApprovalRequest(BaseModel):
    task_id: str
    action: str # Approve, Reject

# Specialized Agents Registry
SPECIALIZED_AGENTS = [
    {"id": "ag-asset", "name": "Asset Intelligence Agent", "role": "Asset Health Analysis & Failures Detection", "status": "Idle"},
    {"id": "ag-grid", "name": "Grid Operations Agent", "role": "Grid Status Monitoring & Power Flow Interpretation", "status": "Idle"},
    {"id": "ag-forecast", "name": "Forecast Intelligence Agent", "role": "Demand & Renewable Output Interpretation", "status": "Idle"},
    {"id": "ag-policy", "name": "Policy Compliance Agent", "role": "Policy Validation & Violation Checking", "status": "Idle"},
    {"id": "ag-maint", "name": "Maintenance Planning Agent", "role": "Maintenance Scheduling Recommendations", "status": "Idle"},
    {"id": "ag-analytics", "name": "Analytics Agent", "role": "KPI & Trend Root Cause Analysis", "status": "Idle"},
    {"id": "ag-exec", "name": "Executive Assistant Agent", "role": "Executive Summaries & Strategic Decisions Support", "status": "Idle"}
]

@router.get("/")
def list_agents(current_user: User = Depends(PermissionGuard("assets:view"))):
    return SPECIALIZED_AGENTS

@router.get("/status")
def get_agents_status(current_user: User = Depends(PermissionGuard("assets:view"))):
    return {a["name"]: a["status"] for a in SPECIALIZED_AGENTS}

@router.get("/tasks")
def list_active_tasks(current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"id": "agt-1", "assigned_agent": "Asset Intelligence Agent", "task": "Determine remaining useful life of West Region transformer", "status": "Working"},
        {"id": "agt-2", "assigned_agent": "Policy Compliance Agent", "task": "Verify emergency charging constraints", "status": "Completed"}
    ]

@router.post("/chat")
def run_planner_chat(req: AgentChatRequest, current_user: User = Depends(PermissionGuard("assets:view"))):
    # Simulated Multi-Agent Planner and collaboration engine output
    return {
        "query": req.query,
        "planner_decision": {
            "subtasks": [
                {"agent": "Grid Operations Agent", "action": "Analyze live bus frequencies"},
                {"agent": "Policy Compliance Agent", "action": "Verify frequency limits constraints compliance"}
            ],
            "consensus_findings": "Grid operations report stable bus parameters; Policy agent confirms alignment with zero violation warnings.",
            "consensus_confidence": 98
        },
        "participating_agents": [
            {"agent": "Grid Operations Agent", "reason": "Analyze bus frequencies and active power loads."},
            {"agent": "Policy Compliance Agent", "reason": "Check current frequency ratings against regulatory templates."}
        ],
        "final_recommendation": "Maintain standard battery dispatch schedules; reserve extra battery capability for peak charging window."
    }

@router.post("/plan")
def create_agent_plan(req: AgentPlanRequest, current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "objective": req.objective,
        "steps": [
            {"step_id": 1, "agent": "Forecast Intelligence Agent", "goal": "Analyze wind and solar output profiles."},
            {"step_id": 2, "agent": "Maintenance Planning Agent", "goal": "Identify overlapping outage maintenance windows."}
        ]
    }

@router.get("/history")
def get_agents_history(current_user: User = Depends(PermissionGuard("assets:view"))):
    return [
        {"timestamp": "2026-07-28T22:40:00Z", "agent": "Executive Assistant Agent", "activity": "Generated Strategic Operational Report Briefing"},
        {"timestamp": "2026-07-28T22:30:00Z", "agent": "Analytics Agent", "activity": "Completed Root Cause Diagnostics check for breaker trip event"}
    ]

@router.get("/monitoring")
def get_agents_monitoring_metrics(current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "active_agents_count": len(SPECIALIZED_AGENTS),
        "total_planner_runs": 85,
        "total_tokens_consumed": 142000,
        "average_latencies_ms": {
            "Asset Intelligence Agent": 420,
            "Grid Operations Agent": 380,
            "Forecast Intelligence Agent": 510
        },
        "provider_usage": {"groq": 100}
    }

@router.post("/approve")
def approve_agent_task(req: AgentApprovalRequest, current_user: User = Depends(PermissionGuard("assets:view"))):
    return {"status": "success", "task_id": req.task_id, "action": "Approved", "user": current_user.email}

@router.post("/reject")
def reject_agent_task(req: AgentApprovalRequest, current_user: User = Depends(PermissionGuard("assets:view"))):
    return {"status": "success", "task_id": req.task_id, "action": "Rejected", "user": current_user.email}

@router.get("/dashboard")
def get_agents_dashboard_summary(current_user: User = Depends(PermissionGuard("assets:view"))):
    return {
        "agents": SPECIALIZED_AGENTS,
        "queue_status": "nominal",
        "cpu_usage_pct": 12.4,
        "success_rate_pct": 99.4
    }
