import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.connection import engine, SessionLocal
from app.models.base import Base
from app.models.auth_models import Organization, User, Role, Permission
from app.models.grid_models import GridAsset, Policy, PolicyVersion, PolicyExecution, Incident, PolicyIntelligence
from app.models.system_models import Notification, Report, AuditLog, ActivityLog, SystemSetting
from app.models.digital_twin_models import Substation, Bus, TransmissionLine, Transformer, Generator, Load, Switch
from app.core.security import get_password_hash
from app.models.dashboard_models import (
    DashboardSummary, WeatherTelemetry, GenerationSourceTelemetry, GenerationHistory,
    DemandHistory, BatteryStatus, GridStatusTelemetry, DashboardAlert, DashboardEvent,
    PolicyHistory, Dataset, DatasetVersion, DatasetRecord,
    GenerationForecast, WeatherForecast, WeatherTimeline, WeatherImpact,
    RenewablePrediction, GenerationInsight, WeatherConfidence, GenerationHealth,
    GenerationCost, CO2Statistic
)
from app.models.decision_models import (
    Decision, DecisionMetadata, DecisionExplanation, DecisionRisk, 
    DecisionOpportunity, DecisionHistory
)
from app.models.dt_foundation_models import (
    DigitalTwin, AssetRegistry, AssetMetadata, AssetState, AssetHealth, GridTopology
)
from app.models.prediction_models import (
    Prediction, PredictionHistory, PredictionConfiguration
)

logger = logging.getLogger("gpo.db")

