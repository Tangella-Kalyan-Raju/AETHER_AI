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
            "admin:view": "Global administration permissions check."
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
                "assets:manage", "policies:view", "policies:compile", "settings:view"
            ],
            "Operations Engineer": [
                "dashboard:view", "grid:view", "grid:control", "assets:view",
                "policies:view", "settings:view"
            ],
            "Policy Analyst": [
                "dashboard:view", "grid:view", "policies:view", "policies:compile",
                "policies:deploy", "reports:view", "reports:create"
            ],
            "Viewer": [
                "dashboard:view", "reports:view"
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

        db.commit()

        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Critical error during database seeding: {e}")
        raise e
    finally:
        db.close()
