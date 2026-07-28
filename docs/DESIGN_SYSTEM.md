# Grid Policy Orchestrator (GPO)
## Design System Specifications

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Principal Design System Architect
*   **Phase:** Phase 0.3
*   **Last Updated:** July 22, 2026
*   **Purpose:** Establishes visual design tokens, layout grids, components spacing, and typography scales for GPO.

---

## Table of Contents
*   [1. Design Philosophy](#1-design-philosophy)
*   [2. Color System](#2-color-system)
*   [3. Typography](#3-typography)
*   [4. Layout System](#4-layout-system)
*   [5. Elevation & Shadows](#5-elevation--shadows)
*   [6. Border & Radius System](#6-border--radius-system)
*   [7. Visual States & Transitions](#7-visual-states--transitions)
*   [8. Iconography](#8-iconography)
*   [9. Data Visualization Standards](#9-data-visualization-standards)
*   [10. Accessibility Compliance](#10-accessibility-compliance)
*   [11. Design Tokens Reference](#11-design-tokens-reference)
*   [12. Related Documents](#12-related-documents)
*   [13. Revision History](#13-revision-history)

---

This document serves as the permanent visual and structural source of truth for the Grid Policy Orchestrator (GPO) platform. It translates the brand guidelines established in Phase 0.2 into a comprehensive, engineering-first, data-dense design system. 

All UI implementations, code components, and design mockups must adhere strictly to these rules.

---

## 1. Design Philosophy

To build operational trust and stability inside high-stress utility control environments, GPO follows seven core UI principles:

### 1.1 Function Before Decoration
Every graphical element in the interface must convey functional utility. Graphic highlights, borders, and fills are applied to delineate compartments, define layout hierarchies, and represent data status—never for aesthetic decoration.

### 1.2 Engineering-First Topology
Visual layouts must mirror physical grid topology structures. Display substations, transformers, generators, battery storage units, and breakers using logical, single-line schematics and node trees that match the operational mental models of power system engineers.

### 1.3 Data Readability & Density
Interfaces must support rapid parsing of dense telemetry numbers. Columns of numbers in tables must be right-aligned with aligned decimal coordinates. Code variables, identifiers, and logs use monospaced text to distinguish characters.

### 1.4 Accessibility (WCAG 2.1 AA)
All text, active states, and status badges must meet a minimum contrast ratio of 4.5:1 against their backdrops. Font scale hierarchies ensure readability at a distance on large control center wall displays.

### 1.5 Redundant Indicators
Never rely on color alone to communicate critical system states. All visual alarms, warning highlights, or node outages must pair color codes with explicit text states or symbolic indicators (e.g., matching a red outline with the text `[CRITICAL]` or symbol `[!]`).

### 1.6 Strict Consistency
All spacing, padding, layout grids, and visual states are locked to a strict mathematical scale. Consistency across all application layers reduces cognitive load, helping operators respond faster during emergencies.

### 1.7 Minimal Motion
Transitions and animations must follow a highly restricted, functional motion language. For comprehensive motion timing, easing curves, scroll containment, and interface interaction behaviors, refer to the official [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md) authority. Bouncing, looping, or complex animation sequences are prohibited.

---

## 2. Color System

The GPO color system is optimized for low-light control rooms to minimize operator eye strain during 12-hour shifts. 

### 2.1 Core Palette

| Role Name | HEX Code | RGB Code | Purpose & Component Mapping | A11y / Contrast Status |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Text** | `#F8FAFC` | `rgb(248, 250, 252)` | Main headers, numeric readouts, active states | Pass (21:1 on bg) |
| **Secondary Text** | `#94A3B8` | `rgb(148, 163, 184)` | Labels, sub-headers, unit descriptors | Pass (4.8:1 on surface) |
| **Muted Text** | `#64748B` | `rgb(100, 116, 139)` | Inactive table headers, metadata, timestamps | Pass (AA Large Text Only) |
| **Disabled Text** | `#475569` | `rgb(71, 85, 105)` | Disabled text, input placeholders | Excluded from AA |
| **Primary Accent** | `#FF7A1A` | `rgb(255, 122, 26)` | Energy Orange. Key actions, current pathways | Pass (5.1:1 on surface) |
| **Secondary Accent**| `#FFA940` | `rgb(255, 169, 64)` | Electric Amber. Active negotiations, highlights | Pass (4.9:1 on surface) |
| **Base Background** | `#0B0E13` | `rgb(11, 14, 19)` | Core dark window background frame | Dark Base |
| **Surface** | `#151A21` | `rgb(21, 26, 33)` | Primary card layout, panel compartments | Surface Level 1 |
| **Elevated Surface** | `#1C222B` | `rgb(28, 34, 43)` | Form fields, selected lists, inner inputs | Surface Level 2 |
| **Border** | `#2A313C` | `rgb(42, 49, 60)` | Solid separation boundaries between panels | Structural |

### 2.2 Status & State Colors

| State / Status | HEX Code | RGB Code | Application Mapping | A11y / Contrast |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Nominal**| `#22C55E` | `rgb(34, 197, 94)` | Active nodes, compliant policies, normal loops | Pass (AA Compliant) |
| **Warning / Sag** | `#F59E0B` | `rgb(245, 158, 11)` | Voltage fluctuations, thermal alerts, warnings | Pass (AA Compliant) |
| **Error / Critical** | `#EF4444` | `rgb(239, 68, 68)` | Tripped breakers, policy violations, shutdown | Pass (AA Compliant) |
| **Information** | `#3B82F6` | `rgb(59, 130, 246)` | Audit trails, policy compiler logs | Pass (AA Compliant) |
| **Hover State** | `#FF7A1A` | `rgb(255, 122, 26)` | Border shift on buttons, cards, list items | Focus / Action indicator |
| **Focus State** | `#3B82F6` | `rgb(59, 130, 246)` | Focus ring perimeters around active inputs | AAA Focus Compliant |
| **Selection State** | `#1C222B` | `rgb(28, 34, 43)` | Selected item background highlight | Contrast Compliant |

### 2.3 Domain-Specific Colors

*   **AI Agent Negotiation States:**
    *   *Idle / Sleep:* Muted Text (`#64748B`)
    *   *Active Negotiating:* Electric Amber (`#FFA940`)
    *   *Executing Decision:* Energy Orange (`#FF7A1A`)
    *   *Successful Resolution:* Grid Green (`#22C55E`)
    *   *Blocked / Terminated:* Grid Red (`#EF4444`)
*   **Grid Topology Elements:**
    *   *Active Line / Energized:* Energy Orange (`#FF7A1A`)
    *   *De-energized Line / Tripped:* Dark Border Gray (`#2A313C`)
    *   *Nominal Generator:* Grid Green (`#22C55E`)
    *   *Substation Node:* Secondary Slate (`#94A3B8`)
*   **Chart Visualization Palettes:**
    *   *Frequency Vector Line:* Energy Orange (`#FF7A1A`)
    *   *Voltage Vector Line:* Electric Amber (`#FFA940`)
    *   *Power Output Area:* Grid Green (`#22C55E`) with 10% opacity fill
    *   *Active Load Line:* Grid Red (`#EF4444`)
    *   *Grid Reference Axis Lines:* Slate Border (`#2A313C`)

---

## 3. Typography

GPO uses a three-family font system designed for clean UI hierarchies, industrial aesthetics, and maximum character readability.

### 3.1 Font Families
*   **Heading Font:** Space Grotesk (Geometric, angular accents. Fallback: system-ui, Segoe UI, sans-serif)
*   **Body Font:** Inter (Highly-legible UI interface sans. Fallback: -apple-system, BlinkMacSystemFont, Arial, sans-serif)
*   **Monospace Font:** JetBrains Mono (Optimized code/data font. Fallback: Consolas, Courier New, monospace)

### 3.2 Text Scale Hierarchy

| Token Name | Font Family | Size (rem / px) | Line Height | Case & Weight | Usage Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display` | Space Grotesk | `3.0rem // 48px` | `1.2` | Uppercase // Bold (700) | Giant telemetry overlays |
| `h1` | Space Grotesk | `2.25rem // 36px` | `1.3` | Uppercase // Bold (700) | Module headers, titles |
| `h2` | Space Grotesk | `1.5rem // 24px` | `1.35` | Uppercase // Semibold (600) | Section panel headers |
| `h3` | Space Grotesk | `1.125rem // 18px` | `1.4` | Uppercase // Semibold (600) | Card component titles |
| `h4` | Space Grotesk | `0.95rem // 15px` | `1.45` | Uppercase // Medium (500) | Sub-header groupings |
| `h5` | Space Grotesk | `0.85rem // 13px` | `1.4` | Uppercase // Medium (500) | Minor headers, metadata |
| `h6` | Space Grotesk | `0.75rem // 12px` | `1.35` | Uppercase // Semibold (600) | Small badge identifiers |
| `subtitle` | Inter | `1.05rem // 16px` | `1.5` | Sentence // Regular (400) | Header descriptions |
| `body_large`| Inter | `1.125rem // 18px` | `1.55` | Sentence // Regular (400) | Focus callout descriptions |
| `body` | Inter | `0.95rem // 15px` | `1.6` | Sentence // Regular (400) | Standard copy, body text |
| `body_small`| Inter | `0.85rem // 13px` | `1.55` | Sentence // Regular (400) | Status descriptions |
| `caption` | Inter | `0.75rem // 12px` | `1.5` | Sentence // Medium (500) | Table headers, footnotes |
| `label` | Space Grotesk | `0.75rem // 12px` | `1.35` | Uppercase // Medium (500) | Input field text labels |
| `button` | Space Grotesk | `0.8125rem // 13px` | `1.4` | Uppercase // Medium (500) | Interactive buttons |
| `code` | JetBrains Mono| `0.75rem // 12px` | `1.35` | None // Regular (400) | Telemetry logs, script parameters |

### 3.3 Typography Alignment & Layout Rules
*   **Max Line Length:** Body text columns must not exceed a maximum of **75 characters** (approx. 650px) to prevent reading fatigue.
*   **Alignment Standards:** Text blocks are left-aligned. Telemetry tables right-align all numeric values (ensuring decimal point alignment). Code blocks and monospace parameters left-align.
*   **Numeric Display:** Telemetry numbers must always feature their physical unit label using muted secondary text size `12px` (e.g., `50.02` `Hz` or `125` `MW`).

---

## 4. Layout System

The layout system is built on an **8px grid spacing system** to ensure strict visual alignment.

### 4.1 Grid & Breakpoints

| Breakpoint Token | Boundary Width | Layout Behavior | Grid Columns |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Single-column widgets, collapsible sidebar | 4 columns |
| **Tablet** | `768px - 1024px` | 2-column widget panels, mini icon-only sidebar | 8 columns |
| **Laptop** | `1024px - 1440px` | 12-column dashboard layout, persistent sidebar | 12 columns |
| **Desktop** | `> 1440px` | Max width locked to 1600px. Large dashboard layout | 12 columns |

### 4.2 Spacing Scale

Spacing tokens define margins, paddings, and component alignments:
*   `sp_1` (4px): Tight margins (e.g., gap between status dot and text label).
*   `sp_2` (8px): Cell paddings, label-to-input gap, icon spacing.
*   `sp_3` (12px): Form element labels, card title subtitle margins.
*   `sp_4` (16px): Input padding, button margins, tab bar item spacing.
*   `sp_5` (20px): Form section grouping paddings.
*   `sp_6` (24px): Card inner container padding.
*   `sp_7` (32px): Card-to-card structural layout spacing.
*   `sp_8` (40px): Page header margins.
*   `sp_9` (48px): Page section layouts.
*   `sp_10` (64px): Top hero container safety padding.
*   `sp_11` (80px): Large section divisions.

### 4.3 Border Radius & Shadows
*   **Radius Scale:**
    *   `radius_none` (0px): Input elements, form entries.
    *   `radius_sharp` (1px): Standard buttons, active selection states.
    *   `radius_card` (3px): Dashboard card containers, modal containers.
*   **Elevation Levels:** GPO relies on solid layout borders rather than dropshadow depth:
    *   *Level 0:* Base Background (`#0B0E13`). Flat.
    *   *Level 1:* Surface Panels (`#151A21`) with border (`#2A313C`).
    *   *Level 2:* Inner inputs, forms, and code blocks (`#1C222B`).
*   **Shadow Scale:**
    *   `shadow_none`: Default state for cards, tables, panels.
    *   `shadow_dropdown`: `0px 8px 16px rgba(0,0,0,0.4)` (Used for overlapping dropdowns/menus).

---

## 5. Motion System

Motion in GPO is designed purely for operational confirmation and warning events, minimizing CPU cycles and operator distraction.

### 5.1 Animation Scale

*   **Timing Scale:**
    *   `duration_immediate` (0ms): Instant state shifts (e.g., active telemetry graph coordinate plotting).
    *   `duration_fast` (120ms): Hover transitions, tooltips, list updates, checkbox switches.
    *   `duration_standard` (180ms): Modal fades, drawer panels sliding in from side borders.
*   **Easing Curves:**
    *   `ease_standard`: `cubic-bezier(0.16, 1, 0.3, 1)` (Used for drawer slides and modal popups).
    *   `ease_linear`: `linear` (Used only for progress bar loop tracks).

### 5.2 Motion Rules
*   **Reduced Motion:** Deactivate all animations immediately if the client system accessibility settings specify reduced motion.
*   **Telemetry Feeds:** Real-time data coordinate plots, line chart updates, and text numeric logs must transition instantly (`0ms`), avoiding lag or visual delay.
*   **Pulsing States:** Pulsing animations are restricted to active grid contingencies (e.g., flashing breaker symbol in red indicating a line trip).

---

## 6. Component Standards

This section defines the design specification for every component in GPO.

### 6.1 Buttons
*   **Purpose:** Triggers immediate actions, commands, state updates, or emergency overrides.
*   **Variants:** 
    *   *Primary:* Solid Energy Orange (`#FF7A1A`) background, white text.
    *   *Secondary:* Graphite surface, Energy Orange border.
    *   *Neutral:* Flat graphite surface.
    *   *Critical Override:* Solid Grid Red (`#EF4444`) background.
*   **States:** Default, Hover (border highlight shifts), Active/Pressed (surface shifts dark), Focus, Disabled.
*   **Sizing:** Height: `32px`. Inner padding: `12px` horizontal, `6px` vertical.
*   **Spacing:** Margin from adjacent components: `8px`.
*   **Accessibility:** Space Grotesk uppercase. Min target: `48x48px` bounding box. Include explicit label properties (`aria-label`) if using icon-only.
*   **Usage Rules:** Use primary buttons only for the main action on a page. Critical overrides require confirmation dialogs before execution.

### 6.2 Inputs
*   **Purpose:** Allows text or numerical entry for configuration parameters.
*   **Variants:** Text inputs, numeric inputs, password entries.
*   **States:** Default (Border `#2A313C`), Active Focus (Border `#3B82F6`), Validation Error (Border `#EF4444`), Disabled.
*   **Sizing:** Height: `32px`. Width: fits grid column mapping.
*   **Spacing:** Internal padding: `8px`. Margin bottom: `12px` (gap to adjacent label).
*   **Accessibility:** Label text must be persistently top-aligned; placeholder text must not replace the label.
*   **Usage Rules:** Use JetBrains Mono for all numeric entries to ensure character readability.

### 6.3 Text Fields
*   **Purpose:** Capture multi-line text blocks such as policy rules and audit remarks.
*   **Variants:** Multi-line textareas.
*   **States:** Default, Hover, Focused, Disabled.
*   **Sizing:** Minimum height: `96px`. Width: fills container column.
*   **Spacing:** Internal padding: `8px`.
*   **Accessibility:** Support scroll bars on overflow. Ensure focus rings do not clip.
*   **Usage Rules:** Restrict word wrap width to prevent horizontal scroll bars.

### 6.4 Checkboxes
*   **Purpose:** Allows multiple selections from a list of options.
*   **Variants:** Standard checkbox, indeterminate checkbox.
*   **States:** Checked (Orange fill), Unchecked, Hover, Disabled.
*   **Sizing:** Dimensions: `14x14px`. Radius: `1px`.
*   **Spacing:** Gap to label text: `8px`.
*   **Accessibility:** Checkbox labels must be clickable to toggle state.
*   **Usage Rules:** Group checkbox lists under a fieldset with a clear legend label.

### 6.5 Radio Buttons
*   **Purpose:** Select one option from a mutually exclusive list.
*   **Variants:** Standard radio button.
*   **States:** Selected (Orange center dot), Unselected, Hover, Disabled.
*   **Sizing:** Outer circle: `14x14px`. Center dot: `6x6px`.
*   **Spacing:** Gap to label text: `8px`.
*   **Accessibility:** Arrow keys transition selection within the radio group.
*   **Usage Rules:** Group radio buttons under a fieldset with a clear legend label.

### 6.6 Switches
*   **Purpose:** Toggles a feature state or grid asset online/offline.
*   **Variants:** Standard toggle switch.
*   **States:** Active (Orange background), Inactive (Graphite background), Focused, Disabled.
*   **Sizing:** Track size: `32x16px`. Knob circular diameter: `12x12px`.
*   **Spacing:** Gap to label text: `8px`.
*   **Accessibility:** Toggle triggers via Space bar.
*   **Usage Rules:** Toggle switches are restricted to non-critical operations. Direct grid state modifications require button triggers with confirmation dialogs.

### 6.7 Dropdowns
*   **Purpose:** Select one option from a collapsible panel of choices.
*   **Variants:** Standard dropdown, Multi-select dropdown.
*   **States:** Default, Hover, Opened, Disabled.
*   **Sizing:** Trigger height: `32px`. Option list max height: `200px` (scrollbar active).
*   **Spacing:** Option padding: `6px 12px`.
*   **Accessibility:** Keyboard support (arrow keys, Enter, Esc). Focus highlights options.
*   **Usage Rules:** Include search filters in dropdown lists exceeding 8 choices.

### 6.8 Autocomplete
*   **Purpose:** Fast selection within large datasets (e.g., selecting from thousands of grid line coordinates).
*   **Variants:** Text input with dynamic suggestion dropdown.
*   **States:** Default, Active Search, Selected, Disabled.
*   **Sizing:** Matches input heights. Option row height: `28px`.
*   **Spacing:** Option padding: `8px`.
*   **Accessibility:** Screen readers must declare option count changes.
*   **Usage Rules:** Input updates suggestion list instantly.

### 6.9 Search Bars
*   **Purpose:** Search logs, policies, coordinates, and events.
*   **Variants:** Global Search, Local Table Search.
*   **States:** Default, Active (Amber outline), Focused.
*   **Sizing:** Height: `32px`. Prefix search icon size: `14px`.
*   **Spacing:** Padding: `8px` horizontal.
*   **Accessibility:** Globally bound to `Ctrl+K`. Focus ring offsets to match AA perimeters.
*   **Usage Rules:** Search fields must feature a right-aligned clear action button.

### 6.10 Tables
*   **Purpose:** Primary register for telemetry logs, agent metrics, and policy audits.
*   **Variants:** Standard, compact, detail-expanded.
*   **States:** Default, Row Hover, Column Sorted.
*   **Sizing:** Row height: `36px`. Spacing separator: `1px`.
*   **Spacing:** Cell padding: `8px` vertical, `12px` horizontal.
*   **Accessibility:** Right-align numeric columns. Clear column header labels.
*   **Usage Rules:** Keep row hover effects fast (`120ms` transition) and functional.

### 6.11 Pagination
*   **Purpose:** Navigate paginated log lists.
*   **Variants:** Standard pagination control.
*   **States:** Default, Active page (Orange highlight), Hover, Disabled.
*   **Sizing:** Page box: `28x28px`. Gap: `4px`.
*   **Spacing:** Margin top: `16px` (gap to table baseline).
*   **Accessibility:** Navigation actions feature clear chevrons and label tags.
*   **Usage Rules:** Limit active pages to 5, using ellipsis markers on overflow.

### 6.12 Cards
*   **Purpose:** Structural container for widgets, logs, and metrics.
*   **Variants:** Standard Card, Hoverable Card.
*   **States:** Default, Hover (accent border highlight).
*   **Sizing:** Inner padding: `24px`. Corner radius: `3px`.
*   **Spacing:** Layout gap margins: `24px` or `32px` depending on grid alignment.
*   **Accessibility:** Semantic header mapping. Heading elements match hierarchy.
*   **Usage Rules:** Card surfaces use background color `#151A21` and border `#2A313C`.

### 6.13 Dialogs
*   **Purpose:** Modal confirmations, override gates, or detail popups.
*   **Variants:** Modal Dialog, Action Confirm Sheet.
*   **States:** Opened (fades active), Dismissed.
*   **Sizing:** Z-index: `1050`. Width: `480px` or `640px`. Padding: `32px`.
*   **Accessibility:** Escape key exits. Focus is trapped inside dialog perimeters.
*   **Usage Rules:** Dialogs must feature a clear `Close` button at top-right.

### 6.14 Drawers
*   **Purpose:** Collapsible panel for telemetry parameters.
*   **Variants:** Right-aligned drawer, Left-aligned navigation drawer.
*   **States:** Hidden, Active Open (slides left).
*   **Sizing:** Width: `420px`. Transition: `180ms` easing curve.
*   **Spacing:** Internal margins: `24px`.
*   **Accessibility:** Focus is trapped. Sliding transition is capped at `180ms` standard timing.
*   **Usage Rules:** Retain scroll context within drawers on resize.

### 6.15 Tooltips
*   **Purpose:** Hover details explaining terms or variables.
*   **Variants:** Top, Bottom, Left, Right alignments.
*   **States:** Hidden, Active (fade active).
*   **Sizing:** Sizing: fits content. Z-index: `1080`.
*   **Spacing:** Padding: `6px 10px`. Margins: `8px` offset.
*   **Accessibility:** Trigger via mouse hover or focus ring. Max width: `200px`.
*   **Usage Rules:** Background uses Almost Black (`#0B0E13`), border: `1px`.

### 6.16 Badges
*   **Purpose:** Small status tags (e.g. system status, policy state).
*   **Variants:** Nominal, Warning, Critical, Information, Default.
*   **States:** Static.
*   **Sizing:** Height: `22px`. Padding: `2px 6px`. Font size: `12px` Mono.
*   **Spacing:** Gap to text: `4px`.
*   **Accessibility:** Ensure background/text meets contrast requirements (see Section 2 table).
*   **Usage Rules:** Keep badges small, single-word parameters.

### 6.17 Tabs
*   **Purpose:** Switch panel views within a component card.
*   **Variants:** Underlined Tabs, Block Tabs.
*   **States:** Default tab, Selected tab (Orange underline), Hover tab.
*   **Sizing:** Height: `36px`. Font: Space Grotesk.
*   **Spacing:** Tab spacing gap: `16px`.
*   **Accessibility:** Apply tab key navigation support.
*   **Usage Rules:** Keep tab lists horizontal.

### 6.18 Navbar
*   **Purpose:** Global header showing monogram logo and runtime indicator.
*   **Variants:** Sticky Top Navbar.
*   **States:** Default.
*   **Sizing:** Height: `48px`. Border separator: `2px` Orange.
*   **Spacing:** Margin-bottom: `32px` (gap to content canvas).
*   **Accessibility:** Brand logo links to home dashboard view.
*   **Usage Rules:** Logo, title, status badge left-aligned; profile settings right-aligned.

### 6.19 Sidebar
*   **Purpose:** Left navigation panel to swap module views.
*   **Variants:** Collapsible Icon Sidebar, Expanded Text Sidebar.
*   **States:** Default item, Hover item, Active item.
*   **Sizing:** Width: `220px` (expanded), `64px` (collapsed).
*   **Spacing:** Internal item padding: `12px` vertical, `16px` horizontal.
*   **Accessibility:** Sidebar list uses standard HTML navigation tags.
*   **Usage Rules:** Active menu item displays a solid Orange border line highlight.

### 6.20 Breadcrumbs
*   **Purpose:** Displays current layout location path.
*   **Variants:** Standard path navigation.
*   **States:** Clickable link segment, Static current page segment.
*   **Sizing:** Font size: `12px` JetBrains Mono.
*   **Spacing:** Gap: `8px`. Divider: slash (`/`).
*   **Accessibility:** Navigable via Tab indexing.
*   **Usage Rules:** Final text segment is plain text.

### 6.21 Charts
*   **Purpose:** Live telemetry graphs.
*   **Variants:** Line, Bar, Area, Pie, Donut, Heat Map.
*   **States:** Idle, Loading, Live telemetry update.
*   **Sizing:** Width: fits card container. Height: `240px` minimum.
*   **Spacing:** Axis paddings: `16px`.
*   **Accessibility:** Clickable legend elements to toggle line series visibility.
*   **Usage Rules:** Grid lines use Slate Border (`#2A313C`), background uses Surface.

### 6.22 Timeline
*   **Purpose:** History feed tracking agent actions and compliance reviews.
*   **Variants:** Vertical chronological step path.
*   **States:** Completed (Green highlight), Pending (Muted grey).
*   **Sizing:** Step dot: `10x10px`. Pathway line: `2px`.
*   **Spacing:** Gap between steps: `24px`.
*   **Accessibility:** Declare dynamic timeline additions to screen readers.
*   **Usage Rules:** Telemetry details are in JetBrains Mono.

### 6.23 Notification Cards
*   **Purpose:** Real-time alert cards.
*   **Variants:** Info, Warning (Amber border), Alarm (Red border and highlight).
*   **States:** Default, Hover, Dismissed.
*   **Sizing:** Padding: `16px`. Height is dynamic based on text length.
*   **Spacing:** Gap between cards: `8px`.
*   **Accessibility:** Alarms play a low-frequency sound. Include clear dismissal triggers.
*   **Usage Rules:** Notifications contain timestamp and priority levels.

### 6.24 KPI Cards
*   **Purpose:** Large metric summaries.
*   **Variants:** Numeric Value Card, Status Metric Card.
*   **States:** Default, Out-of-bounds (Red border and highlight).
*   **Sizing:** Value font size: Space Grotesk `24px`.
*   **Spacing:** Gap to title: `4px`. Card padding: `20px`.
*   **Accessibility:** Display scale units clearly.
*   **Usage Rules:** KPI Cards must present comparative baseline percentages.

### 6.25 Agent Cards
*   **Purpose:** Monitor individual AI agent negotiation and decision parameters.
*   **Variants:** Substation Agent Card, DER Agent Card.
*   **States:** Idle, Negotiating, Executing, Success, Blocked.
*   **Sizing:** Sizing matches layout grids. Card padding: `16px`.
*   **Spacing:** Gap to adjacent cards: `24px`.
*   **Accessibility:** Manual override triggers must be visible and accessible.
*   **Usage Rules:** Agent telemetry values must be presented in monospace format.

### 6.26 Policy Cards
*   **Purpose:** View details of dynamic policy constraints.
*   **Variants:** Security Policy, Tariff Policy, Environmental Policy.
*   **States:** Active, Pending, Deactivated.
*   **Sizing:** Sizing fits container grids. Card padding: `20px`.
*   **Spacing:** Margin-bottom: `16px`.
*   **Accessibility:** Code references are screen reader indexed.
*   **Usage Rules:** Visual outlines reflect the policy states.

### 6.27 Simulation Cards
*   **Purpose:** Configuration controls for the digital twin simulator.
*   **Variants:** Active Simulator Config.
*   **States:** Configuration, Running (with progress indicators), Completed.
*   **Sizing:** Card padding: `24px`.
*   **Spacing:** Action buttons space gap: `12px`.
*   **Accessibility:** Contrast compliant simulator control buttons.
*   **Usage Rules:** Group simulator parameters under logical tabs.

### 6.28 Grid Node Cards
*   **Purpose:** Monitored physical grid node metrics.
*   **Variants:** Generator Node Card, Breaker Node Card, Transformer Node Card.
*   **States:** Online (Nominal green status indicator), Offline, Tripped.
*   **Sizing:** Height: `120px` standard. Padding: `16px`.
*   **Spacing:** Gap between cards: `16px`.
*   **Accessibility:** Status indicators must include accessible text labels.
*   **Usage Rules:** Node values must utilize JetBrains Mono format.

### 6.29 Status Indicators
*   **Purpose:** Small status lights showing system and node health.
*   **Variants:** Circular status dot.
*   **States:** Nominal (Green), Warning (Amber), Critical (Red Flashing), Offline (Gray).
*   **Sizing:** Dot size: `6x6px`. Outlined by soft matching shadow glow.
*   **Spacing:** Gap to text: `4px`.
*   **Accessibility:** Must always be paired with adjacent text labels.
*   **Usage Rules:** Flashing states are limited to Critical.

### 6.30 Progress Bars
*   **Purpose:** Visual tracking for policy compilations and uploads.
*   **Variants:** Standard horizontal track progress bar.
*   **States:** Active progress (orange bar), Completed progress (green bar).
*   **Sizing:** Height: `4px`. Width fills parent card.
*   **Spacing:** Margin-bottom: `8px`.
*   **Accessibility:** Incorporate active `aria-valuenow` attributes.
*   **Usage Rules:** The bar uses a flat track without gradients.

### 6.31 Avatars
*   **Purpose:** Displays active user profile details.
*   **Variants:** Initials-only circular badge.
*   **States:** Default. Hover displays active menu overlays.
*   **Sizing:** Sizing: `24x24px`. Corner radius: circle shape.
*   **Spacing:** Margin-left: auto (aligned to navbar right).
*   **Accessibility:** High visual contrast text on background.
*   **Usage Rules:** Place user initials inside the circle, avoiding images.

### 6.32 Menus
*   **Purpose:** Floating selection or action list menus.
*   **Variants:** Contextual menu overlay, Dropdown menu panel.
*   **States:** Hidden, Active Opened.
*   **Sizing:** Width: `180px` standard. Z-index: `1000`.
*   **Spacing:** Inner row height: `28px`. Padding: `4px`.
*   **Accessibility:** Complete tab and arrow key selector support.
*   **Usage Rules:** Menus close immediately on window blur.

---

## 7. State System

Consistent state styling ensures that operators can immediately distinguish interactive and operational states.

### 7.1 Visual Specifications

*   **Default State:** Component uses base border `#2A313C` and Secondary Text `#94A3B8`. Standard cursor.
*   **Hover State:** Component border shifts to Energy Orange (`#FF7A1A`). Pointer cursor. Timing and easing properties are governed by the [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md) specification.
*   **Focus State:** Component is outlined with a `2px` thick focus ring in color `#3B82F6` with a `2px` offset. Prevents border overlaps.
*   **Pressed State:** Component background shifts down to dark graphite (`#151A21`). Font color shifts to white (`#F8FAFC`).
*   **Selected State:** Component inherits Primary Accent Orange border highlight on its left edge. Background uses Elevated Surface.
*   **Active State:** Component retains active orange highlight. Text uses white `#F8FAFC`.
*   **Disabled State:** Component background uses `#0F1318`. Text uses `#475569`. Not focusable. Cursor is forbidden.
*   **Loading State:** Telemetry values are replaced with flat loading skeletons (Elevated Surface fills). Cursor is wait spinner. Pulse timings, fade animations, and progress bar speeds are governed by [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
*   **Success State:** Component status badge uses Grid Green (`#22C55E`) text and border.
*   **Warning State:** Component status badge uses Warning Amber (`#F59E0B`) text and border.
*   **Error State:** Component status badge uses Grid Red (`#EF4444`) text and border.
*   **Empty State:** Empty tables or registers display dotted perimeters and error code tag: `[ERR.NODE-NULL-0]`.
*   **Offline State:** Interface displays grey header bar with text: `[OFFLINE - AGENT DISCONNECTED]`. Telemetry values freeze.
*   **Maintenance State:** Interface displays centered secure overlay: `[MAINTENANCE MODE - SYS SECURE]`. Values are read-only.

---

## 8. Iconography

### 8.1 Library Recommendation
*   **Library:** Lucide Icons. Standardizes on clean vector shapes that align to grid coordinates.

### 8.2 Rendering Rules
*   **Icon Sizing:**
    *   *Inline Tables / Lists:* `16x16px`.
    *   *Card Headers / Tooltips:* `18x18px`.
    *   *Main Nav / Actions:* `24x24px`.
*   **Stroke Widths:** Lock stroke weight to `2.0px` for standard UI elements and `1.5px` for large schematic drawings.
*   **Filled vs Outline:** Icons use outline rendering. Fills are forbidden (except for warning indicators).
*   **Accessibility:** Interactive icons require `aria-label` or `title` elements. Non-interactive icons require `aria-hidden="true"`.

---

## 9. Data Visualization Standards

Data visualization elements must maximize readability and eliminate visual clutter.

*   **Line Charts:** Telemetry vector paths use linear coordinates; do not use curved spline rendering. Stroke weight is locked to `1.5px`. Axis grid lines use `#2A313C`.
*   **Bar Charts:** Bar boundaries use `1px` solid outlines. Fill transparency is locked to `15%`.
*   **Area Charts:** Gradient fills transition from `10%` opacity down to `0%` transparent.
*   **Pie / Donut Charts:** Donut ring thickness: `8px`. Display numerical total in monospace format in the center of the ring.
*   **Heat Maps:** Grid boxes use `1px` border spacing. Colors scale from green to red.
*   **Grid Network Topology:** Substations display as node blocks, buses as solid lines (`#94A3B8`), and breakers as squares. Open breakers are outlines; closed breakers are solid blocks.
*   **Legends & Axis:** Legend indicators use Space Grotesk size `11px` uppercase. Axis labels use JetBrains Mono size `10px` color `#64748B`.
*   **Tooltip Design:** Card pops up instantly on hover (using Elevated Surface background), showing exact telemetry coordinate values.

---

## 10. Accessibility Compliance

GPO adheres to NERC CIP control guidelines and WCAG 2.1 AA accessibility perimeters:

*   **Contrast Ratios:** Text-to-background contrast ratio must be at least `4.5:1` for normal text and `3.0:1` for display text.
*   **Keyboard Controls:** Full keyboard support. Navigating views using Tab key moves focus in a logical hierarchy.
*   **Focus Rings:** Focus indicators are `#3B82F6` blue rings, `2px` thick, offset by `2px`. Outline styles are prohibited.
*   **ARIA attributes:** Form inputs and interactive topology elements must map standard accessibility roles (e.g. `role="button"`, `role="tablist"`).
*   **Touch Targets:** Interactive targets must map to a minimum size of `44x44px` on desktop and mobile screens.
*   **Color Blind Compatibility:** Design states must never rely on color alone. Redundant labels (e.g., `[TRIPPED]` in red) must be used.

---

## 11. Design Tokens Reference

The full token tree is defined in the companion file at [design-tokens.json](../design-tokens.json). Use these values in compile scripts or stylesheets:

```json
{
  "global": {
    "color": {
      "base": {
        "bg": "#0B0E13",
        "surface": "#151A21",
        "elevated": "#1C222B",
        "border": "#2A313C"
      },
      "accent": {
        "primary": "#FF7A1A",
        "secondary": "#FFA940"
      },
      "status": {
        "success": "#22C55E",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "info": "#3B82F6"
      }
    },
    "font": {
      "family": {
        "heading": "'Space Grotesk', sans-serif",
        "body": "'Inter', sans-serif",
        "monospace": "'JetBrains Mono', monospace"
      }
    }
  }
}
```

---

## 12. Related Documents
*   [Brand Guidelines](BRAND_GUIDELINES.md)
*   [User Experience Standards](UX_GUIDELINES.md)
*   [Reusable Component Library](COMPONENT_LIBRARY.md)
*   [Motion Guidelines](MOTION_GUIDELINES.md)
*   [design-tokens.json](../design-tokens.json)

---

## 13. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Principal Design System Architect |
| v1.0.1 | July 23, 2026 | Delegated motion parameters to MOTION_GUIDELINES.md | Principal Design System Architect |