def init_db():
    """
    Initialize database schema tables dynamically and seeds default system parameters,
    roles, permissions, default organization and default superuser.
    """
    logger.info("Initializing database tables...")
    try:
        # Create all tables registered under the declarative metadata Base
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Critical error creating database tables: {e}")
        raise e

    db: Session = SessionLocal()
    try:
        # 1. Seed Permissions
        permissions_data = {
            "dashboard:view": "Clearance to view the operational telemetry dashboard.",
            "grid:view": "Read-only access to view grid asset topology models.",
            "grid:control": "Permission to run breaker controls or trigger switches.",
            "assets:view": "Access to view physical grid assets inventory.",
            "assets:manage": "Access to create, update, or remove physical grid assets.",
            "policies:view": "Access to view central compiled safety boundary policies.",
            "policies:compile": "Access to compile policy rules syntax files.",
            "policies:deploy": "Access to deploy compiled policy versions to edge substation RTUs.",
            "reports:view": "Access to view generated system operations & compliance reports.",
            "reports:create": "Clearance to generate operations and compliance report logs.",
            "settings:view": "Clearance to view basic system parameters and configurations.",
            "admin:view": "Global administration permissions check.",
            "operations:view": "Access to view operations telemetry events and status.",
            "operations:manage": "Access to manage operations telemetry events and status."
        }

        seeded_perms = {}
        for name, desc in permissions_data.items():
            perm = db.query(Permission).filter(Permission.name == name).first()
            if not perm:
                perm = Permission(name=name, description=desc, status="active")
                db.add(perm)
                db.flush()
                logger.info(f"Seeded permission: {name}")
            seeded_perms[name] = perm

        # 2. Seed Roles and associate permissions
        roles_permissions_map = {
            "Super Admin": list(permissions_data.keys()),
            "Grid Administrator": [
                "dashboard:view", "grid:view", "grid:control", "assets:view",
                "assets:manage", "policies:view", "policies:compile", "settings:view",
                "operations:view", "operations:manage"
            ],
            "Operations Engineer": [
                "dashboard:view", "grid:view", "grid:control", "assets:view",
                "policies:view", "settings:view", "operations:view", "operations:manage"
            ],
            "Policy Analyst": [
                "dashboard:view", "grid:view", "policies:view", "policies:compile",
                "policies:deploy", "reports:view", "reports:create", "operations:view",
                "operations:manage"
            ],
            "Viewer": [
                "dashboard:view", "reports:view", "operations:view"
            ]
        }

        seeded_roles = {}
        for role_name, perms in roles_permissions_map.items():
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=f"{role_name} security profile.", status="active")
                db.add(role)
                db.flush()
                logger.info(f"Seeded role: {role_name}")
            
            # Map permissions
            for p_name in perms:
                p_obj = seeded_perms[p_name]
                if p_obj not in role.permissions_list:
                    role.permissions_list.append(p_obj)
            seeded_roles[role_name] = role

        # 3. Seed Default Organization
        default_org = db.query(Organization).filter(Organization.name == "GPO Corp").first()
        if not default_org:
            default_org = Organization(
                name="GPO Corp",
                description="Grid Policy Orchestrator Global Operations",
                status="active"
            )
            db.add(default_org)
            db.flush()
            logger.info("Seeded default organization: GPO Corp")

        # 4. Seed Default Admin User
        admin_email = "admin@gpo.gov"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_pwd = "admin"
            admin_user = User(
                email=admin_email,
                password_hash=get_password_hash(admin_pwd),
                full_name="Super Admin",
                organization="GPO Corp",
                role="Super Admin",
                organization_id=default_org.id,
                status="active"
            )
            admin_user.roles_list.append(seeded_roles["Super Admin"])
            db.add(admin_user)
            db.flush()
            logger.info(f"Seeded default Super Admin user: {admin_email}")

        # Seed 7 Standard Operating Policies
        policies_to_seed = [
            {
                "name": "Balanced Mode",
                "description": "Provide a balanced grid optimization strategy. Optimizes simultaneously for cost, renewable integration, reliability, battery health, and grid stability.",
                "is_active": True,
                "priority": 1,
                "objective": "BALANCED",
                "weights": {"cost": 0.25, "carbon": 0.25, "stability": 0.25, "reliability": 0.25},
                "constraints": {"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 20.0},
                "ai_explanation": "Balanced Mode distributes weights evenly across all key performance areas, preventing any single metric from compromising general grid reliability.",
                "expected_outcome": "Stable operations with moderate operating costs and standard renewable energy utilization index.",
                "affected_systems": ["Optimization", "Forecasting", "Battery Management"],
                "category": "Operations"
            },
            {
                "name": "Economic Mode",
                "description": "Minimize total grid operational costs by prioritizing low-cost generators and thermal dispatch efficiency.",
                "is_active": False,
                "priority": 2,
                "objective": "MIN_COST",
                "weights": {"cost": 0.80, "carbon": 0.05, "stability": 0.10, "reliability": 0.05},
                "constraints": {"voltage_deviation_pct": 10.0, "thermal_limit_pct": 95.0, "min_soc_pct": 15.0},
                "ai_explanation": "Economic Mode shifts the optimization objective to generator fuel-cost minimization, prioritizing base-load thermal generation over higher-cost solar/wind offsets.",
                "expected_outcome": "Minimized dispatch and line congestion costs, with a slight increase in carbon footprint.",
                "affected_systems": ["Optimization", "Dispatch Planning"],
                "category": "Economics"
            },
            {
                "name": "Green Mode",
                "description": "Maximize renewable utilization (solar and wind) and optimize battery storage dispatch for zero-emission energy yields.",
                "is_active": False,
                "priority": 3,
                "objective": "MAX_RENEWABLES",
                "weights": {"cost": 0.20, "carbon": 0.60, "stability": 0.10, "reliability": 0.10},
                "constraints": {"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 25.0},
                "ai_explanation": "Green Mode prioritizes carbon-free generator dispatch, utilizing battery arbitrage to minimize curtailment of wind and solar units.",
                "expected_outcome": "Maximum renewable penetration index, reduced fossil-fuel combustion, and optimized carbon offsets.",
                "affected_systems": ["Optimization", "Renewable Management", "Battery Management", "Weather Intelligence"],
                "category": "Renewables"
            },
            {
                "name": "Reliability Mode",
                "description": "Maximize grid reliability and redundancy margins, prioritizing voltage stability and component thermal limits.",
                "is_active": False,
                "priority": 4,
                "objective": "MAX_RELIABILITY",
                "weights": {"cost": 0.05, "carbon": 0.05, "stability": 0.50, "reliability": 0.40},
                "constraints": {"voltage_deviation_pct": 2.0, "thermal_limit_pct": 80.0, "min_soc_pct": 30.0},
                "ai_explanation": "Reliability Mode sets strict limits on transformer loading and voltage fluctuations, allocating spinning reserves to absorb sudden contingency events.",
                "expected_outcome": "Highest stability score, low component thermal stress, with increased generation cost.",
                "affected_systems": ["Optimization", "Digital Twin", "SCADA Core"],
                "category": "Safety"
            },
            {
                "name": "Emergency Mode",
                "description": "Safeguard grid infrastructure, isolate faulty segments, and prevent cascading power outages during storms or line failures.",
                "is_active": False,
                "priority": 10,
                "objective": "EMERGENCY_SAFEGUARD",
                "weights": {"cost": 0.00, "carbon": 0.00, "stability": 0.60, "reliability": 0.40},
                "constraints": {"voltage_deviation_pct": 8.0, "thermal_limit_pct": 105.0, "min_soc_pct": 10.0},
                "ai_explanation": "Emergency Mode overrides economic objectives, enabling emergency line loading limits and maximizing active reserve dispatch to maintain critical load demands.",
                "expected_outcome": "Infrastructure protection, fast load shedding if required, and isolated failure containment.",
                "affected_systems": ["Optimization", "Active Alerts", "EMS Console", "DMS Console"],
                "category": "Safety"
            },
            {
                "name": "Peak Demand Mode",
                "description": "Efficiently manage grid stability and peak loads during high-consumption periods using peak shaving and demand response triggers.",
                "is_active": False,
                "priority": 5,
                "objective": "PEAK_SHAVING",
                "weights": {"cost": 0.40, "carbon": 0.10, "stability": 0.30, "reliability": 0.20},
                "constraints": {"voltage_deviation_pct": 5.0, "thermal_limit_pct": 92.0, "min_soc_pct": 20.0},
                "ai_explanation": "Peak Demand Mode initiates battery discharge cycles and alerts demand response nodes to load-shed non-critical loads during peak utility hours.",
                "expected_outcome": "Reduced peak loading on substations and minimized high-price peaking generation purchases.",
                "affected_systems": ["Optimization", "Forecasting", "Battery Management"],
                "category": "Grid Operations"
            },
            {
                "name": "Battery Preservation Mode",
                "description": "Maximize battery storage system lifespan by minimizing temperature stress and limiting Depth of Discharge parameters.",
                "is_active": False,
                "priority": 6,
                "objective": "BATTERY_PRESERVATION",
                "weights": {"cost": 0.30, "carbon": 0.10, "stability": 0.30, "reliability": 0.30},
                "constraints": {"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 40.0},
                "ai_explanation": "Battery Preservation Mode restricts charge/discharge cycling speeds and enforces strict depth-of-discharge boundaries to prevent cell degradation.",
                "expected_outcome": "Extended utility battery lifespan, minimized cell temperatures, with limited peak-shaving capacity.",
                "affected_systems": ["Optimization", "Battery Management"],
                "category": "Asset Lifecycle"
            },
            {
                "name": "CO₂ Reduction Mode",
                "description": "Optimize the dispatch of low-carbon assets and introduce constraints on high-emission thermal plants to minimize greenhouse gas intensity.",
                "is_active": False,
                "priority": 7,
                "objective": "MINIMIZE_CO2",
                "weights": {"cost": 0.30, "carbon": 0.50, "stability": 0.10, "reliability": 0.10},
                "constraints": {"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 20.0},
                "ai_explanation": "CO₂ Reduction Mode introduces carbon emission bounds, dynamically capping the output of coal generation and substituting it with solar/wind and battery reserves.",
                "expected_outcome": "Reduced average g/kWh carbon intensity factor across all corridors.",
                "affected_systems": ["Optimization", "Carbon Tracking", "Dispatch Planning"],
                "category": "Sustainability"
            },
            {
                "name": "Renewable Priority Mode",
                "description": "Maximize the integration of renewable energy sources and ensure zero curtailment for solar and wind generators.",
                "is_active": False,
                "priority": 8,
                "objective": "RENEWABLE_PRIORITY",
                "weights": {"cost": 0.20, "carbon": 0.50, "stability": 0.15, "reliability": 0.15},
                "constraints": {"voltage_deviation_pct": 5.0, "thermal_limit_pct": 90.0, "min_soc_pct": 25.0},
                "ai_explanation": "Renewable Priority Mode adjusts scheduling priorities to accept all available solar and wind output, using battery systems as primary buffers.",
                "expected_outcome": "Near-zero renewable curtailment index under standard weather profiles.",
                "affected_systems": ["Optimization", "Renewable Management", "Battery Management"],
                "category": "Renewables"
            },
            {
                "name": "Grid Stabilization Mode",
                "description": "Focus on maintaining grid frequency and voltage stability during system anomalies or high transient loads.",
                "is_active": False,
                "priority": 9,
                "objective": "GRID_STABILIZATION",
                "weights": {"cost": 0.10, "carbon": 0.05, "stability": 0.65, "reliability": 0.20},
                "constraints": {"voltage_deviation_pct": 3.0, "thermal_limit_pct": 85.0, "min_soc_pct": 30.0},
                "ai_explanation": "Grid Stabilization Mode increases dynamic reserve requirements and coordinates fast-acting battery assets to damp transient power oscillations.",
                "expected_outcome": "Minimization of frequency excursions and voltage deviation bounds across major transmission lines.",
                "affected_systems": ["Optimization", "SCADA Core", "Battery Management"],
                "category": "Safety"
            },
            {
                "name": "Maintenance Mode",
                "description": "Enforce safety boundaries and isolate components to allow safe hardware upgrades and system maintenance procedures.",
                "is_active": False,
                "priority": 1,
                "objective": "MAINTENANCE_SAFETY",
                "weights": {"cost": 0.15, "carbon": 0.05, "stability": 0.40, "reliability": 0.40},
                "constraints": {"voltage_deviation_pct": 4.0, "thermal_limit_pct": 75.0, "min_soc_pct": 35.0},
                "ai_explanation": "Maintenance Mode derates specific branch capacities to allow operational isolation and guarantees safe working clearance bounds.",
                "expected_outcome": "Outage scheduling compliance with minimal disruptions to consumer load feeders.",
                "affected_systems": ["Optimization", "Outage Planning", "Asset Registry"],
                "category": "Safety"
            }
        ]

        for p_data in policies_to_seed:
            exist = db.query(Policy).filter(Policy.name == p_data["name"]).first()
            if not exist:
                policy = Policy(
                    name=p_data["name"],
                    description=p_data["description"],
                    is_active=p_data["is_active"],
                    priority=p_data["priority"],
                    objective=p_data["objective"],
                    weights=p_data["weights"],
                    constraints=p_data["constraints"],
                    ai_explanation=p_data["ai_explanation"],
                    expected_outcome=p_data["expected_outcome"],
                    affected_systems=p_data["affected_systems"],
                    category=p_data.get("category"),
                    organization_id=default_org.id,
                    created_by=admin_user.id,
                    status="active"
                )
                db.add(policy)
                db.flush()
                logger.info(f"Seeded policy operating mode: {p_data['name']}")

        # Seed Policy Intelligence data
        for p_data in policies_to_seed:
            policy = db.query(Policy).filter(Policy.name == p_data["name"]).first()
            if policy:
                intelligence_exist = db.query(PolicyIntelligence).filter(PolicyIntelligence.policy_id == policy.id).first()
                if not intelligence_exist:
                    # Define metric templates based on mode name
                    name_lower = policy.name.lower()
                    
                    if "balanced" in name_lower:
                        adv = ["Maintains a balance across cost, carbon, stability, and reliability", "Low risk profile", "Highly adaptable to normal weather patterns"]
                        dis = ["Does not optimize any single objective to its absolute limit"]
                        emissions = "420.5 g CO₂/kWh"
                        cost = 12450.0
                        renew = 48.7
                        rel = 98.5
                        risk = 12.4
                    elif "economic" in name_lower:
                        adv = ["Minimizes operating costs by utilizing cheapest fuel types", "Reduces spinning reserves costs"]
                        dis = ["Increases carbon footprint significantly due to coal/gas usage", "Lower renewable utilization rate"]
                        emissions = "680.0 g CO₂/kWh"
                        cost = 9800.0
                        renew = 25.0
                        rel = 92.0
                        risk = 35.0
                    elif "green" in name_lower or "renewable" in name_lower:
                        adv = ["Drastically reduces carbon emissions", "Maximizes utility of solar and wind generation"]
                        dis = ["Subject to weather intermittency risks", "High dependence on battery backup reserves"]
                        emissions = "120.0 g CO₂/kWh"
                        cost = 14200.0
                        renew = 88.0
                        rel = 95.0
                        risk = 22.0
                    elif "reliability" in name_lower or "stabilization" in name_lower:
                        adv = ["Enforces strict operating safety margins", "Minimizes component thermal load stress", "Extremely low probability of outages"]
                        dis = ["Significantly higher operational dispatch costs"]
                        emissions = "510.0 g CO₂/kWh"
                        cost = 15800.0
                        renew = 38.0
                        rel = 99.8
                        risk = 4.5
                    elif "emergency" in name_lower:
                        adv = ["Prevents cascading grid collapses and blackouts", "Isolates faults rapidly"]
                        dis = ["Allows high thermal stress levels on assets", "Extremely high operational dispatch costs"]
                        emissions = "820.0 g CO₂/kWh"
                        cost = 24500.0
                        renew = 15.0
                        rel = 99.9
                        risk = 80.0
                    elif "peak" in name_lower:
                        adv = ["Shaves peak demand efficiently", "Reduces congestion charges during critical periods"]
                        dis = ["Increases battery cycle degradation speed during deep discharge"]
                        emissions = "480.0 g CO₂/kWh"
                        cost = 13900.0
                        renew = 42.0
                        rel = 97.2
                        risk = 18.0
                    elif "preservation" in name_lower:
                        adv = ["Maximizes battery asset life cycle length", "Limits deep discharge cycles"]
                        dis = ["Reduces peak demand shaving effectiveness"]
                        emissions = "430.0 g CO₂/kWh"
                        cost = 12900.0
                        renew = 45.0
                        rel = 96.5
                        risk = 10.0
                    elif "co₂" in name_lower or "carbon" in name_lower:
                        adv = ["Directly limits fossil-fuel emissions", "Prioritizes low-carbon footprint generation"]
                        dis = ["Increased generation costs during low solar/wind availability"]
                        emissions = "180.0 g CO₂/kWh"
                        cost = 13800.0
                        renew = 78.0
                        rel = 96.0
                        risk = 16.0
                    elif "maintenance" in name_lower:
                        adv = ["Guarantees safe clearance zones for crews", "Prevents accidents during equipment servicing"]
                        dis = ["Limits transmission line load capacity", "Forces load rerouting and minor load shedding"]
                        emissions = "490.0 g CO₂/kWh"
                        cost = 14900.0
                        renew = 35.0
                        rel = 99.0
                        risk = 15.0
                    else:
                        adv = ["Custom parameters tailored for specific region needs"]
                        dis = ["Requires active monitoring and manual safety checks"]
                        emissions = "450.0 g CO₂/kWh"
                        cost = 13000.0
                        renew = 50.0
                        rel = 97.0
                        risk = 15.0
                        
                    intelligence = PolicyIntelligence(
                        policy_id=policy.id,
                        advantages=adv,
                        disadvantages=dis,
                        emission_impact=emissions,
                        expected_cost=cost,
                        expected_renewable_pct=renew,
                        reliability_score=rel,
                        risk_score=risk
                    )
                    db.add(intelligence)
                    db.flush()
                    logger.info(f"Seeded policy intelligence for: {policy.name}")



        # 5. Seed Digital Twin entities if they don't exist
        from app.models.digital_twin_models import Substation, Bus, TransmissionLine, Transformer, Generator, Load, Switch
        from app.models.system_models import AuditLog

        if not db.query(Substation).first():
            logger.info("Seeding digital twin topology data...")
            
            # Substations
            sierra = Substation(
                name="Sierra Substation",
                description="Primary transmission substation located near Sierra range.",
                latitude=39.5296,
                longitude=-119.8138,
                metadata_json={"voltage_class_kv": 138.0}
            )
            reno = Substation(
                name="Reno Substation",
                description="Distribution substation serving Reno city center.",
                latitude=39.5272,
                longitude=-119.8219,
                metadata_json={"voltage_class_kv": 138.0}
            )
            tahoe = Substation(
                name="Tahoe Substation",
                description="Substation connecting Tahoe hydro generation and battery units.",
                latitude=39.0968,
                longitude=-120.0324,
                metadata_json={"voltage_class_kv": 138.0}
            )
            db.add_all([sierra, reno, tahoe])
            db.flush()  # To populate IDs
            
            # Buses
            sierra_bus_a = Bus(
                name="Sierra Bus A",
                description="Main 138kV bus Sierra Substation",
                base_kv=138.0,
                substation_id=sierra.id
            )
            sierra_bus_b = Bus(
                name="Sierra Bus B",
                description="Medium voltage 13.8kV bus Sierra Substation",
                base_kv=13.8,
                substation_id=sierra.id
            )
            reno_bus_a = Bus(
                name="Reno Bus A",
                description="Main 138kV bus Reno Substation",
                base_kv=138.0,
                substation_id=reno.id
            )
            tahoe_bus_a = Bus(
                name="Tahoe Bus A",
                description="Main 138kV bus Tahoe Substation",
                base_kv=138.0,
                substation_id=tahoe.id
            )
            db.add_all([sierra_bus_a, sierra_bus_b, reno_bus_a, tahoe_bus_a])
            db.flush()
            
            # Transmission Lines
            line_sierra_reno = TransmissionLine(
                name="Sierra-Reno Line 1",
                description="138kV transmission line connecting Sierra and Reno",
                from_bus_id=sierra_bus_a.id,
                to_bus_id=reno_bus_a.id,
                r_pu=0.01,
                x_pu=0.05,
                b_pu=0.02,
                rating_mva=100.0
            )
            line_sierra_tahoe = TransmissionLine(
                name="Sierra-Tahoe Line 1",
                description="138kV transmission line connecting Sierra and Tahoe",
                from_bus_id=sierra_bus_a.id,
                to_bus_id=tahoe_bus_a.id,
                r_pu=0.02,
                x_pu=0.08,
                b_pu=0.03,
                rating_mva=100.0
            )
            db.add_all([line_sierra_reno, line_sierra_tahoe])
            db.flush()
            
            # Transformers
            transformer_sierra = Transformer(
                name="Sierra XFMR 1",
                description="138kV/13.8kV step-down transformer at Sierra Substation",
                from_bus_id=sierra_bus_a.id,
                to_bus_id=sierra_bus_b.id,
                r_pu=0.005,
                x_pu=0.04,
                rating_mva=50.0
            )
            db.add(transformer_sierra)
            db.flush()
            
            # Generators
            gen_sierra = Generator(
                name="Sierra Gas Gen",
                description="Thermal generation unit located at Sierra Substation",
                bus_id=sierra_bus_a.id,
                type="thermal",
                capacity_mw=150.0,
                p_mw=60.0,
                q_mvar=15.0
            )
            gen_tahoe = Generator(
                name="Tahoe Hydro Gen",
                description="Hydroelectric turbine unit at Tahoe Substation",
                bus_id=tahoe_bus_a.id,
                type="hydro",
                capacity_mw=50.0,
                p_mw=30.0,
                q_mvar=5.0
            )
            db.add_all([gen_sierra, gen_tahoe])
            db.flush()
            
            # Loads
            load_reno = Load(
                name="Reno Town Load",
                description="Reno municipal power load center",
                bus_id=reno_bus_a.id,
                p_mw=80.0,
                q_mvar=20.0
            )
            load_sierra = Load(
                name="Sierra Local Load",
                description="Sierra local distribution industrial load",
                bus_id=sierra_bus_b.id,
                p_mw=15.0,
                q_mvar=4.0
            )
            db.add_all([load_reno, load_sierra])
            db.flush()
            
            # Switches
            switch_sierra = Switch(
                name="Sierra Line Breaker",
                description="Breaker switch for Sierra-Reno Line at Sierra Bus",
                line_id=line_sierra_reno.id,
                bus_id=sierra_bus_a.id,
                state="closed"
            )
            switch_tahoe = Switch(
                name="Tahoe Line Breaker",
                description="Breaker switch for Sierra-Tahoe Line at Tahoe Bus",
                line_id=line_sierra_tahoe.id,
                bus_id=tahoe_bus_a.id,
                state="closed"
            )
            db.add_all([switch_sierra, switch_tahoe])
            db.flush()
            
            # Audit Logs (Deterministic recent events for Phase 3.1)
            # Find admin user ID to associate
            admin_user_obj = db.query(User).filter(User.email == admin_email).first()
            admin_id = admin_user_obj.id if admin_user_obj else None
            
            events = [
                AuditLog(user_id=admin_id, action="substation.create", details="Substation 'Sierra Substation' created", status="success"),
                AuditLog(user_id=admin_id, action="substation.create", details="Substation 'Reno Substation' created", status="success"),
                AuditLog(user_id=admin_id, action="substation.create", details="Substation 'Tahoe Substation' created", status="success"),
                AuditLog(user_id=admin_id, action="generator.connect", details="Generator 'Tahoe Hydro Gen' connected to bus 'Tahoe Bus A'", status="success"),
                AuditLog(user_id=admin_id, action="line.update", details="Transmission line 'Sierra-Reno Line 1' updated parameters", status="success"),
                AuditLog(user_id=admin_id, action="asset.validation", details="Digital Twin asset validation passed: 15/15 rules valid", status="success"),
                AuditLog(user_id=admin_id, action="db.sync", details="Digital Twin topology synchronized with physical EMS database", status="success"),
            ]
            db.add_all(events)
            logger.info("Deterministic digital twin topology data seeded.")

        # Seed Phase 1 Dashboard Telemetries
        if not db.query(GenerationSourceTelemetry).first():
            logger.info("Seeding Generation Source Telemetries...")
            sources = [
                GenerationSourceTelemetry(id="solar", name="Solar PV Farms", current_generation=8050.0, capacity=12500.0, percentage=31.9, trend="UP", status="Online", details={"capacity_factor": 64.4}),
                GenerationSourceTelemetry(id="wind", name="Wind Turbine Farms", current_generation=4520.0, capacity=8200.0, percentage=17.9, trend="STABLE", status="Online", details={"capacity_factor": 55.12}),
                GenerationSourceTelemetry(id="hydro", name="Hydroelectric Dam", current_generation=2980.0, capacity=4500.0, percentage=11.8, trend="STABLE", status="Online", details={"capacity_factor": 66.22}),
                GenerationSourceTelemetry(id="nuclear", name="Nuclear Facility", current_generation=3200.0, capacity=4000.0, percentage=12.7, trend="STABLE", status="Online", details={"capacity_factor": 80.0}),
                GenerationSourceTelemetry(id="gas", name="Natural Gas Turbine", current_generation=3100.0, capacity=5000.0, percentage=12.3, trend="UP", status="Online", details={"capacity_factor": 62.0}),
                GenerationSourceTelemetry(id="coal", name="Coal Plant", current_generation=1240.0, capacity=5000.0, percentage=4.9, trend="DOWN", status="Online", details={"capacity_factor": 24.8}),
                GenerationSourceTelemetry(id="battery", name="Battery Storage (SoC)", current_generation=2120.0, capacity=5200.0, percentage=8.4, trend="DOWN", status="Discharging", details={"soc": 82.0, "capacity_limit": 2600.0}),
                GenerationSourceTelemetry(id="imports", name="Interstate Imports", current_generation=0.0, capacity=1000.0, percentage=0.0, trend="STABLE", status="Online", details={}),
                GenerationSourceTelemetry(id="exports", name="Interstate Exports", current_generation=0.0, capacity=1000.0, percentage=0.0, trend="STABLE", status="Online", details={})
            ]
            db.add_all(sources)
            db.flush()

            # Add some history
            for src in sources:
                for i in range(24):
                    db.add(GenerationHistory(source_id=src.id, value=src.current_generation * (0.8 + 0.4 * (i/24.0)), timestamp=datetime.utcnow()))
        
        if not db.query(DashboardSummary).first():
            db.add(DashboardSummary(
                grid_health=98.5,
                current_demand=24820.0,
                current_generation=25210.0,
                reserve_margin=18.6,
                renewable_pct=48.7,
                grid_frequency=49.98,
                co2_emissions=420.5,
                operating_cost=12450.0,
                power_balance=390.0,
                active_policy="Balanced Mode"
            ))
        
        if not db.query(WeatherTelemetry).first():
            db.add(WeatherTelemetry(
                region="Hyderabad, Telangana",
                temperature=32.1,
                humidity=46.0,
                wind_speed=12.0,
                cloud_cover=18.0,
                pressure=1011.0,
                visibility=8.0,
                sunrise="05:42 AM",
                sunset="06:48 PM",
                weather_alerts=[
                    {"title": "Cloud Cover Increase", "time": "14:25", "desc": "Expected in 30 mins"},
                    {"title": "Heat Alert", "time": "13:40", "desc": "Temperature may rise above 34C in next 2 hours"},
                    {"title": "Rain Alert", "time": "12:15", "desc": "Light rain expected in 6 hours"}
                ],
                weather_impact="Cloud cover is increasing rapidly over the next 30 minutes. Solar generation is expected to drop by -1,850 MW.",
                forecast_summary="Mostly Sunny"
            ))

        if not db.query(BatteryStatus).first():
            db.add(BatteryStatus(soc=82.0, charge_rate=0.0, discharge_rate=800.0, health=98.0, remaining_cycles=4820, backup_time=6.4))
            
        if not db.query(GridStatusTelemetry).first():
            db.add(GridStatusTelemetry(
                current_load=24820.0,
                available_capacity=29500.0,
                reserve_margin=18.6,
                operating_region="Northern Regional Grid - NR-01",
                power_flow=390.0,
                current_status="NORMAL",
                grid_frequency=49.98,
                grid_stability=98.5
            ))

        if not db.query(DashboardAlert).first():
            db.add_all([
                DashboardAlert(severity="High", title="Storm Warning", description="High wind speeds approaching western wind farms.", category="Weather"),
                DashboardAlert(severity="Medium", title="Solar Output Reduction", description="Rapid cloud cover buildup detected.", category="Generation"),
                DashboardAlert(severity="Low", title="Generator Offline", description="Unit 4 at Gas Plant offline for maintenance.", category="Assets")
            ])

        if not db.query(DashboardEvent).first():
            db.add_all([
                DashboardEvent(event_type="Weather Updated", description="Weather data updated from OpenWeather API.", severity="info"),
                DashboardEvent(event_type="Policy Changed", description="Active policy switched to Balanced Mode.", severity="info"),
                DashboardEvent(event_type="Dataset Imported", description="Sample Kaggle dataset imported successfully.", severity="success")
            ])

        if not db.query(DemandHistory).first():
            # Seed last 24h demand
            for i in range(24):
                db.add(DemandHistory(value=22000.0 + 3000.0 * (i/24.0), is_forecast=False))
                db.add(DemandHistory(value=22500.0 + 2900.0 * (i/24.0), is_forecast=True))

        from datetime import timedelta
        # Seed Generation Health
        if not db.query(GenerationHealth).first():
            logger.info("Seeding Generation Health stats...")
            db.add_all([
                GenerationHealth(source_id="solar", health_score=98.5, maintenance_status="Nominal", efficiency=94.2),
                GenerationHealth(source_id="wind", health_score=96.1, maintenance_status="Nominal", efficiency=88.5),
                GenerationHealth(source_id="hydro", health_score=99.0, maintenance_status="Nominal", efficiency=92.0),
                GenerationHealth(source_id="nuclear", health_score=100.0, maintenance_status="Nominal", efficiency=98.0),
                GenerationHealth(source_id="gas", health_score=94.5, maintenance_status="Nominal", efficiency=85.0),
                GenerationHealth(source_id="coal", health_score=82.0, maintenance_status="Scheduled Outage (Unit 2)", efficiency=78.2),
                GenerationHealth(source_id="battery", health_score=97.8, maintenance_status="Nominal", efficiency=91.0),
                GenerationHealth(source_id="imports", health_score=100.0, maintenance_status="Nominal", efficiency=100.0),
                GenerationHealth(source_id="exports", health_score=100.0, maintenance_status="Nominal", efficiency=100.0),
            ])

        # Seed Generation Cost
        if not db.query(GenerationCost).first():
            logger.info("Seeding Generation Cost stats...")
            db.add_all([
                GenerationCost(source_id="solar", operating_cost_mwh=12.5),
                GenerationCost(source_id="wind", operating_cost_mwh=18.2),
                GenerationCost(source_id="hydro", operating_cost_mwh=22.0),
                GenerationCost(source_id="nuclear", operating_cost_mwh=28.5),
                GenerationCost(source_id="gas", operating_cost_mwh=65.0),
                GenerationCost(source_id="coal", operating_cost_mwh=45.0),
                GenerationCost(source_id="battery", operating_cost_mwh=8.0),
                GenerationCost(source_id="imports", operating_cost_mwh=50.0),
                GenerationCost(source_id="exports", operating_cost_mwh=42.0),
            ])

        # Seed CO2 Statistics
        if not db.query(CO2Statistic).first():
            logger.info("Seeding CO2 statistics...")
            db.add_all([
                CO2Statistic(source_id="solar", emissions_g_kwh=0.0),
                CO2Statistic(source_id="wind", emissions_g_kwh=0.0),
                CO2Statistic(source_id="hydro", emissions_g_kwh=0.0),
                CO2Statistic(source_id="nuclear", emissions_g_kwh=0.0),
                CO2Statistic(source_id="gas", emissions_g_kwh=420.0),
                CO2Statistic(source_id="coal", emissions_g_kwh=980.0),
                CO2Statistic(source_id="battery", emissions_g_kwh=0.0),
                CO2Statistic(source_id="imports", emissions_g_kwh=150.0),
                CO2Statistic(source_id="exports", emissions_g_kwh=0.0),
            ])

        # Seed Generation Insights
        if not db.query(GenerationInsight).first():
            logger.info("Seeding Generation Insights...")
            db.add_all([
                GenerationInsight(source_id="solar", explanation="Cloud cover is expected to increase by 38%. Solar irradiance will decrease.", recommendation="Increase Hydro output. Battery charging should be delayed.", confidence=96.0, potential_savings=0.0, co2_reduction=0.0),
                GenerationInsight(source_id="wind", explanation="Wind speeds will increase by 15% across major parks.", recommendation="Reduce Gas generation gradually. Maintain Reliability Mode.", confidence=94.0, potential_savings=0.0, co2_reduction=0.0),
                GenerationInsight(source_id="coal", explanation="Current output exceeds expected demand bounds.", recommendation="Reduce dispatch by 300 MW.", confidence=89.0, potential_savings=4.8, co2_reduction=210.0),
                GenerationInsight(source_id="battery", explanation="Battery SOC is at 82%. Forecast demand spike expected within 2 hours.", recommendation="Delay discharge until peak demand.", confidence=95.0, potential_savings=0.0, co2_reduction=0.0),
            ])

        # Seed Weather Confidences
        if not db.query(WeatherConfidence).first():
            logger.info("Seeding Weather Confidences...")
            db.add_all([
                WeatherConfidence(forecast_domain="wind", confidence_score=96.0),
                WeatherConfidence(forecast_domain="solar", confidence_score=91.0),
                WeatherConfidence(forecast_domain="rain", confidence_score=88.0),
                WeatherConfidence(forecast_domain="demand", confidence_score=94.0),
            ])

        # Seed Weather Forecasts
        if not db.query(WeatherForecast).first():
            logger.info("Seeding Weather Forecasts...")
            now = datetime.utcnow()
            for i in range(24):
                db.add(WeatherForecast(target_timestamp=now + timedelta(hours=i), temperature=28.0 + (i%6), wind_speed=12.0 + (i%4), humidity=55.0 - (i%5), pressure=1012.0, cloud_cover=20.0 + (i*1.5), solar_irradiance=600.0 - (i*15), confidence=94.0, forecast_type="24h"))
            for i in range(48):
                db.add(WeatherForecast(target_timestamp=now + timedelta(hours=i), temperature=27.0 + (i%8), wind_speed=11.0 + (i%5), humidity=58.0 - (i%6), pressure=1011.0, cloud_cover=25.0 + (i*1.2), solar_irradiance=580.0 - (i*12), confidence=90.0, forecast_type="48h"))
            for i in range(7):
                db.add(WeatherForecast(target_timestamp=now + timedelta(days=i), temperature=29.0 + (i%4), wind_speed=13.0 + (i%3), humidity=50.0 - (i%4), pressure=1013.0, cloud_cover=15.0 + (i*2), solar_irradiance=650.0 - (i*20), confidence=85.0, forecast_type="7d"))

        # Seed Weather Timelines
        if not db.query(WeatherTimeline).first():
            logger.info("Seeding Weather Timelines...")
            now = datetime.utcnow()
            db.add_all([
                WeatherTimeline(event_time=now - timedelta(hours=2), event_type="Solar Peak", description="Solar radiation reached seasonal peak index", timeline_phase="past"),
                WeatherTimeline(event_time=now - timedelta(hours=1), event_type="Cloud Formation", description="Cumulus cloud layers detected at Western Solar field", timeline_phase="past"),
                WeatherTimeline(event_time=now, event_type="Wind Increase", description="Wind velocities climbing to 14.5 m/s", timeline_phase="current"),
                WeatherTimeline(event_time=now + timedelta(hours=2), event_type="Storm Incoming", description="Severe weather system approaching coastal wind assets", timeline_phase="future"),
                WeatherTimeline(event_time=now + timedelta(hours=4), event_type="Heavy Rain", description="Precipitation limits expected to exceed 12mm/hr", timeline_phase="future"),
                WeatherTimeline(event_time=now + timedelta(hours=8), event_type="Night Cycle", description="Ambient solar yield drops to zero", timeline_phase="future"),
            ])

        # Seed Weather Impacts
        if not db.query(WeatherImpact).first():
            logger.info("Seeding Weather Impacts...")
            db.add_all([
                WeatherImpact(parameter="Cloud Cover", change_type="Increase", impacted_source="solar", mw_variation=-620.0, risk_level="Medium", recommendation="Battery Preservation Mode"),
                WeatherImpact(parameter="Storm Alert", change_type="Exceed Safe Threshold", impacted_source="wind", mw_variation=-740.0, risk_level="Critical", recommendation="Increase Hydro output. Maintain Emergency Reserve."),
                WeatherImpact(parameter="Extreme Heat", change_type="High Demand Spike", impacted_source="demand", mw_variation=850.0, risk_level="High", recommendation="Economic Mode: Increase Gas Generation."),
            ])

        # Seed Renewable Predictions
        if not db.query(RenewablePrediction).first():
            logger.info("Seeding Renewable Predictions...")
            now = datetime.utcnow()
            for i in range(24):
                db.add(RenewablePrediction(timestamp=now + timedelta(hours=i), solar_ghi=620.0 - (i*10), wind_velocity=12.5 + (i*0.2), potential_index=75.0 - (i%5), efficiency=88.0 - (i%4)))

        # Seed Generation Forecasts
        if not db.query(GenerationForecast).first():
            logger.info("Seeding Generation Forecasts...")
            now = datetime.utcnow()
            for src_id in ["solar", "wind", "hydro", "nuclear", "gas", "coal", "battery", "imports", "exports"]:
                for i in range(24):
                    db.add(GenerationForecast(source_id=src_id, target_timestamp=now + timedelta(hours=i), predicted_value=150.0 + (i%5)*20, confidence=92.0 - i, lower_bound=100.0 + (i%5)*15, upper_bound=200.0 + (i%5)*25))

        # Seed Optimization Configurations
        from app.models.optimization_models import OptimizationConfig
        if not db.query(OptimizationConfig).first():
            logger.info("Seeding default Optimization Configurations...")
            db.add_all([
                OptimizationConfig(
                    name="Economic Grid Dispatch",
                    mode="ECONOMIC",
                    solver_settings_json={"max_iterations": 200, "tolerance": 0.001, "timeout_seconds": 60},
                    resource_limits_json={"cpu_cores": 4, "memory_mb": 2048},
                    constraints_json=["Frequency", "Voltage", "ThermalLimits", "CarbonCeiling", "BatterySOC"],
                    objectives_json=[
                        {"name": "CostMinimization", "weight": 0.8},
                        {"name": "CarbonReduction", "weight": 0.4},
                        {"name": "GridStability", "weight": 0.6}
                    ]
                ),
                OptimizationConfig(
                    name="Green Mode Optimization",
                    mode="GREEN",
                    solver_settings_json={"max_iterations": 300, "tolerance": 0.0001, "timeout_seconds": 90},
                    resource_limits_json={"cpu_cores": 6, "memory_mb": 4096},
                    constraints_json=["Frequency", "Voltage", "ThermalLimits", "BatterySOC"],
                    objectives_json=[
                        {"name": "CostMinimization", "weight": 0.2},
                        {"name": "CarbonReduction", "weight": 0.9},
                        {"name": "GridStability", "weight": 0.5}
                    ]
                ),
                OptimizationConfig(
                    name="Balanced Grid Dispatch",
                    mode="BALANCED",
                    solver_settings_json={"max_iterations": 250, "tolerance": 0.0005, "timeout_seconds": 75},
                    resource_limits_json={"cpu_cores": 4, "memory_mb": 3072},
                    constraints_json=["Frequency", "Voltage", "ThermalLimits", "CarbonCeiling", "BatterySOC"],
                    objectives_json=[
                        {"name": "CostMinimization", "weight": 0.5},
                        {"name": "CarbonReduction", "weight": 0.5},
                        {"name": "GridStability", "weight": 0.5}
                    ]
                )
            ])

        # Seed Phase 5.1 Foundation Models
        from app.models.optimization_foundation_models import OptRegistry, SimRegistry, OptConfiguration
        
        if not db.query(OptRegistry).first():
            logger.info("Seeding Optimization Registry...")
            db.add_all([
                OptRegistry(name="Economic Dispatch", description="Minimize short-term operational costs across dispatchable generators.", planned_phase="Phase 5", status="Coming Soon", is_active=False),
                OptRegistry(name="Unit Commitment", description="Determine optimal ON/OFF schedules for generating units.", planned_phase="Phase 5", status="Coming Soon", is_active=False),
                OptRegistry(name="Reserve Scheduling", description="Allocate spinning and non-spinning reserves optimally.", planned_phase="Phase 5", status="Coming Soon", is_active=False),
                OptRegistry(name="Optimal Power Flow (OPF)", description="Non-linear optimization of active/reactive power flows.", planned_phase="Phase 7", status="Coming Soon", is_active=False),
            ])

        if not db.query(SimRegistry).first():
            logger.info("Seeding Simulation Registry...")
            db.add_all([
                SimRegistry(name="Peak Load Stress Test", description="Simulates highest expected demand under extreme weather.", planned_phase="Phase 6", status="Coming Soon", is_active=False),
                SimRegistry(name="N-1 Contingency", description="Simulates grid stability under loss of any single major asset.", planned_phase="Phase 6", status="Coming Soon", is_active=False),
                SimRegistry(name="Renewable Dropout", description="Simulates sudden loss of 50%+ solar/wind generation.", planned_phase="Phase 6", status="Coming Soon", is_active=False),
                SimRegistry(name="Cyber-Attack Islanding", description="Simulates automatic grid islanding under cyber threat.", planned_phase="Phase 6", status="Coming Soon", is_active=False),
            ])

        if not db.query(OptConfiguration).first():
            logger.info("Seeding Foundation Configuration...")
            db.add(
                OptConfiguration(
                    default_region="Global",
                    time_horizon_hours=24,
                    default_confidence=0.90,
                    refresh_interval_ms=5000,
                    cache_settings_json={"enabled": True, "ttl": 3600},
                    optimization_preferences_json={"priority": "cost"}
                )
            )
                  # Seeding Phase 6.1 — Enterprise Asset Intelligence Foundation Models
        from app.models.asset_models import (
            AssetCategory, Asset, AssetLocation, AssetMetadata, AssetHierarchy, AssetConfiguration, AssetHistory, AssetRegistry,
            AssetHealth, AssetMaintenance, InspectionRecord, ServiceRecord, AssetAIInsight, AssetRecommendationHistory, AssetLifecycle
        )

        if not db.query(AssetCategory).first():
            logger.info("Seeding Asset Categories...")
            generation = AssetCategory(name="Generation", description="Assets that generate electricity.")
            storage = AssetCategory(name="Storage", description="Energy storage assets.")
            transmission = AssetCategory(name="Transmission", description="Assets responsible for bulk transfer of electricity.")
            distribution = AssetCategory(name="Distribution", description="Assets responsible for local distribution of electricity.")
            db.add_all([generation, storage, transmission, distribution])
            db.flush()

            logger.info("Seeding Asset Configurations...")
            configs = [
                AssetConfiguration(key="default_region", value="Global", description="Default operational region view"),
                AssetConfiguration(key="asset_visibility", value="All", description="Default visibility of assets"),
                AssetConfiguration(key="category_settings", value="Standard", description="Default asset category profile"),
                AssetConfiguration(key="display_preferences", value="List", description="Default display mode (List/Grid/Tree)"),
                AssetConfiguration(key="sorting_preferences", value="name", description="Default sorting column"),
                AssetConfiguration(key="default_filters", value="all", description="Default filters setting")
            ]
            db.add_all(configs)
            db.flush()

            logger.info("Seeding Assets Registry...")
            # We seed diverse physical grid assets
            # 1. Solar Farm (Generation)
            sol_asset = Asset(asset_id="GPO-SOL-001", name="Sierra Solar Farm", type="Solar Farm", description="150MW utility-scale solar generation facility.", category_id=generation.id)
            db.add(sol_asset)
            db.flush()
            db.add(AssetLocation(asset_id=sol_asset.id, address="Sierra Foothills Road", region="West Region", zone="Zone A", substation="Sierra Substation", latitude=39.54, longitude=-119.85))
            db.add(AssetMetadata(asset_id=sol_asset.id, voltage_level=13.8, capacity=150.0, manufacturer="First Solar", model="Series 6 Plus", serial_number="SOL-99281-A", owner="GPO West Generation LLC", installation_date=datetime(2022, 5, 12), commission_date=datetime(2022, 6, 20), tags=["solar", "renewable", "west"], extra_attributes={"panels_count": 150000}))
            db.add(AssetRegistry(asset_id=sol_asset.id, notes="Registered during initial platform commission."))
            db.add(AssetHistory(asset_id=sol_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=sol_asset.id, health_score=94.0, condition="Nominal", remaining_useful_life=12.5, efficiency=93.5, temperature=42.0, performance_index=95.0, utilization=48.0, availability=99.8))
            db.add(AssetMaintenance(asset_id=sol_asset.id, predicted_failure=datetime(2027, 8, 20), failure_probability=0.03, criticality_score=65.0, maintenance_priority="Low", maintenance_schedule=datetime(2026, 11, 15)))
            db.add(InspectionRecord(asset_id=sol_asset.id, inspected_at=datetime(2026, 1, 10), inspector="John Doe", result="Passed", notes="Inverter filters cleaned, visual check nominal."))
            db.add(ServiceRecord(asset_id=sol_asset.id, serviced_at=datetime(2025, 6, 15), technician="Alice Smith", cost=1500.0, description="Annual panel cleaning and frame alignment check."))
            db.add(AssetAIInsight(
                asset_id=sol_asset.id,
                recommendation="Optimize panel angle tracking profiles during afternoon thermal peaks.",
                reasoning={
                    "why_health_changed": "Health remains stable at 94%. Minimal degradation observed.",
                    "why_failure_probability_increased": "Failure probability is nominal at 3%.",
                    "operator_actions": "Verify tracker gear alignment, clean PV arrays during off-peak hours.",
                    "operational_impact": "Uptime efficiency increase of +1.2% under extreme heat conditions."
                },
                root_cause="Minor inverter thermal throttling under solar noon peak loads.",
                failure_explanation="Excessive heat limits inverter conversion efficiency slightly.",
                maintenance_suggestion="Schedule visual inspections of cooling fans on inverters in Block C.",
                operational_advice="Balance reactive power dispatch offset parameters during peak generation periods.",
                replacement_recommendation="Inverter component refresh planned for Q3 2029.",
                spare_part_recommendation="Inverter cooling fan replacement kits (Block C).",
                confidence_score=0.88,
                priority="Low",
                expected_impact="Avoid active power deratings during high solar irradiance."
            ))
            db.add(AssetRecommendationHistory(asset_id=sol_asset.id, recommendation="Optimize panel angle tracking profiles.", priority="Low", action_taken="Approved", operator_notes="Tracker configuration adjusted successfully."))
            db.add(AssetLifecycle(
                asset_id=sol_asset.id,
                stage="In Service",
                age=4.2,
                remaining_useful_life=12.5,
                maintenance_cost=1500.0,
                replacement_cost=12000000.0,
                downtime_hours=12.5,
                uptime_hours=8740.0,
                availability=99.85,
                performance_benchmark=95.0,
                efficiency_trend=-0.5,
                criticality_ranking=7,
                lifecycle_cost=2500000.0,
                risk_ranking=7
            ))

            # 2. Wind Farm (Generation)
            wind_asset = Asset(asset_id="GPO-WND-002", name="Tehachapi Wind Farm", type="Wind Farm", description="200MW wind turbine park.", category_id=generation.id)
            db.add(wind_asset)
            db.flush()
            db.add(AssetLocation(asset_id=wind_asset.id, address="Tehachapi Pass", region="West Region", zone="Zone B", substation="Tehachapi Collector Sub", latitude=35.12, longitude=-118.31))
            db.add(AssetMetadata(asset_id=wind_asset.id, voltage_level=34.5, capacity=200.0, manufacturer="Vestas", model="V150-4.2MW", serial_number="WND-88392-V", owner="Tehachapi Wind Partners", installation_date=datetime(2021, 3, 10), commission_date=datetime(2021, 4, 15), tags=["wind", "renewable", "west"], extra_attributes={"turbines_count": 80}))
            db.add(AssetRegistry(asset_id=wind_asset.id, notes="Wind generation asset connection established."))
            db.add(AssetHistory(asset_id=wind_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=wind_asset.id, health_score=88.5, condition="Nominal", remaining_useful_life=9.2, efficiency=86.2, temperature=58.0, performance_index=89.0, utilization=62.0, availability=98.5))
            db.add(AssetMaintenance(asset_id=wind_asset.id, predicted_failure=datetime(2026, 12, 10), failure_probability=0.08, criticality_score=70.0, maintenance_priority="Low", maintenance_schedule=datetime(2026, 10, 22)))
            db.add(InspectionRecord(asset_id=wind_asset.id, inspected_at=datetime(2026, 2, 14), inspector="John Doe", result="Passed", notes="Nacelle hydraulic seals look tight, minor gearbox wear."))
            db.add(ServiceRecord(asset_id=wind_asset.id, serviced_at=datetime(2025, 8, 20), technician="Bob Jones", cost=4500.0, description="Lubricated pitch drives, yaw bearings, and replaced generator brushes."))
            db.add(AssetAIInsight(
                asset_id=wind_asset.id,
                recommendation="Monitor gearbox vibration harmonics and yaw drive oil levels.",
                reasoning={
                    "why_health_changed": "Minor bearing wear signature detected in Turbines 12 and 15, health dropped 2%.",
                    "why_failure_probability_increased": "Vibration frequency shifts raise failure risk to 8%.",
                    "operator_actions": "Schedule vibration telemetry calibration and verify lubrication seals.",
                    "operational_impact": "Prevents mechanical fatigue in rotor couplings, saving up to $45k in parts."
                },
                root_cause="High mechanical stress on gearbox bearings during strong seasonal wind peaks.",
                failure_explanation="Micro-pitting on bearing races creates localized friction spikes.",
                maintenance_suggestion="Analyze vibration spectra and extract gearbox oil sample for vibration diagnostics.",
                operational_advice="Limit maximum rotational speed during high gust alerts if yaw system reports torque errors.",
                replacement_recommendation="Gearbox overhaul scheduled for late 2027.",
                spare_part_recommendation="High-speed shaft bearing assembly kit.",
                confidence_score=0.85,
                priority="Medium",
                expected_impact="Minimize mechanical breakdown and structural fatigue."
            ))
            db.add(AssetRecommendationHistory(asset_id=wind_asset.id, recommendation="Inspect yaw drive oil levels.", priority="Medium", action_taken="Pending"))
            db.add(AssetLifecycle(
                asset_id=wind_asset.id,
                stage="In Service",
                age=5.3,
                remaining_useful_life=9.2,
                maintenance_cost=4500.0,
                replacement_cost=25000000.0,
                downtime_hours=42.0,
                uptime_hours=8700.0,
                availability=98.52,
                performance_benchmark=89.0,
                efficiency_trend=-1.2,
                criticality_ranking=6,
                lifecycle_cost=5200000.0,
                risk_ranking=6
            ))

            # 3. Generator (Generation)
            gen_asset = Asset(asset_id="GPO-GEN-003", name="Sierra Gas Gen 1", type="Generator", description="Fast-start peak load gas turbine generator.", category_id=generation.id)
            db.add(gen_asset)
            db.flush()
            db.add(AssetLocation(asset_id=gen_asset.id, address="Industrial Parkway Lot 3", region="West Region", zone="Zone A", substation="Sierra Substation", latitude=39.52, longitude=-119.81))
            db.add(AssetMetadata(asset_id=gen_asset.id, voltage_level=13.8, capacity=100.0, manufacturer="GE Power", model="LM6000", serial_number="GEN-55410-G", owner="GPO Corp", installation_date=datetime(2019, 8, 20), commission_date=datetime(2019, 9, 30), tags=["gas", "thermal", "peaker"], extra_attributes={"generator_type": "Gas Turbine", "fuel_type": "Natural Gas"}))
            db.add(AssetRegistry(asset_id=gen_asset.id, notes="Peak load backup dispatch generator."))
            db.add(AssetHistory(asset_id=gen_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=gen_asset.id, health_score=91.0, condition="Nominal", remaining_useful_life=14.0, efficiency=89.5, temperature=420.0, performance_index=92.0, utilization=15.0, availability=99.9))
            db.add(AssetMaintenance(asset_id=gen_asset.id, predicted_failure=datetime(2028, 5, 12), failure_probability=0.04, criticality_score=85.0, maintenance_priority="Low", maintenance_schedule=datetime(2026, 12, 15)))
            db.add(InspectionRecord(asset_id=gen_asset.id, inspected_at=datetime(2026, 3, 20), inspector="Sarah Connor", result="Passed", notes="Turbine blade boroscope inspection completed, zero cracks."))
            db.add(ServiceRecord(asset_id=gen_asset.id, serviced_at=datetime(2025, 9, 5), technician="Kyle Reese", cost=12000.0, description="Fuel nozzle calibration and combustion chamber liner swap."))
            db.add(AssetAIInsight(
                asset_id=gen_asset.id,
                recommendation="Perform thermal cycle validation and hot gas path sensor recalibration.",
                reasoning={
                    "why_health_changed": "Nominal thermal profile with minor exhaust temperature dispersion. Uptime health 91%.",
                    "why_failure_probability_increased": "Start-stop cycling frequency has stabilized.",
                    "operator_actions": "Recalibrate exhaust gas thermocouples during the next maintenance window.",
                    "operational_impact": "Maintains combustion heat balance, optimizing fuel efficiency by +0.5%."
                },
                root_cause="Minor oxidation on thermocouple connectors in the generator exhaust plenum.",
                failure_explanation="High temperature oxidation causes sensor signal drift over continuous thermal cycles.",
                maintenance_suggestion="Inspect wiring harnesses in the turbine casing and verify sensor insulation.",
                operational_advice="Permit extended cool-down cycles after peak dispatches to minimize thermal shocks.",
                replacement_recommendation="Exhaust plenum thermocouple array replacement in 2028.",
                spare_part_recommendation="Type K thermocouple spare kit.",
                confidence_score=0.90,
                priority="Low",
                expected_impact="Ensure accurate exhaust diagnostics and prevent combustion imbalance alarms."
            ))
            db.add(AssetRecommendationHistory(asset_id=gen_asset.id, recommendation="Verify fuel nozzle calibration.", priority="Low", action_taken="Approved", operator_notes="Nozzle clean-up completed."))
            db.add(AssetLifecycle(
                asset_id=gen_asset.id,
                stage="In Service",
                age=6.8,
                remaining_useful_life=14.0,
                maintenance_cost=12000.0,
                replacement_cost=45000000.0,
                downtime_hours=5.0,
                uptime_hours=8750.0,
                availability=99.92,
                performance_benchmark=92.0,
                efficiency_trend=-0.8,
                criticality_ranking=5,
                lifecycle_cost=8400000.0,
                risk_ranking=5
            ))

            # 4. Battery (Storage)
            bat_asset = Asset(asset_id="GPO-BAT-004", name="Tahoe Battery storage", type="Battery Energy Storage System", description="50MW/200MWh Lithium-ion battery facility.", category_id=storage.id)
            db.add(bat_asset)
            db.flush()
            db.add(AssetLocation(asset_id=bat_asset.id, address="Lake Tahoe Basin Road", region="East Region", zone="Zone C", substation="Tahoe Substation", latitude=39.10, longitude=-120.03))
            db.add(AssetMetadata(asset_id=bat_asset.id, voltage_level=13.8, capacity=50.0, manufacturer="Tesla", model="Megapack 2XL", serial_number="BAT-11002-T", owner="East Grid Storage LLC", installation_date=datetime(2023, 1, 15), commission_date=datetime(2023, 2, 28), tags=["battery", "storage", "east"], extra_attributes={"battery_type": "Lithium-Ion"}))
            db.add(AssetRegistry(asset_id=bat_asset.id, notes="BESS integration completed."))
            db.add(AssetHistory(asset_id=bat_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=bat_asset.id, health_score=96.5, condition="Nominal", remaining_useful_life=8.0, efficiency=91.0, temperature=28.5, performance_index=97.0, utilization=75.0, availability=99.9))
            db.add(AssetMaintenance(asset_id=bat_asset.id, predicted_failure=datetime(2029, 2, 28), failure_probability=0.02, criticality_score=90.0, maintenance_priority="Low", maintenance_schedule=datetime(2026, 9, 10)))
            db.add(InspectionRecord(asset_id=bat_asset.id, inspected_at=datetime(2026, 4, 15), inspector="Jane Miller", result="Passed", notes="Thermal management systems functioning within norm."))
            db.add(ServiceRecord(asset_id=bat_asset.id, serviced_at=datetime(2025, 12, 10), technician="Mark Wahlberg", cost=800.0, description="Coolant top-up and battery management system firmware flash."))
            db.add(AssetAIInsight(
                asset_id=bat_asset.id,
                recommendation="Balance state of charge profiles and monitor cell temperature differentials.",
                reasoning={
                    "why_health_changed": "High performance rating of 96.5%. Cell balancing algorithms are active.",
                    "why_failure_probability_increased": "Lowest grid failure risk at 2%.",
                    "operator_actions": "Initiate automated cell calibration cycle during off-peak load curves.",
                    "operational_impact": "Prevents cell capacity degradation, extending BESS lifespan by +6 months."
                },
                root_cause="Slight impedance variations among parallel cell modules in Rack 5.",
                failure_explanation="Impedance imbalance leads to cell-to-cell voltage dispersion during rapid dispatches.",
                maintenance_suggestion="Run a low-rate balancing cycle and audit HVAC duct efficiency in Rack 5.",
                operational_advice="Avoid continuous high C-rate dispatches when state of charge falls below 10%.",
                replacement_recommendation="Battery module capacity upgrade scheduled for Q4 2030.",
                spare_part_recommendation="HVAC filter kits and battery contactor spares.",
                confidence_score=0.95,
                priority="Low",
                expected_impact="Maintain battery system state-of-health and avoid rapid capacity fade."
            ))
            db.add(AssetRecommendationHistory(asset_id=bat_asset.id, recommendation="Balance state of charge profiles.", priority="Low", action_taken="Approved", operator_notes="BMS rebalancing sequence completed."))
            db.add(AssetLifecycle(
                asset_id=bat_asset.id,
                stage="In Service",
                age=3.4,
                remaining_useful_life=8.0,
                maintenance_cost=800.0,
                replacement_cost=18000000.0,
                downtime_hours=1.2,
                uptime_hours=8753.0,
                availability=99.98,
                performance_benchmark=97.0,
                efficiency_trend=-0.2,
                criticality_ranking=8,
                lifecycle_cost=1100000.0,
                risk_ranking=8
            ))

            # 5. Transformer (Transmission)
            xfmr_asset = Asset(asset_id="GPO-XFMR-005", name="Sierra XFMR 1", type="Transformer", description="138kV/13.8kV primary power transformer.", category_id=transmission.id)
            db.add(xfmr_asset)
            db.flush()
            db.add(AssetLocation(asset_id=xfmr_asset.id, address="Sierra Substation yard", region="West Region", zone="Zone A", substation="Sierra Substation", latitude=39.53, longitude=-119.82))
            db.add(AssetMetadata(asset_id=xfmr_asset.id, voltage_level=138.0, capacity=50.0, manufacturer="Siemens", model="S-50MVA", serial_number="XFMR-22019-S", owner="GPO Corp", installation_date=datetime(2018, 10, 11), commission_date=datetime(2018, 11, 1), tags=["transformer", "substation", "transmission"], extra_attributes={"voltage_rating": "138kV/13.8kV", "transformer_type": "Step-Down"}))
            db.add(AssetRegistry(asset_id=xfmr_asset.id, notes="Substation transformer registered."))
            db.add(AssetHistory(asset_id=xfmr_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=xfmr_asset.id, health_score=68.0, condition="Warning", remaining_useful_life=3.5, efficiency=98.1, temperature=85.0, performance_index=72.0, utilization=85.0, availability=96.2))
            db.add(AssetMaintenance(asset_id=xfmr_asset.id, predicted_failure=datetime(2026, 8, 15), failure_probability=0.28, criticality_score=95.0, maintenance_priority="High", maintenance_schedule=datetime(2026, 8, 2)))
            db.add(InspectionRecord(asset_id=xfmr_asset.id, inspected_at=datetime(2026, 5, 5), inspector="Jane Miller", result="Needs Action", notes="Oil dissolved gas analysis shows high acetylene, potential arc."))
            db.add(ServiceRecord(asset_id=xfmr_asset.id, serviced_at=datetime(2025, 10, 11), technician="Tom Cruise", cost=15000.0, description="Gasket replacement, oil filtration, and bushing cleaning."))
            db.add(AssetAIInsight(
                asset_id=xfmr_asset.id,
                recommendation="Perform transformer oil filtration, degasification, and bushing thermal scan.",
                reasoning={
                    "why_health_changed": "Dissolved gas analysis indicates acetylene levels exceeding critical limits. Health dropped to 68%.",
                    "why_failure_probability_increased": "High concentration of combustible gases raises failure probability to 28%.",
                    "operator_actions": "Schedule immediate offline oil filtration, purge gas, and inspect primary bushings.",
                    "operational_impact": "Prevents catastrophic insulation breakdown or explosive failure at Sierra Substation."
                },
                root_cause="Low-energy dielectric discharge (arcing) within the winding paper insulation matrix.",
                failure_explanation="Moisture absorption and localized heating degrade winding paper, generating flammable gases.",
                maintenance_suggestion="Execute oil degassing, pull insulation paper samples, and perform winding impedance scan.",
                operational_advice="Derate transformer capacity by 20% to prevent temperature-induced winding stress expansion.",
                replacement_recommendation="Winding insulation paper upgrade or unit replacement planned for 2028.",
                spare_part_recommendation="138kV bushing replacement kits and tap changer contact springs.",
                confidence_score=0.92,
                priority="High",
                expected_impact="Restore transformer dielectric strength, prevent high-energy short circuits."
            ))
            db.add(AssetRecommendationHistory(asset_id=xfmr_asset.id, recommendation="Perform transformer oil filtration.", priority="High", action_taken="Pending"))
            db.add(AssetLifecycle(
                asset_id=xfmr_asset.id,
                stage="Maintenance Required",
                age=7.8,
                remaining_useful_life=3.5,
                maintenance_cost=15000.0,
                replacement_cost=8000000.0,
                downtime_hours=120.0,
                uptime_hours=8400.0,
                availability=96.21,
                performance_benchmark=72.0,
                efficiency_trend=-4.5,
                criticality_ranking=1,
                lifecycle_cost=3100000.0,
                risk_ranking=1
            ))

            # 6. Transmission Line (Transmission)
            line_asset = Asset(asset_id="GPO-LINE-006", name="Sierra-Reno Line 1", type="Transmission Line", description="138kV transmission line corridor connecting Sierra and Reno.", category_id=transmission.id)
            db.add(line_asset)
            db.flush()
            db.add(AssetLocation(asset_id=line_asset.id, address="Corridor Route 1A", region="North Region", zone="Zone N", substation="Sierra Substation", latitude=39.52, longitude=-119.81))
            db.add(AssetMetadata(asset_id=line_asset.id, voltage_level=138.0, capacity=100.0, manufacturer="Southwire", model="ACSR 795", serial_number="LN-33041-A", owner="GPO Corp", installation_date=datetime(2015, 6, 15), commission_date=datetime(2015, 7, 1), tags=["transmission-line", "corridor", "north"], extra_attributes={"voltage": 138.0, "length": 45.0, "connected_regions": "West Region, North Region"}))
            db.add(AssetRegistry(asset_id=line_asset.id, notes="Bulk transmission line corridor registered."))
            db.add(AssetHistory(asset_id=line_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=line_asset.id, health_score=92.0, condition="Nominal", remaining_useful_life=18.0, efficiency=96.5, temperature=35.0, performance_index=93.0, utilization=40.0, availability=99.5))
            db.add(AssetMaintenance(asset_id=line_asset.id, predicted_failure=datetime(2027, 9, 12), failure_probability=0.05, criticality_score=80.0, maintenance_priority="Medium", maintenance_schedule=datetime(2026, 9, 15)))
            db.add(InspectionRecord(asset_id=line_asset.id, inspected_at=datetime(2026, 5, 20), inspector="Sarah Connor", result="Passed", notes="Drone thermography check nominal, no hot spots on line joints."))
            db.add(ServiceRecord(asset_id=line_asset.id, serviced_at=datetime(2024, 6, 15), technician="GPO Crew 4", cost=25000.0, description="Vegetation clearing along corridor Route 1A and tower base reinforcement."))
            db.add(AssetAIInsight(
                asset_id=line_asset.id,
                recommendation="Conduct visual corridor inspections for line sag and vegetation clearances.",
                reasoning={
                    "why_health_changed": "High capacity line segment with 92% health. Minor sag variation under summer peak loading.",
                    "why_failure_probability_increased": "Potential wind-induced conductor swing or ground clearance issues.",
                    "operator_actions": "Verify corridor laser scanner survey data to confirm clearance margins.",
                    "operational_impact": "Prevents vegetation contact outages during heavy wind loading events."
                },
                root_cause="Elevated thermal expansion of ACSR Conductor under prolonged peak current dispatch.",
                failure_explanation="Line sag increases with conductor temperature, decreasing clearance to underlying trees.",
                maintenance_suggestion="Conduct LiDAR flyover for clearance profiling and dispatch vegetation trim crews if needed.",
                operational_advice="Utilize Dynamic Line Rating (DLR) to dynamically manage dispatch bounds during wind peaks.",
                replacement_recommendation="Conductor restringing scheduled for 2033.",
                spare_part_recommendation="Line vibration damper spares and conductor splicing sleeves.",
                confidence_score=0.87,
                priority="Medium",
                expected_impact="Prevent line-to-tree flashovers and maximize line transmission limits."
            ))
            db.add(AssetRecommendationHistory(asset_id=line_asset.id, recommendation="Inspect sag clearance.", priority="Medium", action_taken="Dismissed", operator_notes="Vegetation cleared recently, clearances are safe."))
            db.add(AssetLifecycle(
                asset_id=line_asset.id,
                stage="In Service",
                age=11.1,
                remaining_useful_life=18.0,
                maintenance_cost=25000.0,
                replacement_cost=15000000.0,
                downtime_hours=15.0,
                uptime_hours=8700.0,
                availability=99.54,
                performance_benchmark=93.0,
                efficiency_trend=-0.3,
                criticality_ranking=4,
                lifecycle_cost=4120000.0,
                risk_ranking=4
            ))

            # 7. Substation (Distribution)
            sub_asset = Asset(asset_id="GPO-SUB-007", name="Sierra Substation", type="Substation", description="Main transmission and distribution hub substation.", category_id=distribution.id)
            db.add(sub_asset)
            db.flush()
            db.add(AssetLocation(asset_id=sub_asset.id, address="Sierra Foothills Bypass", region="West Region", zone="Zone A", substation="Sierra Substation", latitude=39.5296, longitude=-119.8138))
            db.add(AssetMetadata(asset_id=sub_asset.id, voltage_level=138.0, capacity=150.0, manufacturer="ABB", model="Substation Hub 100", serial_number="SUB-00912-B", owner="GPO Corp", installation_date=datetime(2015, 5, 1), commission_date=datetime(2015, 6, 1), tags=["substation", "hub", "west"], extra_attributes={"voltage_level": 138.0, "feeders_count": 12, "region": "West Region"}))
            db.add(AssetRegistry(asset_id=sub_asset.id, notes="Main regional substation hub."))
            db.add(AssetHistory(asset_id=sub_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=sub_asset.id, health_score=95.0, condition="Nominal", remaining_useful_life=22.0, efficiency=99.2, temperature=38.0, performance_index=96.0, utilization=55.0, availability=99.9))
            db.add(AssetMaintenance(asset_id=sub_asset.id, predicted_failure=datetime(2030, 4, 15), failure_probability=0.01, criticality_score=98.0, maintenance_priority="Low", maintenance_schedule=datetime(2027, 2, 10)))
            db.add(InspectionRecord(asset_id=sub_asset.id, inspected_at=datetime(2026, 6, 12), inspector="John Doe", result="Passed", notes="Substation yard gravel, fencing, and safety markings in excellent condition."))
            db.add(ServiceRecord(asset_id=sub_asset.id, serviced_at=datetime(2025, 5, 1), technician="GPO Crew 1", cost=5000.0, description="Annual grounding grid resistance testing and battery room ventilation repair."))
            db.add(AssetAIInsight(
                asset_id=sub_asset.id,
                recommendation="Perform thermal mapping of switchyard connections and verify auxiliary supply backup systems.",
                reasoning={
                    "why_health_changed": "Optimal substation yard health of 95%. Auxiliary DC systems fully functional.",
                    "why_failure_probability_increased": "Lowest outage signature detected across the West Region grid.",
                    "operator_actions": "Schedule routine battery discharge test for the auxiliary DC panel.",
                    "operational_impact": "Prevents protection relay lockout during control house power outages."
                },
                root_cause="Minor dust build-up on outdoor insulator stacks inside the distribution section.",
                failure_explanation="Contaminants on insulators create leakage current paths, increasing flashover risks during high humidity.",
                maintenance_suggestion="Perform pressure washing on insulator stacks and verify ground connection resistances.",
                operational_advice="No operating limitations. Grid topology routing capacity is 100%.",
                replacement_recommendation="Substation protection panels replacement scheduled for 2035.",
                spare_part_recommendation="Insulator stacks and auxiliary DC chargers.",
                confidence_score=0.91,
                priority="Low",
                expected_impact="Ensure protection systems remain fully operational under contingency events."
            ))
            db.add(AssetRecommendationHistory(asset_id=sub_asset.id, recommendation="Perform thermal mapping of yard.", priority="Low", action_taken="Approved", operator_notes="Thermal scans nominal."))
            db.add(AssetLifecycle(
                asset_id=sub_asset.id,
                stage="In Service",
                age=11.2,
                remaining_useful_life=22.0,
                maintenance_cost=5000.0,
                replacement_cost=65000000.0,
                downtime_hours=0.5,
                uptime_hours=8759.0,
                availability=99.99,
                performance_benchmark=96.0,
                efficiency_trend=-0.1,
                criticality_ranking=9,
                lifecycle_cost=9200000.0,
                risk_ranking=9
            ))

            # 8. Breaker (Distribution)
            brk_asset = Asset(asset_id="GPO-BRK-008", name="Sierra Line Breaker", type="Breaker", description="138kV high-voltage sulfur hexafluoride (SF6) circuit breaker.", category_id=distribution.id)
            db.add(brk_asset)
            db.flush()
            db.add(AssetLocation(asset_id=brk_asset.id, address="Sierra Substation Switchyard", region="West Region", zone="Zone A", substation="Sierra Substation", latitude=39.53, longitude=-119.82))
            db.add(AssetMetadata(asset_id=brk_asset.id, voltage_level=138.0, capacity=2.0, manufacturer="Schneider", model="SF6-138", serial_number="BRK-00234-C", owner="GPO Corp", installation_date=datetime(2020, 2, 14), commission_date=datetime(2020, 3, 1), tags=["breaker", "switchyard", "west"], extra_attributes={"breaker_type": "SF6 gas", "voltage_rating": "138kV"}))
            db.add(AssetRegistry(asset_id=brk_asset.id, notes="Substation line protection breaker."))
            db.add(AssetHistory(asset_id=brk_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=brk_asset.id, health_score=78.0, condition="Warning", remaining_useful_life=2.1, efficiency=99.9, temperature=48.0, performance_index=80.0, utilization=10.0, availability=98.0))
            db.add(AssetMaintenance(asset_id=brk_asset.id, predicted_failure=datetime(2026, 9, 28), failure_probability=0.18, criticality_score=88.0, maintenance_priority="Medium", maintenance_schedule=datetime(2026, 8, 8)))
            db.add(InspectionRecord(asset_id=brk_asset.id, inspected_at=datetime(2026, 6, 18), inspector="Jane Miller", result="Passed", notes="SF6 pressure slightly low but above lock-out threshold."))
            db.add(ServiceRecord(asset_id=brk_asset.id, serviced_at=datetime(2025, 2, 14), technician="Bob Jones", cost=3200.0, description="Mechanism lubrication, contact resistance check, and SF6 gas top-up."))
            db.add(AssetAIInsight(
                asset_id=brk_asset.id,
                recommendation="Top up SF6 gas insulation chambers and verify compressor operating frequency.",
                reasoning={
                    "why_health_changed": "SF6 pressure telemetry reports a slow downward slope, dropping health to 78%.",
                    "why_failure_probability_increased": "Low gas density decreases arc extinguishing capacity, raising failure rate to 18%.",
                    "operator_actions": "Re-pressurize SF6 chamber to 6.2 bar and perform leak detection on seals.",
                    "operational_impact": "Ensures successful arc interruption during distribution fault clearings."
                },
                root_cause="Micro-leakage on the O-ring seals of the primary breaker pressure indicator port.",
                failure_explanation="Elastic seal wear over time allows gas molecular migration, reducing chamber density.",
                maintenance_suggestion="Conduct leak soap spray test and replace indicator gasket seals.",
                operational_advice="Avoid peak feeder loading dispatches if SF6 density indicators enter red alarm zone.",
                replacement_recommendation="Breaker mechanism swap scheduled for late 2028.",
                spare_part_recommendation="Breaker seal kit, SF6 gas cylinder, contact lubrication.",
                confidence_score=0.89,
                priority="Medium",
                expected_impact="Prevent arc restrikes and safeguard substation feeder systems."
            ))
            db.add(AssetRecommendationHistory(asset_id=brk_asset.id, recommendation="Top up SF6 gas density.", priority="Medium", action_taken="Pending"))
            db.add(AssetLifecycle(
                asset_id=brk_asset.id,
                stage="Maintenance Required",
                age=6.4,
                remaining_useful_life=2.1,
                maintenance_cost=3200.0,
                replacement_cost=750000.0,
                downtime_hours=55.0,
                uptime_hours=8600.0,
                availability=98.02,
                performance_benchmark=80.0,
                efficiency_trend=-2.1,
                criticality_ranking=3,
                lifecycle_cost=180000.0,
                risk_ranking=3
            ))

            # 9. Relay (Distribution)
            rly_asset = Asset(asset_id="GPO-RLY-009", name="Sierra Feeder Relay", type="Relay", description="Microprocessor-based feeder protection relay system.", category_id=distribution.id)
            db.add(rly_asset)
            db.flush()
            db.add(AssetLocation(asset_id=rly_asset.id, address="Sierra Control House Rack 2", region="West Region", zone="Zone A", substation="Sierra Substation", latitude=39.529, longitude=-119.813))
            db.add(AssetMetadata(asset_id=rly_asset.id, voltage_level=13.8, capacity=0.01, manufacturer="Schweitzer Engineering Labs", model="SEL-751", serial_number="RLY-11002-S", owner="GPO Corp", installation_date=datetime(2021, 6, 20), commission_date=datetime(2021, 7, 5), tags=["relay", "protection", "west"], extra_attributes={"relay_type": "Overcurrent Protection", "protection_zone": "Feeder 4"}))
            db.add(AssetRegistry(asset_id=rly_asset.id, notes="Feeder level diagnostic protection relay."))
            db.add(AssetHistory(asset_id=rly_asset.id, action="Registration", changed_by="System Seeder", after_value={"status": "active"}))
            db.add(AssetHealth(asset_id=rly_asset.id, health_score=99.5, condition="Nominal", remaining_useful_life=8.5, efficiency=100.0, temperature=30.0, performance_index=99.0, utilization=5.0, availability=100.0))
            db.add(AssetMaintenance(asset_id=rly_asset.id, predicted_failure=datetime(2029, 6, 20), failure_probability=0.005, criticality_score=92.0, maintenance_priority="Low", maintenance_schedule=datetime(2027, 3, 15)))
            db.add(InspectionRecord(asset_id=rly_asset.id, inspected_at=datetime(2026, 7, 5), inspector="Sarah Connor", result="Passed", notes="Secondary injection test nominal, relay operating trip signals correct."))
            db.add(ServiceRecord(asset_id=rly_asset.id, serviced_at=datetime(2025, 6, 20), technician="Kyle Reese", cost=1200.0, description="Re-calibrated overcurrent pick-up curves and updated firmware."))
            db.add(AssetAIInsight(
                asset_id=rly_asset.id,
                recommendation="Perform periodic backup configuration archiving and firmware updates.",
                reasoning={
                    "why_health_changed": "High performance rating of 99.5%. Communication telemetry is fully operational.",
                    "why_failure_probability_increased": "Lowest failure probability on the distribution rack.",
                    "operator_actions": "Verify SCADA telemetry loops and backup settings profiles.",
                    "operational_impact": "Ensures exact fault clearance times matching system protection coordination curves."
                },
                root_cause="None. System diagnostics report 100% logic integrity.",
                failure_explanation="No hardware or software failure mechanisms currently active.",
                maintenance_suggestion="Run a remote secondary injection relay trip test and download event files.",
                operational_advice="None. Relay is fully ready to trip and isolate faults.",
                replacement_recommendation="Relay unit replacement scheduled for 2031.",
                spare_part_recommendation="Backup auxiliary power card.",
                confidence_score=0.99,
                priority="Low",
                expected_impact="Safeguard feeder lines from downstream phase faults."
            ))
            db.add(AssetRecommendationHistory(asset_id=rly_asset.id, recommendation="Archive backup configurations.", priority="Low", action_taken="Approved", operator_notes="Config backup saved to database."))
            db.add(AssetLifecycle(
                asset_id=rly_asset.id,
                stage="In Service",
                age=5.1,
                remaining_useful_life=8.5,
                maintenance_cost=1200.0,
                replacement_cost=8500.0,
                downtime_hours=0.0,
                uptime_hours=8760.0,
                availability=100.0,
                performance_benchmark=99.0,
                efficiency_trend=0.0,
                criticality_ranking=2,
                lifecycle_cost=15000.0,
                risk_ranking=2
            ))

            # Seed Hierarchy links
            # Grid ➔ Region (West Region) ➔ Transmission Network ➔ Substation ➔ Feeder/Asset
            # Let's map parent/child:
            # Substation (Sierra Substation) is parent of Transformer (Sierra XFMR 1), Breaker (Sierra Line Breaker), and Relay (Sierra Feeder Relay)
            db.add(AssetHierarchy(parent_id=None, child_id=sub_asset.id, level="Substation"))
            db.add(AssetHierarchy(parent_id=sub_asset.id, child_id=xfmr_asset.id, level="Transformer"))
            db.add(AssetHierarchy(parent_id=sub_asset.id, child_id=brk_asset.id, level="Breaker"))
            db.add(AssetHierarchy(parent_id=sub_asset.id, child_id=rly_asset.id, level="Relay"))
            
            db.add(AssetHierarchy(parent_id=sub_asset.id, child_id=sol_asset.id, level="Solar Farm"))
            db.add(AssetHierarchy(parent_id=sub_asset.id, child_id=gen_asset.id, level="Generator"))
            
            # Additional Substations mapping
            reno_sub = Asset(asset_id="GPO-SUB-RENO", name="Reno Substation", type="Substation", description="Distribution substation serving Reno city center.", category_id=distribution.id)
            tahoe_sub = Asset(asset_id="GPO-SUB-TAHOE", name="Tahoe Substation", type="Substation", description="Substation connecting Tahoe hydro generation and battery units.", category_id=transmission.id)
            db.add_all([reno_sub, tahoe_sub])
            db.flush()
            
            # Map their hierarchies
            db.add(AssetHierarchy(parent_id=None, child_id=reno_sub.id, level="Substation"))
            db.add(AssetHierarchy(parent_id=None, child_id=tahoe_sub.id, level="Substation"))
            db.add(AssetHierarchy(parent_id=reno_sub.id, child_id=line_asset.id, level="Transmission Line"))
            db.add(AssetHierarchy(parent_id=tahoe_sub.id, child_id=bat_asset.id, level="Battery Energy Storage System"))

        db.commit()

        # Seed AI Prompt templates if not already present
        from app.models.ai_models import AIPromptTemplate
        if not db.query(AIPromptTemplate).first():
            logger.info("Seeding AI Prompt Templates...")
            db.add_all([
                AIPromptTemplate(name="Enterprise System Prompt", template="You are the Enterprise AI Grid Copilot. Return explainable structured recommendations.", version="1.0.0", is_active=True),
                AIPromptTemplate(name="Executive Summary Prompt", template="Summarize key grid metrics and cost trends.", version="1.0.0", is_active=True),
                AIPromptTemplate(name="Recommendation Prompt", template="Provide action items for warnings.", version="1.0.0", is_active=True)
            ])
            db.commit()

        # Ensure digital twin asset registry is synchronized from physical database on startup
        try:
            from app.services.digital_twin.engine import DigitalTwinEngine
            DigitalTwinEngine(db).sync_physical_to_registry()
            db.commit()
            logger.info("Digital twin asset registry synchronized successfully.")
        except Exception as sync_err:
            logger.error(f"Error synchronizing digital twin registry: {sync_err}")

        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Critical error during database seeding: {e}")
        raise e
    finally:
        db.close()
