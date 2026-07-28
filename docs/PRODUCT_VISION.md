# Grid Policy Orchestrator (GPO)
## Product Vision

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Principal Product Architect
*   **Phase:** Phase 0.1
*   **Last Updated:** July 22, 2026
*   **Purpose:** Outlines the product vision, core problem statement, target users, and baseline success metrics for the GPO platform.

---

## Table of Contents
*   [1. Project Vision & Mission](#1-project-vision--mission)
*   [2. Problem Statement](#2-problem-statement)
*   [3. Solution Statement](#3-solution-statement)
*   [4. System Name & Reference](#4-system-name--reference)
*   [5. Core Objectives](#5-core-objectives)
*   [6. Target User Roles](#6-target-user-roles)
*   [7. User Personas](#7-user-personas)
*   [8. Primary Use Cases](#8-primary-use-cases)
*   [9. User Journey Mapping](#9-user-journey-mapping)
*   [10. Scope Boundaries](#10-scope-boundaries)
*   [11. Key Success Metrics](#11-key-success-metrics)
*   [12. Related Documents](#12-related-documents)
*   [13. Revision History](#13-revision-history)

---

## 1. Project Vision & Mission

### 1.1 Vision
To establish GPO as the standard operating system for the next-generation autonomous grid. We envision a fully decarbonized, self-healing power grid where human operators supervise high-level policies while coordinated agent swarms execute sub-second balancing, contingency response, and cross-operator trading in complete compliance with regulatory safety boundaries.

### 1.2 Mission
To empower transmission and distribution operators with intelligent, policy-governed autonomous agents that orchestrate grid stability, optimize DER integration, and mitigate contingency events at sub-second speeds. GPO bridges the critical gap between fast-acting edge hardware controls and compliance-heavy utility operations, building trust in automation through clear policy constraints.

---

## 2. Problem Statement
Modern electrical grids face unprecedented operational complexity:
*   **Exponential DER Growth:** Intermittent, bidirectional power flows from solar, wind, and electric vehicles challenge static grid layouts designed for centralized, one-way power flow.
*   **Shrinking Decision Windows:** Grid instabilities (voltage sags, frequency deviations) occur at sub-second scales, rendering human-in-the-loop SCADA/EMS systems too slow to prevent blackouts.
*   **Policy-Automation Mismatch:** Existing automated controls operate in silos, completely unaware of dynamic regulatory constraints (NERC CIP), regional energy tariffs, or bilateral utility agreements.

---

## 3. Solution Statement
GPO introduces a policy-aware multi-agent orchestration architecture:
*   **Executable Policy Engine:** Translates static regulatory text and utility rules into a machine-readable policy layer enforcing physical and operational safety boundaries.
*   **Coordinated Edge Agents:** Decoupled software agents run on substations and active nodes, negotiating locally to restore balance within milliseconds.
*   **Unified Supervision Panel:** Provides human operators complete observability of agent behaviors, policy triggers, and immediate manual overrides.

---

## 4. System Name & Reference
*   **Final Project Name:** Grid Policy Orchestrator (GPO)
*   **System Reference Code:** `SYS.OP-CTRL.GPO`

---

## 5. Core Objectives
*   **Sub-Second Local Resolution:** Resolve distribution-level thermal overloads and voltage fluctuations under 400 milliseconds at the substation edge.
*   **Continuous Policy Verification:** Guarantee mathematically verified compliance with NERC CIP standards and municipal grid rules before executing agent commands.
*   **Legacy System Interoperability:** Seamlessly ingest telemetry and output controls via standard industrial protocols (DNP3, Modbus, IEC 61850).
*   **Scalable Control Plane:** Maintain stable control loops across up to 100,000 active DER agents per utility control zone.

---

## 6. Target User Roles
*   **Transmission System Operators (TSOs) / Distribution System Operators (DSOs):** Control room operators supervising real-time stability and responding to contingencies.
*   **Grid Operations Engineers:** Engineers managing asset deployments, topology mappings, and hardware parameters.
*   **Compliance & Policy Officers:** Regulatory architects translating NERC guidelines into system constraints and auditing grid histories.

---

## 7. User Personas

### 7.1 Persona A: Sarah Chen (Lead Grid Dispatcher - TSO/DSO)
*   **Context:** Handles real-time grid operations under high stress inside the utility control room.
*   **Key Challenge:** Alarm fatigue and lack of trust in "black-box" automation.
*   **Operational Need:** Real-time visibility into agent negotiations, clear policy boundary alerts, and guaranteed, immediate manual override of autonomous controls.

### 7.2 Persona B: Marcus Vance (Compliance & Policy Architect)
*   **Context:** Translates NERC guidelines and local grid rules into software configurations.
*   **Key Challenge:** Legacy compliance auditing requires manual checks, creating long deployment cycles.
*   **Operational Need:** A robust environment to convert regulatory policies into logic files, test them in simulations, and generate audit reports proving compliance.

---

## 8. Primary Use Cases

### 8.1 UC-01: Active Feeder Thermal Management
Edge agents at substation feeders detect real-time voltage and temperature spikes, immediately negotiating local battery storage charging and solar PV throttling to protect physical assets.

### 8.2 UC-02: Automated Microgrid Islanding & Black-Start
Upon detection of transmission line tripping, downstream microgrid agents negotiate locally to isolate from the main grid and dynamically balance internal generation with critical local loads (e.g., hospitals).

### 8.3 UC-03: Regulatory Policy-Guided Load Shedding
During a severe system-wide contingency, GPO calculates necessary load reduction while strictly obeying policies that prohibit shedding power to critical infrastructure (hospitals, water pumps).

---

## 9. User Journey Mapping

1.  **Policy Definition & Compilation:** Marcus Vance imports NERC PRC-024-2 updates. The GPO policy compiler validates the syntax and converts it into mathematical constraints.
2.  **Digital Twin Simulation:** Marcus runs a high-fidelity simulation of the substation network. The simulator verifies that agents successfully stabilize the network under the new policy constraints without violations.
3.  **Hot-Swap Edge Deployment:** The validated policy ruleset is digitally signed and securely dispatched to all active substation edge agents. The update takes effect immediately with zero control plane downtime.
4.  **Autonomous Resolution & Oversight:** A physical line trips. Node agents negotiate load sheds and DER dispatches in 280ms, maintaining grid stability. Sarah Chen reviews the action log on her console and confirms the system status.

---

## 10. Scope Boundaries

### 10.1 In Scope
*   Multi-agent coordination layer (control plane) and agent SDK.
*   Formal policy compiler and runtime verification engine.
*   Read/Write SCADA/EMS integration adapters.
*   Real-time simulation and digital twin environment.
*   High-density console interface for operators.

### 10.2 Out of Scope
*   Physical high-voltage grid hardware manufacturing (inverters, breakers, transformers).
*   Long-term capacity planning (days-ahead or years-ahead grid planning software).
*   Retail customer billing and public account management.
*   Primary hardware-level protection relay systems (GPO does not replace SEL physical safety relays).

---

## 11. Key Success Metrics

| Metric Identifier | Measurement Area | Current Baseline | Target Value (Orchestrated) |
| :--- | :--- | :--- | :--- |
| `METRIC-SRT-01` | System Restoration Time (SRT) | 15 to 45 minutes (Manual Dispatch) | < 1.5 seconds (Autonomous) |
| `METRIC-DER-02` | Active DER Hosting Capacity | Static safety limits (Unmanaged) | + 35% Dynamic limits increase |
| `METRIC-ALM-03` | Control Center Alarm Volume | ~1,200 alarms per day per operator | - 90% reduction via local agent resolution |
| `METRIC-POL-04` | Policy Deployment Velocity | 3 to 6 months (Rigid Software Release) | < 2 hours (Dynamic Hot-Swap Compile) |

---

## 12. Related Documents
*   [Brand Guidelines](BRAND_GUIDELINES.md)
*   [UX Guidelines](UX_GUIDELINES.md)
*   [Technical Architecture Specification](ARCHITECTURE.md)
*   [Product Release Roadmap](ROADMAP.md)

---

## 13. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Principal Product Architect |
