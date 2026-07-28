# Grid Policy Orchestrator (GPO)
## Brand Guidelines

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Creative Director / Brand Strategist
*   **Phase:** Phase 0.2
*   **Last Updated:** July 22, 2026
*   **Purpose:** Defines GPO's brand identity, typography, corporate color palette, naming standards, and visual assets rules.

---

## Table of Contents
*   [1. Brand Overview](#1-brand-overview)
*   [2. Logo Concept](#2-logo-concept)
*   [3. Official Color Palette](#3-official-color-palette)
*   [4. Typography](#4-typography)
*   [5. Naming Conventions](#5-naming-conventions)
*   [6. Iconography Style](#6-iconography-style)
*   [7. Illustration Style](#7-illustration-style)
*   [8. Core Design Philosophy](#8-core-design-philosophy)
*   [9. Related Documents](#9-related-documents)
*   [10. Revision History](#10-revision-history)

---

## 1. Brand Overview

### 1.1 Brand Meaning
The Grid Policy Orchestrator represents the convergence of physical electrical power grid control systems and logical utility policy perimeters. GPO brings order, safety, and synchronization to modern grid networks. The name represents mathematical structure, systemic resilience, and the transformation of volatile grid telemetry into stable operational states.

### 1.2 Brand Personality
*   **Technical:** Designed for engineers, by engineers. Speaks in precise parameters and system variables.
*   **Unwavering:** Dependable and robust. Conveys stability, safety, and operational reliability.
*   **Authoritative:** Professional and objective. It acts as an experienced consultant, delivering clear facts under pressure.
*   **Minimalist:** Rejects marketing hype and unnecessary clutter. Prioritizes data legibility and functional layouts.

### 1.3 Brand Values
*   **Policy-Governed Control:** Operational parameters are governed by rules. Automation remains safe and compliant.
*   **Sub-Second Decisiveness:** Machine-speed decision-making is necessary to stabilize electrical sags.
*   **Absolute Traceability:** No hidden logic. Actions are documented and traceable back to the triggering constraint.

---

## 2. Logo Concept
*   **Primary Logo Concept:** The Policy Hexagon Hub. Features a central coordinate node (the core compiler/orchestrator) connected via geometric network paths to surrounding, symmetric edge nodes (active edge agents). The entire cluster is enclosed inside a solid hexagon boundary, symbolizing NERC policy perimeters.
*   **Icon Concept:** A simplified monogram combining the grid lines of a power transformer schematic enclosed inside a geometric policy boundary, optimized for legibility at `16x16px`.
*   **Logo Symbolism:** 
    *   *The Nodal Hub:* Governance, central monitoring, and operator overrides.
    *   *The Network Vectors:* Multi-agent consensus, negotiation, and load currents.
    *   *The Enclosing Hexagon:* Operational safety boundaries and perimeters.
*   **Logo Usage Guidelines:**
    *   Minimum clearance of 50% of the logo's width around all sides.
    *   Only render in Energy Orange (`#FF7A1A`) on Almost Black (`#0B0E13`), or solid white (`#F8FAFC`) on dark surfaces. Drop shadows, glows, and gradients are prohibited.

---

## 3. Official Color Palette
Colors are selected to reduce eye strain during 12-hour shifts in control room environments, ensuring legibility and clear hierarchy.

| Color Role | HEX Code | RGB Code | Selection Reason & Usage |
| :--- | :--- | :--- | :--- |
| **Primary Text** | `#F8FAFC` | `rgb(248, 250, 252)` | Slate White. High-contrast readability without the glare of pure white. |
| **Secondary Text** | `#94A3B8` | `rgb(148, 163, 184)` | Slate Gray. Used for descriptive text, labels, and inactive menu links. |
| **Muted Text** | `#64748B` | `rgb(100, 116, 139)` | Medium Slate. Used for table headers, metadata, and timestamps. |
| **Primary Accent** | `#FF7A1A` | `rgb(255, 122, 26)` | Energy Orange. Highlights active current paths and core action buttons. |
| **Secondary Accent**| `#FFA940` | `rgb(255, 169, 64)` | Electric Amber. Indicates active negotiations and secondary status steps. |
| **Base Background** | `#0B0E13` | `rgb(11, 14, 19)` | Almost Black. Creates a dark, focused control room environment. |
| **Surface** | `#151A21` | `rgb(21, 26, 33)` | Dark Graphite. Solid background card surfaces. |
| **Elevated Surface** | `#1C222B` | `rgb(28, 34, 43)` | Graphite Plus. Used for input fields, code blocks, and selected list items. |
| **Border** | `#2A313C` | `rgb(42, 49, 60)` | Slate Border. Clean, structural separation lines. |
| **Grid Success** | `#22C55E` | `rgb(34, 197, 94)` | Grid Green. Used for active, nominal grid nodes and compliant policies. |
| **Grid Warning** | `#F59E0B` | `rgb(245, 158, 11)` | Amber. Flags voltage sags and thermal overload warnings. |
| **Grid Error** | `#EF4444` | `rgb(239, 68, 68)` | Grid Red. Indicates tripped breakers, policy violations, or emergency shutdowns. |
| **Information** | `#3B82F6` | `rgb(59, 130, 246)` | Information Blue. Used for audit trails and compiler log details. |

---

## 4. Typography

### 4.1 Fonts
*   **Heading Font:** Space Grotesk. Fits industrial aesthetics with geometric shapes and sharp terminal cuts.
*   **Body Font:** Inter. Neutral sans-serif font optimized for legibility at small sizes on digital screens.
*   **Monospace Font:** JetBrains Mono. Clean character shapes (e.g., distinguishing `0` and `O`) prevent reading errors in logs.

### 4.2 Text Hierarchy & Scale

| Text Level | Font Family | Size (px) | Line Height | Case & Weight |
| :--- | :--- | :--- | :--- | :--- |
| **H1 // Page Title** | Space Grotesk | `32px` | `40px` | Uppercase // Bold (700) |
| **H2 // Section Title** | Space Grotesk | `20px` | `28px` | Uppercase // Medium (600) |
| **H3 // Card Title** | Space Grotesk | `14px` | `20px` | Uppercase // Medium (600) |
| **Body // Standard** | Inter | `14px` | `22px` | Sentence // Regular (400) |
| **Detail // Metadata** | Inter | `12px` | `18px` | Sentence // Medium (500) |
| **Code // Telemetry** | JetBrains Mono| `12px` | `16px` | None // Regular (400) |

---

## 5. Naming Conventions
Consistency in naming conventions prevents developer errors and aligns the codebase with physical system assets.
*   **Pages (Views):** Lowercase, kebab-case (e.g., `/active-topology`, `/policy-compiler`, `/contingency-log`).
*   **UI Components:** PascalCase (e.g., `GridTopologyViewer`, `AgentNegotiationList`, `PolicyConstraintCard`).
*   **AI / Edge Agents:** Screaming Snake with subsystem prefix (e.g., `AGT_SUB_RENO_4A`, `AGT_DER_BAT_12B`).
*   **APIs (REST Endpoints):** Lowercase, kebab-case, version-prefixed (e.g., `/api/v1/policy-rules/active`, `/api/v1/grid-agents/mitigate`).
*   **Database Tables:** Plural, snake_case (e.g., `agent_negotiations`, `policy_constraints`, `grid_telemetry_logs`).
*   **Git Branches:** Lowercase prefix with kebab-case description (e.g., `feature/policy-compiler`, `hotfix/dnp3-packet-overflow`).
*   **Code Files:** Mapped to export format (UI component: `PolicyStudio.tsx`, utilities/scripts: `rule_verifier.py`).

---

## 6. Iconography Style
*   **Icon Library:** Lucide Icons. Clean, geometric vectors that align perfectly to standard pixel boundaries.
*   **Icon Sizing:** `16px` for inline logs, `18px` for card headers, `24px` for main navigation menus.
*   **Stroke Weight:** Locked to `2.0px` for UI components, and `1.5px` for large schematic drawings.
*   **Filled vs Outline:** Outline-only. Fills are forbidden (except for warning indicators).
*   **Usage Rules:** Every icon must serve a functional status or navigation purpose. Icons are paired consistently with actions.

---

## 7. Illustration Style
*   **Illustration Type:** 2D Vector Schematics. Visual elements must resemble technical blueprints or block diagrams.
*   **Empty State Visuals:** Dotted container outline `#2A313C` displaying a placeholder code (e.g., `[ERR.NODE-NULL-0]`).
*   **Error Pages:** Red vector schematics (`#EF4444`) showing a disconnected line pathway, avoiding cartoon illustrations.
*   **Loading Indicators:** Simple node-ring spinner or a step-by-step console initializing log: `INIT: LOAD_TELEMETRY... [OK]`.
*   **Documentation:** Clear lines (`#2A313C`) with Energy Orange (`#FF7A1A`) highlighting target components.

---

## 8. Core Design Philosophy
*   **Function Over Decoration:** Layout elements exist to communicate structure. Avoid drop shadows, glows, or empty boxes.
*   **Engineering-First Mapping:** Display grid nodes as single-line topology maps matching the operator's mental model.
*   **Data Readability & Contrast:** Maximize layout density without clutter. Ensure a minimum `4.5:1` contrast ratio.
*   **Redundant Indicators:** State changes must pair color cues with text labels (e.g., `[TRIPPED]` in red) for colorblind safety.
*   **Rigid Consistency:** Keep spacing, headers, margins, and component alignments identical.
*   **Zero-Lag UI:** Transition animations must be fast (fades under `150ms`), avoiding lags or visual delays.

---

## 9. Related Documents
*   [Product Vision](PRODUCT_VISION.md)
*   [Design System Specifications](DESIGN_SYSTEM.md)
*   [User Experience Standards](UX_GUIDELINES.md)
*   [Technical Architecture Specification](ARCHITECTURE.md)

---

## 10. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Creative Director |
