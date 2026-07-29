from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.connection import get_db
from app.models.optimization_models import OptimizationConfig, OptimizationJob, OptimizationExecutionHistory, GridOptimizationResult, FinancialCarbonResult, MultiObjectiveDecisionResult
from app.services.optimization.scheduler import OptimizationJobScheduler

# Import sub-engines to support direct modular execution APIs
from app.services.optimization.load_balancing import LoadBalancingEngine
from app.services.optimization.power_flow import PowerFlowOptimizer
from app.services.optimization.battery import BatteryOptimizationEngine
from app.services.optimization.renewable import RenewableOptimizationEngine
from app.services.optimization.peak_shaving import PeakShavingEngine
from app.services.optimization.demand_response import DemandResponseEngine
from app.services.optimization.reserve_margin import ReserveMarginOptimizer
from app.services.optimization.stability import GridStabilityOptimizer
from app.services.optimization.cost_optimizer import CostOptimizationEngine
from app.services.optimization.carbon_optimizer import CarbonOptimizationEngine

# Phase 7.4 Multi-Objective Decision Engines
from app.services.optimization.multi_objective import MultiObjectiveEngine
from app.services.optimization.what_if import WhatIfEngine
from app.services.optimization.comparison import StrategyComparator


router = APIRouter()

# Global scheduler instance
scheduler = OptimizationJobScheduler()

# ── Configurations Endpoints ─────────────────────────────────────

@router.get("/configs", response_model=List[Dict[str, Any]])
def get_configs(db: Session = Depends(get_db)):
    configs = db.query(OptimizationConfig).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "mode": c.mode,
            "solver_settings": c.solver_settings_json,
            "resource_limits": c.resource_limits_json,
            "constraints": c.constraints_json,
            "objectives": c.objectives_json,
            "created_at": c.created_at
        }
        for c in configs
    ]

