# Grid Policy Orchestrator (GPO)
## Project Landing Page & Documentation Directory

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Technical Writer / Documentation Lead
*   **Phase:** Phase 5 Complete
*   **Phase Progress:**
    - [x] **Phase 1** - Setup & Infrastructure (Completed)
    - [x] **Phase 2** - Authentication & Security (Completed)
    - [x] **Phase 3** - Grid Asset Management (Completed)
    - [x] **Phase 4** - Predictive Digital Twin & AI Intelligence (Completed)
    - [x] **Phase 5** - Enterprise Optimization & Decision Intelligence (Completed)
    - [x] **Phase 6** - Final QA, Bug Fixing & Polish (Completed)
*   **Last Updated:** July 29, 2026
*   **Purpose:** Central landing page and documentation directory for the Grid Policy Orchestrator platform.

---

## Table of Contents
*   [1. System Overview](#1-system-overview)
*   [2. Project Vision](#2-project-vision)
*   [3. Key Features](#3-key-features)
*   [4. Technology Stack Summary](#4-technology-stack-summary)
*   [5. Repository Structure](#5-repository-structure)
*   [6. Documentation Index](#6-documentation-index)
*   [7. Development Workflow](#7-development-workflow)
*   [8. Getting Started](#8-getting-started)
*   [9. Related Documents](#9-related-documents)
*   [10. Revision History](#10-revision-history)

---

## 1. System Overview
Grid Policy Orchestrator (GPO) is a policy-governed multi-agent decision support platform designed for electrical transmission and distribution utility control rooms. The system automates localized grid stabilization, DER (Distributed Energy Resource) dispatch, and load-balancing operations at millisecond speeds. By enforcing safety boundaries through an executable policy compiler, GPO bridges the gap between autonomous edge actions and strict utility compliance standards, reducing operator alert fatigue and securing grid topology structures against outage contingencies.

---

## 2. Project Vision
Our vision is to deliver a secure, self-healing grid control system where autonomous agents handle sub-second stability negotiations within strict policy boundaries, under the continuous oversight of utility control room dispatchers.

For the complete product strategy, target personas, and validation metrics, refer to [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md).

---

## 3. Key Features
*   **Multi-Agent AI:** Decentralized edge agent negotiation loops for regional balancing.
*   **Policy Engine:** Executable rules compiler that translates regulatory texts into system boundaries.
*   **Digital Twin:** Real-time electrical schematic visualization of grid asset connections.
*   **Grid Simulation:** Interactive scenario builder to test grid events under mock faults.
*   **Explainable AI:** Decision logs tracing the exact policy constraints applied by agents.
*   **Decision Support:** Recommendation feeds allowing operators to review non-critical agent actions.
*   **Analytics Dashboard:** Visual indicators monitoring system load patterns and trends.
*   **Role-Based Access Control:** Fine-grained API authorization mapping roles to actions.
*   **Enterprise Security:** Zero-trust architecture compliant with NERC CIP guidelines.
*   **Scenario Planning:** Toolsets to configure and clone reproducible grid contingencies.

---

## 4. Technology Stack Summary
GPO's decoupled microservices stack is optimized for high-volume telemetry ingestion and fast rule compiling:
*   **Frontend UI:** React and TypeScript leveraging high-density CSS variables.
*   **Backend API:** FastAPI (Python) executing asynchronous endpoints and WebSocket feeds.
*   **AI Orchestration:** LangChain and gRPC managing edge agent coordination logs.
*   **Grid Solver:** PowerModels.jl (Julia) calculating power flow states.
*   **Databases:** PostgreSQL (transactions, configs), Qdrant (vectors), and Redis (caching, agent memory).
*   **Deployment:** Containerized pipelines hosted in high-availability Kubernetes clusters.

For detailed interface paths and microservice mappings, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 5. Repository Structure

```
aug1/
├── docs/                     # Engineering specifications directory
│   ├── PRODUCT_VISION.md     # Strategy, scopes, and target personas
│   ├── BRAND_GUIDELINES.md   # Color profiles and brand attributes
│   ├── DESIGN_SYSTEM.md      # Visual tokens and typography hierarchies
│   ├── UX_GUIDELINES.md      # Accessibility rules and standard alerts
│   ├── SCREEN_CATALOG.md     # Directory of views and permission maps
│   ├── COMPONENT_LIBRARY.md  # UI components and domain assets
│   ├── ARCHITECTURE.md       # System components and stack definitions
│   ├── DATABASE_DESIGN.md    # Database schema specifications
│   ├── API_SPEC.md           # API endpoints contract
│   ├── CONTRIBUTING.md       # Git branching and conventional commits
│   ├── AI_DEVELOPMENT_GUIDE.md # Prompt templates and safety guidelines
│   ├── ROADMAP.md            # Product roadmap and phase schedules
│   └── MOTION_GUIDELINES.md  # Timing, easing, scroll, and micro-interactions
├── design-tokens.json        # Compiled design parameters schema (Root)
└── README.md                 # Project landing page
```

---

## 6. Documentation Index

All Phase 0 planning documents are stored inside the `docs/` directory:

| Document File | Description |
| :--- | :--- |
| [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | Product vision, target users, personas, and success metrics. |
| [docs/BRAND_GUIDELINES.md](docs/BRAND_GUIDELINES.md) | Visual identity, monospaced typography, and color palette definitions. |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Core design system tokens, typography scales, and visual spacing rules. |
| [design-tokens.json](design-tokens.json) | *Root File:* Compiled JSON tokens for color, typography, borders, and margins. |
| [docs/UX_GUIDELINES.md](docs/UX_GUIDELINES.md) | UX guidelines, accessibility (WCAG AA), shortcuts, and error alerts. |
| [docs/SCREEN_CATALOG.md](docs/SCREEN_CATALOG.md) | Directory of all application views, user permissions, and dependencies. |
| [docs/COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) | Master inventory of all reusable visual and domain components. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System overview, module structures, and technology stack rationales. |
| [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Database schemas, indexing guidelines, lifecycles, and tables. |
| [docs/API_SPEC.md](docs/API_SPEC.md) | API endpoints, status codes, request schemas, and websocket flows. |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Code styling, branching models, conventional commits, and workflows. |
| [docs/AI_DEVELOPMENT_GUIDE.md](docs/AI_DEVELOPMENT_GUIDE.md) | System prompt templates, coding guidelines, and safety practices. |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Project roadmap outlining implementation schedules. |
| [docs/MOTION_GUIDELINES.md](docs/MOTION_GUIDELINES.md) | Timings, easing curves, transition rules, and micro-interactions. |

---

## 7. Development Workflow
All developments in the codebase follow a structured integration sequence:

```
[Documentation & Spec Alignment]
               │
               ▼
[System Architecture & API Mappings]
               │
               ▼
[Code Implementation & Local Style Compliance]
               │
               ▼
[Automated Tests Verification (Unit/Integration)]
               │
               ▼
[CI/CD Verification & Production Deployments]
```

---

## 8. Getting Started
To set up GPO for local development, follow these high-level steps:
1.  **Clone Repository:** Access the repository inside the secure corporate firewall.
2.  **Install Prerequisites:** Verify that local containers (Docker), Python, Node, and Julia environments are installed.
3.  **Local Environment Configuration:** Copy the template variables file into a local `.env` configuration.
4.  **Launch Dependencies:** Start local database containers (Postgres, Redis, Qdrant) using container setups.
5.  **Initialize Services:** Launch backend FastAPI workers, simulation solvers, and frontend dev servers.
6.  **Verify Setup:** Access the local address and verify connections using system health endpoints.

---

## 9. Related Documents
*   [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md)
*   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
*   [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
*   [docs/AI_DEVELOPMENT_GUIDE.md](docs/AI_DEVELOPMENT_GUIDE.md)
*   [docs/MOTION_GUIDELINES.md](docs/MOTION_GUIDELINES.md)

---

## 10. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Technical Writer |
| v1.0.1 | July 23, 2026 | Added GPO Motion Design Specification to Phase 0 | Product Release Manager |
