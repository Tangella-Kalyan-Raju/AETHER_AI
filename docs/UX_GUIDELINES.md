# Grid Policy Orchestrator (GPO)
## User Experience Standards

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Enterprise UX Architect
*   **Phase:** Phase 0.4
*   **Last Updated:** July 22, 2026
*   **Purpose:** Standardizes accessibility benchmarks, navigation hierarchies, keyboard shortcuts, error structures, and notification zones.

---

## Table of Contents
*   [1. UX Philosophy](#1-ux-philosophy)
*   [2. Information Architecture](#2-information-architecture)
*   [3. Navigation Standards](#3-navigation-standards)
*   [4. Dashboard Hierarchy](#4-dashboard-hierarchy)
*   [5. Accessibility Standards (WCAG 2.2 AA)](#5-accessibility-standards-wcag-22-aa)
*   [6. Keyboard Interaction Map](#6-keyboard-interaction-map)
*   [7. Form Design Rules](#7-form-design-rules)
*   [8. Input Validation Standards](#8-input-validation-standards)
*   [9. Error Specifications](#9-error-specifications)
*   [10. Confirmation Dialogs](#10-confirmation-dialogs)
*   [11. Responsive Design Standards](#11-responsive-design-standards)
*   [12. Empty States](#12-empty-states)
*   [13. Loading Experience](#13-loading-experience)
*   [14. Notifications](#14-notifications)
*   [15. UX Best Practices Summary](#15-ux-best-practices-summary)
*   [16. Related Documents](#16-related-documents)
*   [17. Revision History](#17-revision-history)

---

## 1. UX Philosophy

To maintain operational safety and coordinate multi-agent telemetry loops under high pressure, GPO's interaction design is governed by eight core principles:

### 1.1 User-Centered Design (UCD)
The interface is optimized for the cognitive capabilities and limits of utility operators supervising complex systems. Visual structures must prioritize grid stability metrics, reduce operator alarm fatigue, and establish absolute trust in automated agent negotiations.

### 1.2 Engineering-First Workflow
Interface structures, navigation flows, and labels must map directly to industrial power systems terminology. The system rejects oversimplified consumer-oriented abstractions in favor of precise physical grid models, node trees, and NERC compliance criteria.

### 1.3 Efficiency of Interaction
Control room operators require split-second command paths. Workflows must minimize the number of clicks required to execute actions. Critical operations, navigation modules, and search paths are accessible via system-wide keyboard shortcuts and a unified Command Palette.

### 1.4 Rigid Consistency
Interaction patterns, form layouts, modal buttons, and table behaviors are identical across all modules. Operator reaction speed during grid outages depends on muscle memory and predictable control placements.

### 1.5 Accessibility (WCAG 2.2 AA)
The interface is inclusive by default. It provides complete keyboard navigability, robust focus ring management, descriptive screen reader properties (ARIA), and color-independent state indicators for colorblind operators.

### 1.6 Error Prevention & Recovery
The system proactively prevents operational mistakes. Destructive or critical grid overrides are protected by physical validation gates, disabled states, and secure confirmation dialog loops. Clear, structured guidance is provided to resolve input errors.

### 1.7 Progressive Disclosure
Dashboard elements present key status summaries first, allowing operators to drill down into complex agent telemetry logs or compiler stacks on demand. This prevents cognitive overload during system anomalies.

### 1.8 Scalability of Data Density
Visual modules are engineered to handle high-density data flows, displaying thousands of grid breakers, lines, and agent negotiation logs without visual lag, screen clutter, or overlapping borders.

---

## 2. Information Architecture

GPO utilizes an L-shaped structural frame consisting of a fixed top utility bar, a persistent left side navigation panel, and a centralized workspace canvas. This architecture supports rapid navigation and clear visual hierarchy.

```
+-----------------------------------------------------------------------------+
|  TOP UTILITY BAR (Monogram, System Status Badge, Operator Profile)          |
+----------------------------------------------------+------------------------+
|  SIDEBAR  |  WORKSPACE CANVAS                      |  CONTEXTUAL DRAWER     |
|           |  (Breadcrumbs, Action Headers)         |  (Detail telemetry,    |
|  Dash     |                                        |   parameters,          |
|  Topology |  +----------------------------------+  |   agent weights,       |
|  Policy   |  | Primary Visualization Area       |  |   and logs)            |
|  Sim      |  | (Grid Topology Map / Data Grid)  |  |                        |
|  Audit    |  +----------------------------------+  |                        |
|           |  | Detail Tables / Logs / Metrics   |  |                        |
|  [Collapse]  +----------------------------------+  +------------------------+
+-----------+----------------------------------------+------------------------+
```

### 2.1 Navigation & Screen Grouping

*   **Primary Modules (Left Sidebar):**
    *   `Dashboard` (Real-time operational overview, key KPIs, alerts, active mitigations).
    *   `Topology Map` (Interactive single-line schematic of substations, breakers, and feeders).
    *   `Policy Studio` (Policy compiler, active constraint files, syntax validation panels).
    *   `Simulation Sandbox` (Digital twin scenario configuration and simulation runner).
    *   `Audit Logs` (Historical telemetry lists, compliance signatures, export parameters).
*   **Contextual Side Drawers:**
    *   Slide out from the right margin to present detailed properties of selected grid nodes, agent negotiations, or policy validation metrics without steering focus away from the main canvas.

### 2.2 Hierarchy Justification
This structure separates global controls (top navbar/sidebar) from localized details (main canvas/right drawers). By housing sub-module properties in collapsible side drawers, the system maintains the operator's primary screen context, preventing navigation disorientation during critical grid events.

---

## 3. Navigation Standards

GPO navigation is predictable, persistent, and fast.

*   **Global Sidebar Behavior:**
    *   Persistent at the left edge of laptop and desktop screens. Collapses to an icon-only bar on smaller displays (`768px - 1024px`) to preserve workspace canvas width.
    *   The active navigation link displays a solid Energy Orange (`#FF7A1A`) vertical indicator line on its left border.
*   **Top Utility Bar:**
    *   Stays fixed to the top of the viewport. Houses the GPO brand monogram, the system status indicator (Green/Yellow/Red status bulb), and user profile controls.
*   **Breadcrumbs:**
    *   Positioned directly below module page titles in JetBrains Mono. Format: `Dashboard / Substation Reno / Breaker 4A`.
    *   All path segments are clickable links, except the final node representing the current view.
*   **Page Transitions:**
    *   Page swaps transition instantly using a flat `120ms` linear opacity fade. Curved, sliding, or zooming animations are prohibited.
*   **Deep Linking:**
    *   Every view, agent card, and policy file is mapped to a unique URL hash path (e.g., `#/topology?node=substation-reno-4a`) to support instant sharing and direct bookmark links.
*   **Search Behavior:**
    *   Global search is initiated from any view via hotkey `Ctrl+K`. It displays an overlay dialog box containing a fuzzy search bar. Results appear in a structured, keyboard-navigable list.
*   **Back Navigation:**
    *   Fully supports native browser back/forward buttons. A secondary neutral back button sits adjacent to screen headers inside deep sub-menus.
*   **Navigation Consistency Rules:**
    *   Menu labels and layout structures are static. Sidebar links never move or reorganize dynamically.

---

## 4. Dashboard Hierarchy

GPO dashboards organize information according to critical priority, ensuring operators consume key metrics first.

### 4.1 Visual Zoning

```
+-----------------------------------------------------------------------------+
|  [ZONE A] CRITICAL ALARMS & OVERRIDE BANNER (Flashing Red Indicator)        |
+-----------------------------------------------------------------------------+
|  [ZONE B] CORE KPI PANEL (Voltage, Frequency, Restorations - Large Mono)    |
+----------------------------------------------------+------------------------+
|  [ZONE C] MAIN GRID VISUALIZATION CANVAS           |  [ZONE D]              |
|  (Interactive Grid Topology Map / Active Nodes)    |  AI ACTION PANEL       |
|                                                    |  (Negotiations,        |
|                                                    |   recommendations)     |
+----------------------------------------------------+------------------------+
|  [ZONE E] DENSE DATA REGISTERS (Real-time telemetry, logs, audit lists)     |
+-----------------------------------------------------------------------------+
```

### 4.2 Information Priority
1.  **Zone A: Critical Alerts (Top Margin):** Displays current line trips, policy violations, and active overrides. Pulsing red highlights require operator acknowledgment.
2.  **Zone B: Core KPIs (Header Row):** Standard parameters (e.g., `49.98 Hz`, `120.4 kV`). Uses large monospaced characters.
3.  **Zone C: Central Map/Grid (Center Workspace):** The primary graphic asset displaying the active electrical schematic network.
4.  **Zone D: AI Recommendations (Right Margin):** Coordinated agent recommendations, negotiation trails, and compliant mitigation steps.
5.  **Zone E: Telemetry Tables (Bottom Section):** Comprehensive data logs, compiler debug registers, and event streams.

---

## 5. Accessibility Standards (WCAG 2.2 AA)

GPO maintains a strict accessibility standard, ensuring complete system usability under diverse conditions.

*   **Keyboard Navigation:**
    *   All interactive buttons, menus, fields, and topology nodes support full keyboard control using standard keys: `Tab`, `Shift+Tab`, `Arrow Keys`, `Enter`, and `Space`.
*   **Screen Reader Support:**
    *   Interactive elements feature valid HTML accessibility tags and ARIA labels. Non-interactive elements (decorative icons, borders) are marked `aria-hidden="true"`.
*   **Focus Rings:**
    *   Focused items are outlined with a `2px` thick focus ring in color `#3B82F6` (Information Blue) offset by `2px`. Outline rings must never overlap or clip.
*   **Contrast Requirements:**
    *   All text, icons, and focus outlines meet a minimum contrast ratio of `4.5:1` against their backdrops.
*   **Color-Independent Communication:**
    *   Information is never communicated by color alone. A green status light must feature the label `[OK]`, and a red breaker status must feature the label `[TRIPPED]`.
*   **Touch Targets:**
    *   All click/tap elements occupy a minimum target size of `44x44px` on desktop monitors, and `48x48px` on tablets and mobile screens.
*   **Form Accessibility:**
    *   Inputs feature persistent labels. Error inputs are linked to descriptive help messages via `aria-describedby` elements.
*   **Accessible Charts:**
    *   Data visualizations use distinct dash configurations or line markers (e.g., solid, dashed, dotted lines) to distinguish data series without relying solely on color.

---

## 6. Keyboard Shortcuts

GPO establishes a system-wide hotkey structure to optimize operational workflows.

### 6.1 Shortcut Directory

| Category | Shortcut Command | Operational Event / Action |
| :--- | :--- | :--- |
| **Search / Global** | `Ctrl + K` | Instantly display the global search dialog box |
| **Global Control** | `Ctrl + Shift + P` | Display the system command palette menu |
| **Navigation** | `G` then `D` | Switch active module view to main Dashboard |
| **Navigation** | `G` then `T` | Switch active module view to Grid Topology |
| **Navigation** | `G` then `P` | Switch active module view to Policy Studio |
| **Navigation** | `G` then `S` | Switch active module view to Simulation Sandbox |
| **Navigation** | `G` then `A` | Switch active module view to Audit Logs |
| **Alarms** | `G` then `N` | Display active notifications list |
| **Actions** | `Ctrl + S` | Save active policy settings / config |
| **Actions** | `R` | Trigger manual refresh of grid telemetry |
| **Actions** | `?` | Toggle shortcut help overlay panel |
| **Modal / Dialog** | `Esc` | Cancel operation, dismiss modal / active menu |
| **Modal / Dialog** | `Enter` | Confirm operation, submit form config |

### 6.2 Implementation Strategy
*   Keys are bound globally. Custom shortcut helpers are embedded directly inside tooltips on buttons (e.g., a "Save" button tooltip displays `Save Config [Ctrl+S]`).

---

## 7. Form UX Standards

Forms in GPO are designed to support rapid entry, validate values, and prevent incorrect configurations.

*   **Label Placement:**
    *   Labels are persistent and top-aligned directly above input boxes, using uppercase Space Grotesk. Inline or floating labels are prohibited.
*   **Placeholder Text:**
    *   Only used to display formatting examples (e.g., `e.g. 50.02`), never replacing persistent label text.
*   **Required vs. Optional Fields:**
    *   Required inputs display a red asterisk (`*`) adjacent to their labels. Optional inputs feature the suffix `(optional)` in muted gray.
*   **Input Validation Timing:**
    *   Validate fields on focus loss (`blur`) or after input changes. Do not validate fields while the user is actively typing, as this creates visual distraction.
*   **Inline Validation & Errors:**
    *   Invalid fields are marked with a solid Red border (`#EF4444`). A descriptive error message is presented directly below the input field in Inter size `12px` red text.
*   **Success Feedback:**
    *   Form submissions present a green success toast indicator. The screen displays a clear status confirmation.
*   **Multi-Step Forms:**
    *   Renders as a structured wizard panel with step indicators showing progress (e.g., `Step 1 of 3: Configure Scenario`).

---

## 8. Validation Patterns

Grid configurations require verification to prevent physical hardware outages.

### 8.1 Validation Scenarios

*   **Required Fields Left Empty:**
    *   *Visual indicator:* Red input border.
    *   *Message:* `[ERR.VAL-EMPTY] Field is required. Enter value to proceed.`
*   **Invalid Value Formats:**
    *   *Visual indicator:* Red input border.
    *   *Message:* `[ERR.VAL-FORMAT] Invalid format. Use alphanumeric characters.`
*   **Duplicate Policy ID Registration:**
    *   *Visual indicator:* Red input border.
    *   *Message:* `[ERR.VAL-DUP] Policy ID already registered. Enter a unique identifier.`
*   **File Upload Validation:**
    *   *Visual indicator:* Alert toast.
    *   *Message:* `[ERR.FILE-EXT] Invalid file type. Upload only .yaml or .json files.`
*   **Date & Time Validation:**
    *   *Visual indicator:* Red border on datetime fields.
    *   *Message:* `[ERR.DATE-OUT] Timestamp is out of range. Input must match the active simulation window.`
*   **Numeric Boundary Validation:**
    *   *Visual indicator:* Red input border.
    *   *Message:* `[ERR.VAL-LIMIT] Value outside safety limits (Min: 49.8 Hz, Max: 50.2 Hz).`
*   **API / Connection Failures:**
    *   *Visual indicator:* Centered alert card with retry triggers.
    *   *Message:* `[ERR.SYS-DISCONNECT] Connection to compiler lost. Retry connection.`

---

## 9. Error Messaging

Error messages are concise, objective, and focus on helping the user resolve the issue.

### 9.1 Message Structure

All error messages follow a three-part structure:
1.  **System Identifier:** JetBrains Mono error code (e.g., `[ERR.POL-PARSE]`).
2.  **Problem Summary:** Clear explanation of what went wrong, avoiding jargon.
3.  **Actionable Recovery:** Clear instructions on how to fix the issue.

### 9.2 Tone & Grammar
*   Objective, precise, and professional. Avoid exclamation marks, capitalized warning terms (e.g., do not use `FATAL ERROR`), or conversational text.

### 9.3 Examples

*   **Correct (System Error):**
    *   `[ERR.POL-PARSE-42] Invalid policy formatting on line 12. Recovery: Correct compiler syntax guidelines and re-upload file.`
*   **Incorrect:**
    *   `FATAL ERROR!! Uploaded file failed to parse!! Check your configuration again.`
*   **Correct (User Input Error):**
    *   `[ERR.VAL-LIMIT] Voltage limit exceeds maximum transformer boundaries (Max: 125 kV). Recovery: Enter a value below 125 kV.`

---

## 10. Confirmation Dialog Standards

Confirmation dialogs protect the system against accidental modifications or destructive grid overrides.

*   **When to Use Dialogs:**
    *   *Destructive Actions:* Deleting active policy files, reset configurations.
    *   *Save/Discard Changes:* Navigating away from pages with unsaved edits.
    *   *Critical Grid Overrides:* Manually opening breakers, forcing microgrid islanding.
*   **Interaction Barriers:**
    *   Manual grid overrides require the operator to toggle a confirmation switch before the confirm button becomes active.
*   **Button Sizing & Ordering:**
    *   Confirm actions are placed on the right, cancel actions on the left.
    *   Destructive confirm buttons use color `#EF4444` (Grid Red), constructive confirm buttons use `#FF7A1A` (Energy Orange), and cancel buttons use flat graphite styles.
*   **Wording Rules:**
    *   Titles are explicit (e.g., `Delete Policy NERC-PRC?`). The primary button matches the title action (e.g., `Confirm Delete`).

---

## 11. Responsive UX Rules

GPO scales across diverse device screens to support operators in the control room and engineers in the field.

### 11.1 Component Scaling Matrix

| Element Type | Desktop Monitor | Laptop Screen | Tablet Display | Mobile Viewport |
| :--- | :--- | :--- | :--- | :--- |
| **Navigation** | Persistent Left Sidebar | Collapsed Icon Sidebar | Hamburger Drawer | Hamburger Drawer |
| **Grid Tables** | 12 columns, full metrics | Scrollable columns | Collapsible details | Detail Cards |
| **Charts** | Sidebar + Main Area | Main Area | Dynamic height scaling | Hidden legends |
| **Forms** | 3-column rows | 2-column rows | Single-column rows | Single-column rows |
| **Side Drawers** | Slide out from margin | Slide out from margin | Slide over overlay | Full-screen modal |
| **Modals** | Centered popups | Centered popups | Screen fit | Full-screen frame |

---

## 12. Empty States

Empty state screens explain what is missing and guide the user on how to proceed.

*   **Visual Structure:**
    *   A centered container outline with a dashed border `#2A313C`.
    *   A wireframe vector graphic of the missing element (e.g., a disconnected node schematic).
    *   An alphanumeric placeholder tag in JetBrains Mono (e.g., `[SYS.DATA-EMPTY]`).
    *   A primary action button to resolve the state.
*   **Scenarios & Actions:**
    *   *No Search Matches:* Display `No results matching query.` Button: `Clear Filters`.
    *   *No Active Policies:* Display `No active policies loaded in compiler.` Button: `Create New Policy`.
    *   *No Network Telemetry:* Display `Connection to grid node lost.` Button: `Reconnect Node`.

---

## 13. Loading Experience

GPO visualizes loading states to reassure operators that data is processing.

*   **Skeleton Loaders:**
    *   Replace tables, KPIs, and card areas during loading with flat, pulsing gray blocks. Timing, transitions, and pulsing loops are defined in the [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md) specification.
*   **Progress Indicators:**
    *   *Under 1.5 seconds:* Display a simple status spinner. Easing and timing properties are governed by the [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md) specification.
    *   *Over 1.5 seconds:* Display a horizontal progress bar showing percent completion (e.g., `Deploying policy: 45%`). Progress animation states are governed by the [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md) specification.
*   **AI & Simulation Processing:**
    *   Display a monospaced log console showing current step validation (e.g., `COMPILING RULE NEGO_03... [OK]`). Scroll alignment and display transitions follow [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).

---

## 14. Notifications

Notifications communicate system updates without interrupting active workflows. For detailed entrance, exit, and vertical reordering animation rules, see the official [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md) specification.

*   **Toast Placements:**
    *   Appear at the top-right of the viewport. Multiple notifications stack vertically (max 4). Slide-in and reordering transitions are governed by [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
*   **Notification Sizing & Spacing:**
    *   Width: `320px`. Border: `1px` solid, matching the notification category.

### 14.1 Notification Classifications

*   **Success Toast:**
    *   *Border:* Grid Green (`#22C55E`).
    *   *Duration:* `3000ms`.
    *   *Usage:* Configuration saved, policy validation passed.
*   **Information Toast:**
    *   *Border:* Info Blue (`#3B82F6`).
    *   *Duration:* `4000ms`.
    *   *Usage:* New telemetry log imported.
*   **Warning Toast:**
    *   *Border:* Warning Yellow (`#F59E0B`).
    *   *Duration:* Persistent. Dismissible by operator.
    *   *Usage:* Telemetry lag, minor sags.
*   **Error / Critical Alert (Top Banner):**
    *   *Border:* Pulsing Grid Red (`#EF4444`). Pulse rate and banner entrance animations follow [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
    *   *Duration:* Persistent. Requires operator acknowledgment to dismiss.
    *   *Usage:* Tripped breakers, NERC policy violations, system disconnects.

---

## 15. UX Best Practices Summary

Developers and designers working on GPO must follow these best practices:

*   **Minimize Navigation Steps:** Ensure any grid coordinate or active alarm log is accessible in three clicks or fewer.
*   **Keep Telemetry Static:** Avoid layout shifts during real-time updates. Log grids and table coordinates must remain static, updating values in place.
*   **Enforce Safety Checks:** Emergency overrides and manual grid state modifications must require confirmation gates.
*   **Color Redundancy:** Always pair state colors with explicit labels to ensure readability for colorblind operators.
*   **Accessible Targets:** Ensure click/tap targets meet minimum size standards (`44x44px` on desktop) to support rapid operation.
*   **Performance First:** Interfaces must render and update instantly, ensuring zero lag during critical events.

---

## 16. Related Documents
*   [Product Vision](PRODUCT_VISION.md)
*   [Design System Specifications](DESIGN_SYSTEM.md)
*   [User Experience Standards](UX_GUIDELINES.md)
*   [Reusable Component Library](COMPONENT_LIBRARY.md)
*   [Motion Guidelines](MOTION_GUIDELINES.md)

---

## 17. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Enterprise UX Architect |
| v1.0.1 | July 23, 2026 | Delegated loading and notification motion to MOTION_GUIDELINES.md | Enterprise UX Architect |