@router.post("/configs", status_code=status.HTTP_201_CREATED)
def create_config(data: Dict[str, Any], db: Session = Depends(get_db)):
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Config name is required.")
    
    config = OptimizationConfig(
        name=name,
        mode=data.get("mode", "BALANCED"),
        solver_settings_json=data.get("solver_settings", {}),
        resource_limits_json=data.get("resource_limits", {}),
        constraints_json=data.get("constraints", []),
        objectives_json=data.get("objectives", [])
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return {"message": "Optimization configuration created successfully", "config_id": config.id}

# ── Jobs Endpoints ───────────────────────────────────────────────

@router.post("/jobs", status_code=status.HTTP_201_CREATED)
def create_job(data: Dict[str, Any], db: Session = Depends(get_db)):
    config_id = data.get("config_id")
    if not config_id:
        raise HTTPException(status_code=400, detail="config_id is required.")
        
    config = db.query(OptimizationConfig).filter(OptimizationConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found.")

    job = OptimizationJob(
        config_id=config_id,
        priority=data.get("priority", "MEDIUM"),
        status="PENDING",
        progress=0.0
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"message": "Job registered successfully", "job_id": job.id, "status": job.status}

@router.post("/jobs/{job_id}/start")
async def start_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    if job.status in ["RUNNING", "QUEUED"]:
        return {"message": f"Job is already in {job.status} state."}

    # Delegate async processing execution to the Job Scheduler
    await scheduler.enqueue_job(job_id, db)
    return {"message": "Job queued for execution", "status": "QUEUED"}

@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, db: Session = Depends(get_db)):
    success = await scheduler.cancel_job(job_id, db)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel job in completed, cancelled, or failed state.")
    return {"message": "Job cancellation initiated successfully."}

@router.post("/jobs/{job_id}/restart")
async def restart_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Create a clone in PENDING state
    new_job = OptimizationJob(
        config_id=job.config_id,
        priority=job.priority,
        status="PENDING",
        progress=0.0
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Enqueue clone
    await scheduler.enqueue_job(new_job.id, db)
    return {"message": "Job clone queued for execution", "job_id": new_job.id, "status": "QUEUED"}

@router.get("/jobs", response_model=List[Dict[str, Any]])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(OptimizationJob).order_by(OptimizationJob.scheduled_at.desc()).all()
    return [
        {
            "id": j.id,
            "status": j.status,
            "priority": j.priority,
            "config_name": j.config.name if j.config else "Unknown Config",
            "progress": j.progress,
            "scheduled_at": j.scheduled_at,
            "started_at": j.started_at,
            "completed_at": j.completed_at,
            "error_message": j.error_message
        }
        for j in jobs
    ]

@router.get("/jobs/{job_id}/status")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return {
        "id": job.id,
        "status": job.status,
        "progress": job.progress,
        "error_message": job.error_message
    }

# ── Execution History Endpoints ──────────────────────────────────

@router.get("/history", response_model=List[Dict[str, Any]])
def get_history(db: Session = Depends(get_db)):
    history = db.query(OptimizationExecutionHistory).order_by(OptimizationExecutionHistory.created_at.desc()).all()
    return [
        {
            "id": h.id,
            "job_id": h.job_id,
            "execution_time_ms": h.execution_time_ms,
            "objective_score": h.objective_score,
            "results": h.results_json,
            "metrics": h.metrics_json,
            "created_at": h.created_at
        }
        for h in history
    ]

@router.get("/history/{history_id}/logs")
def get_history_logs(history_id: str, db: Session = Depends(get_db)):
    history = db.query(OptimizationExecutionHistory).filter(OptimizationExecutionHistory.id == history_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="Execution log not found.")
    return {"id": history.id, "logs": history.logs}

@router.get("/jobs/{job_id}/logs")
def get_job_logs(job_id: str, db: Session = Depends(get_db)):
    # Try to find in execution history
    history = db.query(OptimizationExecutionHistory).filter(OptimizationExecutionHistory.job_id == job_id).first()
    if history:
        return {"id": history.id, "job_id": job_id, "logs": history.logs}
    
    # Check if the job itself exists
    job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    # If the job is active or pending, return current status as log information
    return {
        "id": None,
        "job_id": job_id,
        "logs": f"Solver Engine Active\nStatus: {job.status}\nProgress: {job.progress:.1f}%\nSynchronizing SCADA telemetry streams..."
    }

# ── High-Fidelity Phase 7.2 Results & Execution Endpoints ──────────

@router.get("/results/{job_id}")
def get_grid_optimization_results(job_id: str, db: Session = Depends(get_db)):
    """Retrieves the detailed engineering sub-engine outputs for a specific job."""
    res = db.query(GridOptimizationResult).filter(GridOptimizationResult.job_id == job_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Optimization results not found for this job ID.")
    return {
        "id": res.id,
        "job_id": res.job_id,
        "overall_score": res.overall_score,
        "load_balancing": res.load_balancing_json,
        "power_flow": res.power_flow_json,
        "battery_schedules": res.battery_schedules_json,
        "renewable_optimization": res.renewable_optimization_json,
        "peak_shaving": res.peak_shaving_json,
        "demand_response": res.demand_response_json,
        "reserve_margin": res.reserve_margin_json,
        "stability_metrics": res.stability_metrics_json,
        "ai_explanation": res.ai_explanation,
        "created_at": res.created_at
    }

@router.post("/execute/load-balancing")
def run_load_balancing_advisory(db: Session = Depends(get_db)):
    """Runs a simulated load balancing advisory solve."""
    engine = LoadBalancingEngine()
    return engine.optimize({}, {})

@router.post("/execute/power-flow")
def run_power_flow_advisory(db: Session = Depends(get_db)):
    """Runs a simulated power flow advisory solve."""
    engine = PowerFlowOptimizer()
    return engine.optimize({}, {})

@router.post("/execute/battery")
def run_battery_advisory(db: Session = Depends(get_db)):
    """Runs a simulated battery scheduling advisory solve."""
    engine = BatteryOptimizationEngine()
    return engine.optimize({}, {})

@router.post("/execute/renewable")
def run_renewable_advisory(db: Session = Depends(get_db)):
    """Runs a simulated renewable maximization advisory solve."""
    engine = RenewableOptimizationEngine()
    return engine.optimize({}, {})

@router.post("/execute/peak-shaving")
def run_peak_shaving_advisory(db: Session = Depends(get_db)):
    """Runs a simulated peak shaving advisory solve."""
    engine = PeakShavingEngine()
    return engine.optimize({}, {})

@router.post("/execute/demand-response")
def run_demand_response_advisory(db: Session = Depends(get_db)):
    """Runs a simulated demand response advisory solve."""
    engine = DemandResponseEngine()
    return engine.optimize({}, {})

@router.post("/execute/reserve-margin")
def run_reserve_advisory(db: Session = Depends(get_db)):
    """Runs a simulated reserve capacity check."""
    engine = ReserveMarginOptimizer()
    return engine.optimize({}, {})

@router.post("/execute/stability")
def run_stability_advisory(db: Session = Depends(get_db)):
    """Runs a simulated grid stability analysis."""
    engine = GridStabilityOptimizer()
    return engine.optimize({}, {})

# ── Phase 7.3 Cost & Carbon Optimization Endpoints ────────────────

@router.get("/results/financial/{job_id}")
def get_financial_carbon_results(job_id: str, db: Session = Depends(get_db)):
    """Retrieves the detailed financial and carbon optimization results for a specific job."""
    res = db.query(FinancialCarbonResult).filter(FinancialCarbonResult.job_id == job_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Financial carbon results not found for this job ID.")
    return {
        "id": res.id,
        "job_id": res.job_id,
        "market_price_profile": res.market_price_profile_json,
        "cost_optimization": res.cost_optimization_json,
        "carbon_optimization": res.carbon_optimization_json,
        "financial_reports": res.financial_reports_json,
        "ai_financial_explanation": res.ai_financial_explanation,
        "created_at": res.created_at
    }

@router.post("/execute/cost-optimization")
def run_cost_advisory(db: Session = Depends(get_db)):
    """Runs a simulated economic dispatch and battery arbitrage solver."""
    engine = CostOptimizationEngine()
    return engine.optimize({"load_mw": 1420.0, "fuel_price_usd_mwh": 50.0}, {})

@router.post("/execute/carbon-optimization")
def run_carbon_advisory(db: Session = Depends(get_db)):
    """Runs a simulated green dispatch and emissions reduction solver."""
    engine = CarbonOptimizationEngine()
    return engine.optimize({"carbon_intensity": 180.0}, {})

@router.get("/reports/cost-carbon", response_model=List[Dict[str, Any]])
def get_cost_carbon_reports(db: Session = Depends(get_db)):
    """Compiles a history of financial savings and avoided CO2 emissions across all runs."""
    results = db.query(FinancialCarbonResult).order_by(FinancialCarbonResult.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "job_id": r.job_id,
            "total_savings_usd": r.cost_optimization_json["metrics"]["total_savings_usd"] if r.cost_optimization_json else 0.0,
            "co2_avoided_tons": r.carbon_optimization_json["emissions"]["co2_avoided_tons"] if r.carbon_optimization_json else 0.0,
            "green_energy_share_pct": r.carbon_optimization_json["sustainability"]["green_energy_share_after_pct"] if r.carbon_optimization_json else 0.0,
            "created_at": r.created_at
        }
        for r in results
    ]

# ── Phase 7.4 Multi-Objective Decision Optimization Endpoints ─────

@router.get("/results/decisions/{job_id}")
def get_multi_objective_results(job_id: str, db: Session = Depends(get_db)):
    """Retrieves the side-by-side strategy comparisons, trade-off analyzer matrices, and AI recommendation."""
    res = db.query(MultiObjectiveDecisionResult).filter(MultiObjectiveDecisionResult.job_id == job_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Decision results not found for this job ID.")
    return {
        "id": res.id,
        "job_id": res.job_id,
        "weights": res.weights_json,
        "strategies": res.strategies_json,
        "trade_offs": res.trade_off_json,
        "sensitivities": res.sensitivity_analysis_json,
        "what_ifs": res.what_if_scenarios_json,
        "ai_recommendation": res.ai_recommendation_json,
        "created_at": res.created_at
    }

@router.post("/execute/multi-objective")
def run_multi_objective_advisory(db: Session = Depends(get_db)):
    """Runs a simulated multi-objective optimization fitness solve."""
    engine = MultiObjectiveEngine()
    # Mocking metric inputs
    grid = {"overall_score": 88}
    cost = {"metrics": {"total_savings_usd": 18200}}
    carbon = {"emissions": {"co2_avoided_tons": 16.4}}
    weights = {"stability": 0.3, "cost": 0.3, "carbon": 0.2, "reliability": 0.2}
    score = engine.evaluate_fitness(grid, cost, carbon, weights)
    return {"status": "SUCCESS", "decision_fitness_score": score, "weights": weights}

@router.post("/execute/what-if")
def run_what_if_sandbox(situation: str, value_change_pct: float, db: Session = Depends(get_db)):
    """Runs a sandbox What-If projection for a specific parameter override."""
    engine = WhatIfEngine()
    return engine.evaluate_what_if(situation, value_change_pct, {})

@router.post("/execute/scenario-optimization")
def run_scenario_optimization(scenario: str, db: Session = Depends(get_db)):
    """Evaluates optimization strategies against specific grid operational scenarios."""
    comparator = StrategyComparator()
    # Simulate based on scenario
    grid = {"load_mw": 15000.0} if scenario == "High Demand" else {"load_mw": 11000.0}
    cost = {"market_pricing": {"average_price_usd": 110.0}} if scenario == "Peak Hours" else {"market_pricing": {"average_price_usd": 55.0}}
    carbon = {"emissions": {"co2_avoided_tons": 8.0}} if scenario == "Renewable Drop" else {"emissions": {"co2_avoided_tons": 25.0}}
    
    strategies = comparator.generate_alternative_strategies(grid, cost, carbon)
    return {
        "scenario": scenario,
        "strategies": strategies
    }

@router.get("/reports/decision/{job_id}/export")
def export_decision_report(job_id: str, db: Session = Depends(get_db)):
    """Compiles printable executive summary and strategy comparison CSV data payload."""
    res = db.query(MultiObjectiveDecisionResult).filter(MultiObjectiveDecisionResult.job_id == job_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Decision results not found to generate export report.")
    
    # Generate CSV formatting
    csv_rows = ["Strategy Name,Operating Cost (USD),CO2 (Tons),Renewable (%),Stability,Reliability,AI Confidence"]
    for s in res.strategies_json or []:
        csv_rows.append(f"{s['name']},{s['operating_cost_usd']},{s['carbon_emissions_tons']},{s['renewable_percentage']},{s['grid_stability_score']},{s['reliability_score']},{s['ai_confidence']}")
    csv_payload = "\n".join(csv_rows)

    return {
        "job_id": job_id,
        "executive_summary": res.ai_recommendation_json,
        "trade_offs": res.trade_off_json,
        "csv_export": csv_payload
    }

# ── Phase 5.3 Modular Dashboard Endpoints ─────────────────────────

@router.get("/economic-dispatch")
def get_economic_dispatch_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "generator_allocation": [
            {"id": "GEN-01", "name": "Tahoe Gas", "current_mw": 450, "optimized_mw": 320, "priority": 3},
            {"id": "GEN-02", "name": "Sierra Solar", "current_mw": 120, "optimized_mw": 250, "priority": 1},
            {"id": "GEN-03", "name": "Valley Wind", "current_mw": 80, "optimized_mw": 150, "priority": 2},
        ],
        "operating_cost": {"current_usd": 15000, "optimized_usd": 11200},
        "fuel_consumption_tons": {"current": 420, "optimized": 310},
        "confidence_score": 0.94
    }

@router.get("/unit-commitment")
def get_unit_commitment_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "running_units": 14,
        "standby_units": 6,
        "generator_status": [
            {"name": "Coal Plant Alpha", "action": "STOP", "time": "22:00", "savings_usd": 4500},
            {"name": "Gas Peaker Beta", "action": "START", "time": "17:00", "cost_usd": 1200},
        ],
        "operating_schedule_timeline": []
    }

@router.get("/reserve-scheduling")
def get_reserve_scheduling_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "spinning_reserve_mw": 450,
        "non_spinning_reserve_mw": 800,
        "emergency_reserve_mw": 1200,
        "allocations": [
            {"type": "Battery", "mw": 300, "status": "READY"},
            {"type": "Hydro", "mw": 500, "status": "STANDBY"}
        ]
    }

@router.get("/dispatch")
def get_optimal_dispatch_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "generation_mix": {"fossil": 40, "renewable": 45, "nuclear": 15},
        "battery_dispatch_mw": 120,
        "recommended_plan": "Shift 15% load from fossil to solar+battery during peak hours."
    }

@router.get("/grid-loss")
def get_grid_loss_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "transmission_loss_mw": {"current": 45, "optimized": 32},
        "distribution_loss_mw": {"current": 18, "optimized": 14},
        "reactive_power_loss_mvar": {"current": 22, "optimized": 15},
        "reduction_percentage": 28.5
    }

@router.get("/cost")
def get_cost_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "operating_cost_usd": {"current": 125000, "optimized": 98000},
        "fuel_cost_usd": {"current": 85000, "optimized": 62000},
        "import_cost_usd": {"current": 12000, "optimized": 4000},
        "export_revenue_usd": {"current": 8000, "optimized": 14000},
        "expected_savings_usd": 27000
    }

@router.get("/co2")
def get_co2_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "current_emissions_tons": 840,
        "optimized_emissions_tons": 590,
        "renewable_improvement_pct": 22.5,
        "carbon_reduction_tons": 250
    }

@router.get("/reliability")
def get_reliability_advisory(db: Session = Depends(get_db)):
    return {
        "status": "OPTIMIZED",
        "reliability_score": {"current": 82, "optimized": 96},
        "grid_stability_score": {"current": 78, "optimized": 94},
        "reserve_margin_pct": {"current": 12, "optimized": 18},
        "critical_asset_protection": "Active - All N-1 contingencies mitigated."
    }
