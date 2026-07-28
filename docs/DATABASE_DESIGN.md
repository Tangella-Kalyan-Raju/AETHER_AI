# Grid Policy Orchestrator (GPO)
## Database & Schema Design

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Principal Database Architect
*   **Phase:** Phase 0.8
*   **Last Updated:** July 22, 2026
*   **Purpose:** Defines relational tables, indexes, data caching, lifecycle retention rules, and cryptographic security protocols.

---

## Table of Contents
*   [1. Database Overview](#1-database-overview)
    *   [1.1 Database Philosophy](#11-database-philosophy)
    *   [1.2 Data Architecture Goals](#12-data-architecture-goals)
    *   [1.3 Storage Strategy](#13-storage-strategy)
    *   [1.4 Design Principles](#14-design-principles)
*   [2. Database Technology](#2-database-technology)
*   [3. Entity Relationship Overview](#3-entity-relationship-overview)
*   [4. Database Schema](#4-database-schema)
    *   [4.1 Authentication Tables](#41-authentication-tables)
    *   [4.2 System Tables](#42-system-tables)
    *   [4.3 Simulation Tables](#43-simulation-tables)
    *   [4.4 Policy Tables](#44-policy-tables)
    *   [4.5 AI Subsystem Tables](#45-ai-subsystem-tables)
    *   [4.6 Analytics & Reporting Tables](#46-analytics--reporting-tables)
    *   [4.7 Logically Added Enterprise Tables](#47-logically-added-enterprise-tables)
*   [5. Relationships](#5-relationships)
    *   [5.1 One-to-One Relationships](#51-one-to-one-relationships)
    *   [5.2 One-to-Many Relationships](#52-one-to-many-relationships)
    *   [5.3 Many-to-Many Relationships](#53-many-to-many-relationships)
*   [6. Indexing Strategy](#6-indexing-strategy)
*   [7. Naming Conventions](#7-naming-conventions)
*   [8. Seed Data Strategy](#8-seed-data-strategy)
*   [9. Data Lifecycle](#9-data-lifecycle)
*   [10. Performance Strategy](#10-performance-strategy)
*   [11. Security](#11-security)
*   [12. Future Scalability](#12-future-scalability)
*   [13. Related Documents](#13-related-documents)
*   [14. Revision History](#14-revision-history)

---

## 1. Database Overview

### 1.1 Database Philosophy
GPO separates relational transactional consistency from analytical telemetry pipelines. Core configurations, users, and audit files are governed by ACID transactional requirements, while high-frequency data streams (e.g., millisecond line updates) are handled asynchronously using in-memory caches and timeseries partitions to prevent write bottlenecks.

### 1.2 Data Architecture Goals
*   **Write Speed:** Support ingestion of thousands of grid telemetry inputs per second.
*   **Auditability:** Maintain an unalterable trail of system configurations, compiled rules, and overrides.
*   **AI Context Support:** Enable fast semantic lookup of utility documents for RAG systems.
*   **NERC CIP Compliance:** Protect access data, encrypt credentials, and log configuration changes.

### 1.3 Storage Strategy
*   *Relational Data:* Stored in a primary transactional database for consistent configuration management.
*   *Telemetry & Logs:* Stored in partition-optimized databases to handle time-series logs.
*   *Compliance Vectors:* Stored in a vector database to enable semantic text queries.
*   *Configuration Archives:* Policy files and reports are archived in secure object storage.

### 1.4 Design Principles
*   *Normalize Configuration:* Normalize core schemas to prevent update anomalies.
*   *Partition Logs:* Partition event tables by date to maintain fast query speeds as data grows.
*   *Unalterable Auditing:* Implement append-only patterns with hash verification for security logs.
*   *Zero Orpan Records:* Apply cascading deletes and constraint gates to enforce data integrity.

---

## 2. Database Technology

*   **Primary Relational Database:** **PostgreSQL**
    *   *Rationale:* High reliability, native support for UUIDs, JSONB fields, and extensions (e.g., `TimescaleDB` for time-series logs).
*   **Vector Database:** **Qdrant**
    *   *Rationale:* High performance vector lookup, optimized filtering, and developer-friendly REST/gRPC interfaces for RAG compliance modules.
*   **Cache Layer:** **Redis**
    *   *Rationale:* Sub-millisecond performance, built-in support for pub/sub events, and key-value storage for active agent state cache.
*   **Object/File Storage:** **MinIO / AWS S3**
    *   *Rationale:* Encrypted object storage for archiving generated compliance reports and original CAD schematics.

---

## 3. Entity Relationship Overview

GPO's schema is structured around six core logical domains: User Authentication, System Logs, Grid Simulation, Policy Governance, Multi-Agent AI, and Analytics.

```
+-------------------+      +-------------------+      +-------------------+
|    auth_users     |----->|    auth_sessions  |      |   audit_logs      |
+---------+---------+      +-------------------+      +---------+---------+
          |                                                     ^
          | 1:N                                             1:N | Records
          v                                                     | Actions
+---------+---------+      +-------------------+                |
|user_roles_junction|      |    grid_assets    |----------------+
+---------+---------+      +---------+---------+
          |                          | 1:N
          | N:1                      v
          v                +---------+---------+      +-------------------+
|    auth_roles     |      |    grid_nodes     |<---->|    agent_memory   |
+-------------------+      +---------+---------+      +-------------------+
                                     | 1:1                      ^
                                     v                          | 1:N
                           +---------+---------+                |
                           |   ai_agents       |----------------+
                           +---------+---------+
                                     | 1:N
                                     v
                           +---------+---------+      +-------------------+
                           |  decision_history |----->|   explanations    |
                           +-------------------+      +-------------------+
```

---

## 4. Database Schema

### 4.1 Authentication Tables

#### 4.1.1 `auth_users`
*   **Purpose:** Stores user profile credentials and active account statuses.
*   **Description:** The core user account table tracking utility personnel logins.
*   **Primary Key:** `id` (UUID, Auto-generated).
*   **Foreign Keys:** None.
*   **Important Fields:** `email` (VARCHAR, Unique), `password_hash` (VARCHAR), `employee_id` (VARCHAR), `is_active` (BOOLEAN), `mfa_secret` (VARCHAR, Encrypted).
*   **Relationships:** One-to-Many with `auth_sessions`, Many-to-Many with `auth_roles`.
*   **Expected Record Volume:** <1,000 records.
*   **Notes:** Encryption required for personal fields (e.g., names, emails).

#### 4.1.2 `auth_roles`
*   **Purpose:** Defines user role categories.
*   **Description:** Security roles mapping access permissions (e.g., Operator, Engineer).
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** None.
*   **Important Fields:** `role_name` (VARCHAR, Unique), `description` (TEXT).
*   **Relationships:** Many-to-Many with `auth_users`, Many-to-Many with `auth_permissions`.
*   **Expected Record Volume:** <20 records.
*   **Notes:** Pre-seeded during system initialization.

#### 4.1.3 `auth_permissions`
*   **Purpose:** Defines granular access rules.
*   **Description:** System actions and access rules (e.g., `READ_TELEMETRY`, `DEPLOY_POLICY`).
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** None.
*   **Important Fields:** `permission_key` (VARCHAR, Unique), `description` (TEXT).
*   **Relationships:** Many-to-Many with `auth_roles`.
*   **Expected Record Volume:** <100 records.
*   **Notes:** System defined; changes require administrator clearance.

#### 4.1.4 `auth_sessions`
*   **Purpose:** Tracks active user authentication sessions.
*   **Description:** Session metadata and token details.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `user_id` (UUID) references `auth_users(id)` on delete cascade.
*   **Important Fields:** `token_hash` (VARCHAR), `ip_address` (VARCHAR), `user_agent` (VARCHAR), `created_at` (TIMESTAMP), `expires_at` (TIMESTAMP).
*   **Relationships:** Many-to-One with `auth_users`.
*   **Expected Record Volume:** <5,000 records.
*   **Notes:** Session records are deleted on logout or expiration.

---

### 4.2 System Tables

#### 4.2.1 `audit_logs`
*   **Purpose:** Records all operator commands and system changes.
*   **Description:** Append-only log table to satisfy compliance audit requirements.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `user_id` (UUID) references `auth_users(id)` on delete set null.
*   **Important Fields:** `action_type` (VARCHAR), `subsystem` (VARCHAR), `payload_before` (JSONB), `payload_after` (JSONB), `block_hash` (VARCHAR), `created_at` (TIMESTAMP).
*   **Relationships:** Many-to-One with `auth_users`.
*   **Expected Record Volume:** ~5,000,000 records.
*   **Notes:** Append-only database rules prevent deletion of audit log entries.

#### 4.2.2 `system_notifications`
*   **Purpose:** Stores system alerts, notifications, and status messages.
*   **Description:** Centralized log for system-wide alarms and notifications.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** None.
*   **Important Fields:** `severity` (VARCHAR), `title` (VARCHAR), `message` (TEXT), `is_dismissed` (BOOLEAN), `triggered_at` (TIMESTAMP).
*   **Relationships:** Many-to-One with `grid_nodes` (if linked to an asset).
*   **Expected Record Volume:** ~1,000,000 records.
*   **Notes:** Automatically partitioned by date.

#### 4.2.3 `system_settings`
*   **Purpose:** Stores global platform settings and default constants.
*   **Description:** Key-value configuration store for application settings.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** None.
*   **Important Fields:** `setting_key` (VARCHAR, Unique), `setting_value` (TEXT), `updated_at` (TIMESTAMP).
*   **Relationships:** None.
*   **Expected Record Volume:** <100 records.
*   **Notes:** Updates are logged to `audit_logs`.

---

### 4.3 Simulation Tables

#### 4.3.1 `sim_digital_twins`
*   **Purpose:** Stores configuration models for the grid network.
*   **Description:** Defines layout structure, lines, and baseline metrics for the emulated grid.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** None.
*   **Important Fields:** `model_name` (VARCHAR), `topology_schema` (JSONB), `is_active` (BOOLEAN).
*   **Relationships:** One-to-Many with `grid_assets`.
*   **Expected Record Volume:** <50 records.
*   **Notes:** Serves as the configuration model for simulations.

#### 4.3.2 `grid_assets`
*   **Purpose:** Registers physical grid assets.
*   **Description:** Base table for physical transformers, generator plants, and battery units.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `digital_twin_id` (UUID) references `sim_digital_twins(id)` on delete cascade.
*   **Important Fields:** `asset_code` (VARCHAR, Unique), `asset_type` (VARCHAR), `substation_id` (UUID), `manufacturer` (VARCHAR).
*   **Relationships:** Many-to-One with `sim_digital_twins`, One-to-Many with `grid_nodes`.
*   **Expected Record Volume:** ~10,000 records.
*   **Notes:** Deleting an asset cascades to its child nodes.

#### 4.3.3 `grid_nodes`
*   **Purpose:** Monitors telemetry metrics for grid terminals.
*   **Description:** Individual connection points within grid assets (e.g., specific transformers).
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `asset_id` (UUID) references `grid_assets(id)` on delete cascade.
*   **Important Fields:** `node_code` (VARCHAR), `nominal_voltage` (FLOAT), `active_load` (FLOAT), `current_frequency` (FLOAT).
*   **Relationships:** Many-to-One with `grid_assets`, One-to-One with `ai_agents`.
*   **Expected Record Volume:** ~50,000 records.
*   **Notes:** Telemetry values (load, voltage) update at subsecond intervals.

#### 4.3.4 `grid_transmission_lines`
*   **Purpose:** Tracks transmission line metrics and paths.
*   **Description:** Links connection nodes and monitors thermal capacity parameters.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** 
    *   `source_node_id` (UUID) references `grid_nodes(id)`
    *   `target_node_id` (UUID) references `grid_nodes(id)`
*   **Important Fields:** `line_code` (VARCHAR), `resistance` (FLOAT), `capacity_limit_mw` (FLOAT), `current_flow_mw` (FLOAT), `status` (VARCHAR).
*   **Relationships:** Many-to-One with source and target `grid_nodes`.
*   **Expected Record Volume:** ~20,000 records.
*   **Notes:** Lines are flagged as `tripped` during contingency events.

#### 4.3.5 `sim_scenarios`
*   **Purpose:** Configures simulation test scenarios.
*   **Description:** Defines mock faults, DER drops, and weather event parameters.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `digital_twin_id` (UUID) references `sim_digital_twins(id)`.
*   **Important Fields:** `scenario_name` (VARCHAR), `fault_node_id` (UUID), `duration_seconds` (INTEGER), `weather_profile` (VARCHAR).
*   **Relationships:** Many-to-One with `sim_digital_twins`, One-to-Many with `sim_runs`.
*   **Expected Record Volume:** <500 records.
*   **Notes:** Used to configure reproducible simulation tests.

#### 4.3.6 `sim_runs`
*   **Purpose:** Logs executions of simulation runs.
*   **Description:** Records execution timestamps, progress status, and outcomes.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** 
    *   `scenario_id` (UUID) references `sim_scenarios(id)`
    *   `executed_by` (UUID) references `auth_users(id)`
*   **Important Fields:** `status` (VARCHAR), `started_at` (TIMESTAMP), `completed_at` (TIMESTAMP).
*   **Relationships:** Many-to-One with `sim_scenarios`, One-to-Many with `sim_results`.
*   **Expected Record Volume:** ~50,000 records.
*   **Notes:** Cleaned up automatically based on data lifecycle policies.

#### 4.3.7 `sim_results`
*   **Purpose:** Logs performance metrics from simulation runs.
*   **Description:** High-density time-series data mapping simulated voltage levels and recovery times.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `sim_run_id` (UUID) references `sim_runs(id)` on delete cascade.
*   **Important Fields:** `timestamp_offset_ms` (INTEGER), `node_id` (UUID), `recorded_voltage` (FLOAT), `recorded_frequency` (FLOAT).
*   **Relationships:** Many-to-One with `sim_runs`.
*   **Expected Record Volume:** ~10,000,000 records.
*   **Notes:** Stored in database tables optimized for time-series logs.

---

### 4.4 Policy Tables

#### 4.4.1 `policy_files`
*   **Purpose:** Registers policy configuration files.
*   **Description:** Deployed policy files containing rulesets that govern agent actions.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `created_by` (UUID) references `auth_users(id)`.
*   **Important Fields:** `file_name` (VARCHAR), `ruleset_checksum` (VARCHAR), `status` (VARCHAR), `deployed_at` (TIMESTAMP).
*   **Relationships:** One-to-Many with `policy_rules`.
*   **Expected Record Volume:** <200 records.
*   **Notes:** Checksum verification prevents deployment of unapproved policies.

#### 4.4.2 `policy_rules`
*   **Purpose:** Stores compiled rule parameters.
*   **Description:** Specific rules derived from parsed regulatory standards.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `policy_file_id` (UUID) references `policy_files(id)` on delete cascade.
*   **Important Fields:** `rule_code` (VARCHAR), `constraint_type` (VARCHAR), `logic_definition` (TEXT), `target_asset_type` (VARCHAR).
*   **Relationships:** Many-to-One with `policy_files`, One-to-Many with `policy_violations`.
*   **Expected Record Volume:** ~2,000 records.
*   **Notes:** Loaded into memory at startup to enforce constraints.

#### 4.4.3 `policy_violations`
*   **Purpose:** Logs policy exceptions and safety boundary violations.
*   **Description:** Audit log of blocked actions or out-of-bounds metrics.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** 
    *   `rule_id` (UUID) references `policy_rules(id)`
    *   `sim_run_id` (UUID, Optional) references `sim_runs(id)`
*   **Important Fields:** `node_id` (UUID), `violation_value` (FLOAT), `message` (TEXT), `detected_at` (TIMESTAMP).
*   **Relationships:** Many-to-One with `policy_rules`.
*   **Expected Record Volume:** ~50,000 records.
*   **Notes:** Violations immediately trigger critical console alarms.

---

### 4.5 AI Subsystem Tables

#### 4.5.1 `ai_agents`
*   **Purpose:** Registers active edge agents.
*   **Description:** Profiles of deployed agent software running on grid nodes.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `grid_node_id` (UUID) references `grid_nodes(id)`.
*   **Important Fields:** `agent_code` (VARCHAR, Unique), `status` (VARCHAR), `ip_address` (VARCHAR), `last_heartbeat` (TIMESTAMP).
*   **Relationships:** One-to-One with `grid_nodes`, One-to-Many with `agent_decisions`.
*   **Expected Record Volume:** ~50,000 records.
*   **Notes:** Heartbeat timeout triggers communication drop alerts.

#### 4.5.2 `agent_memory`
*   **Purpose:** Caches local status parameters for active agents.
*   **Description:** Short-term state cache used by agents during negotiation rounds.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `agent_id` (UUID) references `ai_agents(id)` on delete cascade.
*   **Important Fields:** `memory_key` (VARCHAR), `memory_value` (TEXT), `created_at` (TIMESTAMP).
*   **Relationships:** Many-to-One with `ai_agents`.
*   **Expected Record Volume:** ~500,000 records.
*   **Notes:** Cached in Redis.

#### 4.5.3 `agent_conversations`
*   **Purpose:** Logs negotiation dialogue between edge agents.
*   **Description:** Multi-agent communication traces compiled during contingency resolutions.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `sim_run_id` (UUID, Optional) references `sim_runs(id)`.
*   **Important Fields:** `negotiation_topic` (VARCHAR), `consensus_reached` (BOOLEAN), `started_at` (TIMESTAMP).
*   **Relationships:** One-to-Many with `agent_decisions`.
*   **Expected Record Volume:** ~100,000 records.
*   **Notes:** Traces are analyzed to evaluate coordination efficiency.

#### 4.5.4 `agent_decisions`
*   **Purpose:** Logs final actions executed by agents.
*   **Description:** Specific commands triggered by the negotiation engine.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** 
    *   `agent_id` (UUID) references `ai_agents(id)`
    *   `conversation_id` (UUID) references `agent_conversations(id)`
*   **Important Fields:** `action_triggered` (VARCHAR), `execution_delay_ms` (INTEGER), `outcome` (VARCHAR).
*   **Relationships:** Many-to-One with `ai_agents`, One-to-Many with `agent_explanations`.
*   **Expected Record Volume:** ~500,000 records.
*   **Notes:** Monitored to verify subsecond recovery targets.

#### 4.5.5 `agent_explanations`
*   **Purpose:** Traces the logic behind agent decisions.
*   **Description:** Logs policy parameters and alternative options evaluated by the agent.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `decision_id` (UUID) references `agent_decisions(id)` on delete cascade.
*   **Important Fields:** `decision_tree_json` (JSONB), `violated_rules_json` (JSONB), `compliant_rules_json` (JSONB).
*   **Relationships:** One-to-One with `agent_decisions`.
*   **Expected Record Volume:** ~500,000 records.
*   **Notes:** Displays explanation data on operator consoles.

---

### 4.6 Analytics & Reporting Tables

#### 4.6.1 `report_templates`
*   **Purpose:** Stores configurations for generated reports.
*   **Description:** Mapped parameters defining layout modules and metrics to export.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `created_by` (UUID) references `auth_users(id)`.
*   **Important Fields:** `template_name` (VARCHAR), `query_parameters_json` (JSONB).
*   **Relationships:** One-to-Many with `reports_archive`.
*   **Expected Record Volume:** <50 records.
*   **Notes:** Admin defined.

#### 4.6.2 `reports_archive`
*   **Purpose:** Registers generated report files.
*   **Description:** Archive registry pointing to encrypted PDF/CSV exports in object storage.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `template_id` (UUID) references `report_templates(id)` on delete set null.
*   **Important Fields:** `file_path` (VARCHAR), `generation_timestamp` (TIMESTAMP), `checksum` (VARCHAR).
*   **Relationships:** Many-to-One with `report_templates`.
*   **Expected Record Volume:** ~10,000 records.
*   **Notes:** File path points to secure object storage.

---

### 4.7 Logically Added Enterprise Tables

#### 4.7.1 `scada_connections`
*   **Rationale:** Utility operations require configurations mapping DNP3 IP endpoints and polling rates.
*   **Purpose:** Manages connection parameters for physical grid devices.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `grid_node_id` (UUID) references `grid_nodes(id)` on delete cascade.
*   **Important Fields:** `ip_address` (VARCHAR), `port` (INTEGER), `protocol` (VARCHAR), `polling_rate_ms` (INTEGER), `is_encrypted` (BOOLEAN).
*   **Relationships:** One-to-One with `grid_nodes`.
*   **Expected Record Volume:** ~20,000 records.

#### 4.7.2 `mfa_security_logs`
*   **Rationale:** Critical overrides require dual-operator authorization signatures.
*   **Purpose:** Audit logs for secure multi-factor authentication triggers.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** 
    *   `primary_user_id` (UUID) references `auth_users(id)`
    *   `secondary_user_id` (UUID, Optional) references `auth_users(id)`
*   **Important Fields:** `action_description` (TEXT), `mfa_method` (VARCHAR), `token_validated` (BOOLEAN), `created_at` (TIMESTAMP).
*   **Relationships:** Many-to-One with `auth_users`.
*   **Expected Record Volume:** ~50,000 records.

#### 4.7.3 `substation_geographic_bounds`
*   **Rationale:** Geographic visualizers require spatial boundaries to render weather overlays.
*   **Purpose:** Stores substation spatial boundaries and GPS coordinates.
*   **Primary Key:** `id` (UUID).
*   **Foreign Keys:** `asset_id` (UUID) references `grid_assets(id)` on delete cascade.
*   **Important Fields:** `latitude` (DOUBLE PRECISION), `longitude` (DOUBLE PRECISION), `polygon_boundary_json` (JSONB).
*   **Relationships:** One-to-One with `grid_assets`.
*   **Expected Record Volume:** ~1,000 records.

---

## 5. Relationships

### 5.1 One-to-One Relationships
*   `grid_nodes` ↔ `ai_agents`: Each active grid node is monitored by one edge software agent.
*   `agent_decisions` ↔ `agent_explanations`: Every automated command features one logic trace explanation.
*   `grid_nodes` ↔ `scada_connections`: Every node maps to one physical SCADA connection.

### 5.2 One-to-Many Relationships
*   `auth_users` → `auth_sessions`: A registered user can run multiple active browser sessions.
*   `policy_files` → `policy_rules`: A policy file contains multiple constraint rules.
*   `sim_runs` → `sim_results`: A simulation execution logs multiple timeseries metric entries.

### 5.3 Many-to-Many Relationships
*   `auth_users` ↔ `auth_roles`: Managed using a junction table (`user_roles_junction`). Users can hold multiple roles, and roles map to multiple users.
*   `auth_roles` ↔ `auth_permissions`: Managed using a junction table (`role_permissions_junction`). Roles contain multiple permissions, and permissions are shared across roles.

---

## 6. Indexing Strategy

*   **Primary Key Indexes:** Automatically generated B-Tree indexes on all UUID `id` primary keys.
*   **Secondary Indexes:**
    *   B-Tree on `auth_users(email)` for fast login checks.
    *   B-Tree on `grid_nodes(node_code)` to enable rapid telemetry querying.
*   **Composite Indexes:**
    *   `idx_sim_results_lookup`: Composite B-Tree index on `(sim_run_id, timestamp_offset_ms)` to optimize graph rendering queries.
*   **Full-Text Indexes:**
    *   `idx_policy_rules_logic`: GIN (Generalized Inverted Index) on `policy_rules(logic_definition)` to support fuzzy search during drafting.
*   **Vector Indexes:**
    *   HNSW (Hierarchical Navigable Small World) index in Qdrant database to enable sub-millisecond semantic search on regulatory vector embeddings.

---

## 7. Naming Conventions

*   **Tables:** Lowercase, plural, snake_case (e.g. `audit_logs`, `policy_rules`).
*   **Columns:** Lowercase, singular, snake_case (e.g. `email`, `nominal_voltage`).
*   **Primary Keys:** Standardized as `id` of type UUID across all tables.
*   **Foreign Keys:** Named after target singular table and key (e.g. `user_id` pointing to `auth_users(id)`).
*   **Junction Tables:** Combines singular table names with a junction suffix (e.g. `user_role_junction`).
*   **Indexes:** Prefixed with identifier, table, and column details (e.g. `idx_users_email` or `idx_results_run_offset`).
*   **Constraints:** Clear names identifying target behavior (e.g. `fk_sessions_user` or `chk_voltage_limit`).

---

## 8. Seed Data Strategy

*   **Default Roles:**
    *   `Administrator`: Deploys updates, manages configurations, and audits logs.
    *   `Operator`: Supervises real-time telemetry, responds to alarms, and executes overrides.
    *   `Compliance Officer`: Drafts policies, compiles validation rule files, and exports compliance logs.
*   **Default Users:**
    *   `sys.admin@gpo.utility.org` (Super Admin).
    *   `sys.operator@gpo.utility.org` (Lead Control Dispatcher).
*   **Default Permissions:** Maps basic clearances (e.g. `BYPASS_SAFETY_LATCH`, `EXPORT_AUDIT_LOG`).
*   **Default Policies:** Outlines NERC CIP baseline perimeters and basic frequency limits (e.g. 59.8 Hz to 60.2 Hz bounds).
*   **Sample Grid Assets:** Seed data containing standard 13-bus substation networks, battery banks, and solar PV farms.
*   **Sample Scenarios:** Pre-built grid test configurations (e.g. `Scenario-01: Line 4A lightning strike`).

---

## 9. Data Lifecycle

```
[Create Data] -> [Real-Time Active Cache] -> [Primary PostgreSQL Archive]
                                                     |
  [Purge Session Logs] <--- [Time Retention Limit] <--+
                                 |
                                 v
                     [Read-Only Cold Archive (NERC)]
```

*   **Creation:** Telemetry flows from SCADA links to the cache layer (Redis), writing to PostgreSQL in batched background transactions.
*   **Updates:** Configuration tables support updates. Log files are append-only.
*   **Soft Deletion:** Deleting configuration items (e.g. policy files) updates the status to `archived` or `soft_deleted`. Hard deletion is prohibited.
*   **Archiving:** Time-series tables older than 30 days are automatically archived.
*   **Retention:** Audit records, configuration logs, and policy updates are retained for 5 years to meet compliance standards.
*   **Purging:** Temporary session logs, debugging files, and intermediate simulation outputs are purged after 90 days.

---

## 10. Performance Strategy

*   **Query Optimization:** Standardize queries to search on B-Tree indexed columns. Avoid wildcards on text fields.
*   **Table Partitioning:** Partition `sim_results` and `system_notifications` tables by date.
*   **Caching:** Read-only configurations (e.g., active policies) are cached in Redis.
*   **Read/Write Scalability:** Implement PostgreSQL read replicas for dashboard queries.
*   **Large Dataset Handling:** Run bulk insertions for simulation logs.

---

## 11. Security

*   **Encryption at Rest:** Primary tables and backup storage systems are encrypted using AES-256 keys.
*   **Encryption in Transit:** Database connections require TLS 1.3 encryption.
*   **Sensitive Data Handling:** Hash passwords using bcrypt. Encrypt session tokens, MFA keys, and email fields.
*   **Access Control:** Database roles follow least privilege principles, restricting application services to their specific namespace schema.
*   **Auditability:** Audit log tables use cryptographic verification. Each row contains a hash computed from the previous row's payload.
*   **Compliance:** Access parameters are logged to satisfy NERC CIP compliance auditing.

---

## 12. Future Scalability

*   **User Growth:** Read replicas handle growing dashboard query loads.
*   **Simulation Scaling:** Simulation logs are written to isolated target instances, preventing write bottlenecks on primary tables.
*   **AI Agent Expansion:** Node agent memory is cached in Redis, decoupling agent communication from primary database transactions.
*   **Historical Data Growth:** Time-series partitions are archived to object storage, keeping primary tables lightweight and fast.

---

## 13. Related Documents
*   [Technical Architecture Specification](ARCHITECTURE.md)
*   [API Specification Contract](API_SPEC.md)
*   [Screen Inventory & Flow Catalog](SCREEN_CATALOG.md)
*   [Development & Git Standards](CONTRIBUTING.md)

---

## 14. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Principal Database Architect |
