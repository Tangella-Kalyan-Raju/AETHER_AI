# Grid Policy Orchestrator (GPO)
## Reusable Component Library

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Enterprise UI Component Architect
*   **Phase:** Phase 0.6
*   **Last Updated:** July 22, 2026
*   **Purpose:** Mapped specification of all common and domain-specific reusable components, their properties, variants, and states.

---

## Table of Contents
*   [1. Navigation Components](#1-navigation-components)
    *   [1.1 Sidebar](#11-sidebar)
    *   [1.2 Navbar](#12-navbar)
    *   [1.3 Breadcrumb](#13-breadcrumb)
    *   [1.4 Menu](#14-menu)
    *   [1.5 Command Palette](#15-command-palette)
    *   [1.6 Search Bar](#16-search-bar)
*   [2. Buttons](#2-buttons)
    *   [2.1 Button](#21-button)
    *   [2.2 Icon Button](#22-icon-button)
    *   [2.3 Floating Action Button (FAB)](#23-floating-action-button-fab)
    *   [2.4 Button Group](#24-button-group)
*   [3. Forms](#3-forms)
    *   [3.1 Text Input](#31-text-input)
    *   [3.2 Password Input](#32-password-input)
    *   [3.3 Search Input](#33-search-input)
    *   [3.4 Number Input](#34-number-input)
    *   [3.5 Textarea](#35-textarea)
    *   [3.6 Checkbox](#36-checkbox)
    *   [3.7 Radio Button](#37-radio-button)
    *   [3.8 Switch](#38-switch)
    *   [3.9 Select](#39-select)
    *   [3.10 Multi Select](#310-multi-select)
    *   [3.11 Date Picker](#311-date-picker)
    *   [3.12 File Upload](#312-file-upload)
*   [4. Data Display](#4-data-display)
    *   [4.1 Card](#41-card)
    *   [4.2 KPI Card](#42-kpi-card)
    *   [4.3 Data Table](#43-data-table)
    *   [4.4 Badge](#44-badge)
    *   [4.5 Chip](#45-chip)
    *   [4.6 Tag](#46-tag)
    *   [4.7 Tooltip](#47-tooltip)
    *   [4.8 Accordion](#48-accordion)
    *   [4.9 Tabs](#49-tabs)
    *   [4.10 Timeline](#410-timeline)
    *   [4.11 Progress Bar](#411-progress-bar)
    *   [4.12 Avatar](#412-avatar)
    *   [4.13 Pagination](#413-pagination)
*   [5. Feedback Components](#5-feedback-components)
    *   [5.1 Modal](#51-modal)
    *   [5.2 Drawer](#52-drawer)
    *   [5.3 Toast](#53-toast)
    *   [5.4 Alert](#54-alert)
    *   [5.5 Confirmation Dialog](#55-confirmation-dialog)
    *   [5.6 Empty State](#56-empty-state)
    *   [5.7 Error State](#57-error-state)
    *   [5.8 Loading State](#58-loading-state)
    *   [5.9 Skeleton Loader](#59-skeleton-loader)
    *   [5.10 Spinner](#510-spinner)
*   [6. Charts](#6-charts)
    *   [6.1 Chart Container](#61-chart-container)
    *   [6.2 Line Chart](#62-line-chart)
    *   [6.3 Bar Chart](#63-bar-chart)
    *   [6.4 Area Chart](#64-area-chart)
    *   [6.5 Pie Chart](#65-pie-chart)
    *   [6.6 Heat Map](#66-heat-map)
    *   [6.7 Legend](#67-legend)
    *   [6.8 Filter Panel](#68-filter-panel)
*   [7. Domain Components](#7-domain-components)
    *   [7.1 Grid Node Card](#71-grid-node-card)
    *   [7.2 Transmission Line Card](#72-transmission-line-card)
    *   [7.3 Substation Card](#73-substation-card)
    *   [7.4 Scenario Card](#74-scenario-card)
    *   [7.5 Simulation Card](#75-simulation-card)
    *   [7.6 Policy Card](#76-policy-card)
    *   [7.7 Policy Selector](#77-policy-selector)
    *   [7.8 Agent Card](#78-agent-card)
    *   [7.9 Recommendation Card](#79-recommendation-card)
    *   [7.10 Explainability Card](#710-explainability-card)
    *   [7.11 Decision Card](#711-decision-card)
    *   [7.12 Risk Card](#712-risk-card)
    *   [7.13 Notification Card](#713-notification-card)
    *   [7.14 Audit Log Item](#714-audit-log-item)
*   [8. Logically Added Enterprise Components](#8-logically-added-enterprise-components)
    *   [8.1 Grid Schema Visualizer (Interactive Canvas Component)](#81-grid-schema-visualizer-interactive-canvas-component)
    *   [8.2 Terminal Console Component](#82-terminal-console-component)
    *   [8.3 MFA Code Input Component](#83-mfa-code-input-component)
*   [9. Related Documents](#9-related-documents)
*   [10. Revision History](#10-revision-history)

---

This document serves as the master inventory and specification directory of all reusable UI components planned for the Grid Policy Orchestrator (GPO) platform. 

Developers and designers must reuse these components to ensure absolute operational consistency and prevent visual duplication across screens.

---

## 1. Navigation Components

### 1.1 Sidebar
*   **Purpose:** Houses the main application module links.
*   **Description:** A persistent left vertical navigation drawer containing the application's main route targets.
*   **Category:** Navigation
*   **Props:**
    *   `isCollapsed` (Toggles expanded text labels vs. icon-only view) — Boolean
    *   `activeRoute` (Highlights the current page link) — String
    *   `onCollapseChange` (Event fired when toggling layout size) — Function
*   **Variants:** Persistent (Desktop), Collapsible (Laptop/Tablet).
*   **States:** Default, Hover (links), Active/Selected link, Focused link.
*   **Accessibility:** 
    *   *Keyboard:* Tab navigates list links; Arrow keys move between links.
    *   *Screen Reader:* Wrapped in semantic `<nav aria-label="Main Navigation">` elements; active links set `aria-current="page"`.
    *   *Focus:* Focused link displays a `2px` offset blue ring.
*   **Usage Guidelines:**
    *   *When to use:* Main layout sidebar navigation.
    *   *When not to use:* Inside settings cards or dialog boxes.
    *   *Best practices:* Keep menu labels static. Icon mappings must align with Brand Guidelines.

### 1.2 Navbar
*   **Purpose:** Houses logo branding, global status indicators, user clearances, and search hooks.
*   **Description:** A horizontal top bar fixed to the top viewport edge.
*   **Category:** Navigation
*   **Props:**
    *   `systemStatus` (Nominal, Warning, Critical indicators) — Enum
    *   `userInitials` (Profile trigger text) — String
    *   `securityClearance` (Active permission level badge) — String
*   **Variants:** Sticky (Default).
*   **States:** Default.
*   **Accessibility:** 
    *   *Keyboard:* Tab navigates user profile triggers and notifications.
    *   *Screen Reader:* logo has `aria-label="GPO Home"`.
    *   *Focus:* Profile trigger outline visible on selection.
*   **Usage Guidelines:**
    *   *When to use:* Page framework headers.
    *   *When not to use:* Secondary dashboard compartments.

### 1.3 Breadcrumb
*   **Purpose:** Displays the user's position in the screen hierarchy.
*   **Description:** A text path split by dividers showing navigation routes.
*   **Category:** Navigation
*   **Props:**
    *   `items` (List of label and route configurations) — Array
*   **Variants:** Compact (Default).
*   **States:** Default, Item Hover, Inactive (current page).
*   **Accessibility:**
    *   *Keyboard:* Tab navigates intermediate links.
    *   *Screen Reader:* Wrapped in `<nav aria-label="Breadcrumb">`; last item uses `aria-current="page"`.
*   **Usage Guidelines:**
    *   *When to use:* Deep-level sub-pages (e.g., substation details).
    *   *When not to use:* Main top-level module landing pages.

### 1.4 Menu
*   **Purpose:** Action overlays triggered by button clicks.
*   **Description:** Floating cards displaying lists of operations (e.g., user options, export formats).
*   **Category:** Navigation
*   **Props:**
    *   `isOpen` (Controls display state) — Boolean
    *   `triggerId` (Anchor reference position) — String
    *   `onClose` (Fires on dismissal) — Function
*   **Variants:** Standard Popover, Contextual List.
*   **States:** Hidden, Open, Item Hover, Item Selected.
*   **Accessibility:**
    *   *Keyboard:* Arrow keys move selection; Esc closes; Enter triggers choice.
    *   *Screen Reader:* Uses `role="menu"`, items use `role="menuitem"`.
*   **Usage Guidelines:**
    *   *When to use:* Secondary contextual actions.
    *   *When not to use:* Primary navigation layouts.

### 1.5 Command Palette
*   **Purpose:** Unified operational control input.
*   **Description:** Centered popover capturing system commands, routing shortcuts, and search targets.
*   **Category:** Navigation
*   **Props:**
    *   `isOpen` (Toggle state) — Boolean
    *   `onTriggerAction` (Executes selected script or navigation) — Function
*   **Variants:** Global overlay.
*   **States:** Open, Active Search, Selected Result.
*   **Accessibility:**
    *   *Keyboard:* Triggered by `Ctrl+Shift+P`. Arrow keys navigate suggestions; Esc closes.
    *   *Screen Reader:* Declares autocomplete behavior and query matches.
*   **Usage Guidelines:**
    *   *When to use:* Rapid command inputs.
    *   *When not to use:* Simple boolean settings adjustments.

### 1.6 Search Bar
*   **Purpose:** Local and global queries.
*   **Description:** Input field with magnifying glass icon and clear button.
*   **Category:** Navigation
*   **Props:**
    *   `placeholder` (Hint text) — String
    *   `query` (Active value) — String
    *   `onQueryChange` (Fires on input change) — Function
*   **Variants:** Embedded Navbar, Large Card Search.
*   **States:** Default, Focused (Amber border), Active Typing.
*   **Accessibility:**
    *   *Keyboard:* Bound to `Ctrl+K`. Tab focuses clear button.
    *   *Screen Reader:* Label maps search intent explicitly.
*   **Usage Guidelines:**
    *   *When to use:* Tables and dashboard logs.
    *   *When not to use:* Standard numerical values.

---

## 2. Buttons

### 2.1 Button
*   **Purpose:** Triggers operations or transitions.
*   **Description:** Standard action control button.
*   **Category:** Buttons
*   **Props:**
    *   `label` (Display text) — String
    *   `variant` (Visual style class) — Enum
    *   `isDisabled` (Toggles interactive state) — Boolean
*   **Variants:** Primary (Orange), Secondary (Outline), Neutral (Flat Surface), Critical (Red).
*   **States:** Default, Hover, Pressed/Active, Focus, Disabled, Loading (Spinner icon).
*   **Accessibility:**
    *   *Keyboard:* Triggered by Enter and Space.
    *   *Screen Reader:* Declares disabled state; loading button announces activity.
*   **Usage Guidelines:**
    *   *When to use:* Forms, dialog actions.
    *   *When not to use:* Link navigation between pages.

### 2.2 Icon Button
*   **Purpose:** Interactive compact actions.
*   **Description:** Square button containing an outline vector icon without text.
*   **Category:** Buttons
*   **Props:**
    *   `iconName` (Target Lucide icon) — String
    *   `tooltip` (Help text) — String
    *   `variant` (Orange, Muted border) — Enum
*   **Variants:** Standard, Borderless.
*   **States:** Default, Hover, Focused, Pressed, Disabled.
*   **Accessibility:**
    *   *Screen Reader:* Must feature `aria-label` describing the action.
*   **Usage Guidelines:**
    *   *When to use:* Toolbar options, close buttons.
    *   *When not to use:* Major form decisions.

### 2.3 Floating Action Button (FAB)
*   **Purpose:** Quick access to primary module actions.
*   **Description:** Circular action icon floating above layout grids.
*   **Category:** Buttons
*   **Props:**
    *   `iconName` (Target icon) — String
    *   `onClick` (Fires on trigger) — Function
*   **Variants:** Standard Circle, Extended (Icon + Text).
*   **States:** Default, Hover, Focused, Pressed.
*   **Accessibility:**
    *   *Focus:* Visible focus ring; z-index matches active layers.
*   **Usage Guidelines:**
    *   *When to use:* Simulation builder shortcuts.
    *   *When not to use:* Telemetry table displays.

### 2.4 Button Group
*   **Purpose:** Segmented selection controls.
*   **Description:** Horizontal block of adjacent buttons with merged inner borders.
*   **Category:** Buttons
*   **Props:**
    *   `options` (Label list) — Array
    *   `selectedOption` (Currently selected segment) — String
*   **Variants:** Text, Icon-only.
*   **States:** Default, Hover, Selected.
*   **Accessibility:**
    *   *Keyboard:* Arrow keys cycle segments.
    *   *Screen Reader:* Role mapped to `role="group"`.
*   **Usage Guidelines:**
    *   *When to use:* Filtering logs, switching chart resolutions.
    *   *When not to use:* Independent, unrelated form choices.

---

## 3. Forms

### 3.1 Text Input
*   **Purpose:** Captures single-line alphanumeric text.
*   **Description:** Standard rectangular text input.
*   **Category:** Forms
*   **Props:**
    *   `value` (Current text) — String
    *   `label` (Form field header) — String
    *   `hasError` (Toggles validation state) — Boolean
*   **Variants:** Default, Outlined.
*   **States:** Default, Hover, Focused (Blue offset), Error (Red border), Disabled.
*   **Accessibility:**
    *   *Screen Reader:* Linked to help messages using `aria-describedby`.
*   **Usage Guidelines:**
    *   *When to use:* Names, IDs, codes.
    *   *When not to use:* Numeric data fields.

### 3.2 Password Input
*   **Purpose:** Captures secure passcode credentials.
*   **Description:** Text input masking characters by default with toggle view option.
*   **Category:** Forms
*   **Props:**
    *   `value` (Password value) — String
*   **Variants:** Secure.
*   **States:** Default, Hover, Focused, Error, Disabled.
*   **Accessibility:**
    *   *Screen Reader:* Requires correct input type mapping (`type="password"`).
*   **Usage Guidelines:**
    *   *When to use:* Login, Signup, Reset Password.
    *   *When not to use:* Standard parameters.

### 3.3 Search Input
*   **Purpose:** Filters lists or datasets in real time.
*   **Description:** Text field with magnifying glass icon and clear button.
*   **Category:** Forms
*   **Props:**
    *   `value` — String
    *   `onSearch` — Function
*   **Variants:** Compact.
*   **States:** Default, Focused, Typing.
*   **Accessibility:**
    *   *Screen Reader:* Set role to `searchbox`.
*   **Usage Guidelines:**
    *   *When to use:* Table searching.
    *   *When not to use:* Custom configuration forms.

### 3.4 Number Input
*   **Purpose:** Capture numeric parameters.
*   **Description:** Form field with right-aligned value indicators and scale units.
*   **Category:** Forms
*   **Props:**
    *   `value` (Numeric value) — Float/Int
    *   `unit` (Unit indicator like MW, kV, Hz) — String
    *   `min` / `max` (Constraint limits) — Float
*   **Variants:** Decimals, Integers.
*   **States:** Default, Hover, Focused, Out-of-bounds, Disabled.
*   **Accessibility:**
    *   *Keyboard:* Arrow keys increase/decrease value.
*   **Usage Guidelines:**
    *   *When to use:* Voltages, frequencies, generation levels.
    *   *When not to use:* Freeform text.

### 3.5 Textarea
*   **Purpose:** Capture multi-line text blocks.
*   **Description:** Expandable input field.
*   **Category:** Forms
*   **Props:**
    *   `value` — String
    *   `maxCharacters` — Integer
*   **Variants:** Standard, Fixed-Height.
*   **States:** Default, Hover, Focused, Error, Disabled.
*   **Accessibility:**
    *   *Keyboard:* Supports standard paragraph breaks.
*   **Usage Guidelines:**
    *   *When to use:* Policy rules description.
    *   *When not to use:* Single parameters.

### 3.6 Checkbox
*   **Purpose:** Select multiple options.
*   **Description:** Square check input.
*   **Category:** Forms
*   **Props:**
    *   `isChecked` — Boolean
*   **Variants:** Standard, Indeterminate.
*   **States:** Checked, Unchecked, Hover, Focused, Disabled.
*   **Accessibility:**
    *   *Keyboard:* Toggled via Space.
*   **Usage Guidelines:**
    *   *When to use:* List selectors.
    *   *When not to use:* Single binary decisions.

### 3.7 Radio Button
*   **Purpose:** Select one option from a list.
*   **Description:** Circular selection input.
*   **Category:** Forms
*   **Props:**
    *   `isSelected` — Boolean
*   **Variants:** Standard.
*   **States:** Selected, Unselected, Hover, Focused, Disabled.
*   **Accessibility:**
    *   *Keyboard:* Arrow keys navigate group.
*   **Usage Guidelines:**
    *   *When to use:* Mutually exclusive sets.
    *   *When not to use:* Multi-select lists.

### 3.8 Switch
*   **Purpose:** Toggle feature states immediately.
*   **Description:** Horizontal toggle track with knob.
*   **Category:** Forms
*   **Props:**
    *   `isOn` — Boolean
*   **Variants:** Compact.
*   **States:** On, Off, Hover, Focused, Disabled.
*   **Accessibility:**
    *   *Keyboard:* Toggled via Space.
*   **Usage Guidelines:**
    *   *When to use:* Toggle settings.
    *   *When not to use:* Major grid breaker controls.

### 3.9 Select
*   **Purpose:** Select one value from a dropdown list.
*   **Description:** Collapsible input field presenting list overlay.
*   **Category:** Forms
*   **Props:**
    *   `options` — Array
    *   `value` — String
*   **Variants:** Default, Compact.
*   **States:** Default, Hover, Opened, Disabled.
*   **Accessibility:**
    *   *Keyboard:* Arrow keys cycle; Enter selects; Esc closes.
*   **Usage Guidelines:**
    *   *When to use:* Option selection.
    *   *When not to use:* Large datasets (>8 options).

### 3.10 Multi Select
*   **Purpose:** Select multiple values from a dropdown.
*   **Description:** Dropdown presenting checkbox item lists.
*   **Category:** Forms
*   **Props:**
    *   `options` — Array
    *   `selectedValues` — Array
*   **Variants:** Tag-bubbles.
*   **States:** Default, Opened, Selected, Disabled.
*   **Accessibility:**
    *   *Screen Reader:* Mapped to announce selected option counts.
*   **Usage Guidelines:**
    *   *When to use:* Selecting multiple active grid substations.
    *   *When not to use:* Single-choice forms.

### 3.11 Date Picker
*   **Purpose:** Select dates or ranges.
*   **Description:** Calendar overlay popup.
*   **Category:** Forms
*   **Props:**
    *   `selectedDate` — Date
    *   `rangeSelect` — Boolean
*   **Variants:** Single, Date Range.
*   **States:** Default, Opened, Focused, Disabled.
*   **Accessibility:**
    *   *Keyboard:* Arrow keys navigate grid dates.
*   **Usage Guidelines:**
    *   *When to use:* Log filters.
    *   *When not to use:* Relative time inputs (use dropdowns instead).

### 3.12 File Upload
*   **Purpose:** Upload files.
*   **Description:** Drag-and-drop landing area with file selector action.
*   **Category:** Forms
*   **Props:**
    *   `allowedExtensions` — Array
    *   `maxSizeMb` — Integer
*   **Variants:** Drag-Drop Container, Compact Button.
*   **States:** Default, Dragging, Uploading, Error, Success.
*   **Accessibility:**
    *   *Screen Reader:* Announce progress changes.
*   **Usage Guidelines:**
    *   *When to use:* Importing policy configs (.yaml, .json).
    *   *When not to use:* Simple inputs.

---

## 4. Data Display

### 4.1 Card
*   **Purpose:** Content compartmentalization.
*   **Description:** Dark graphite background container with flat slate border.
*   **Category:** Data Display
*   **Props:**
    *   `title` — String
    *   `idBadge` — String
*   **Variants:** Standard, Hoverable.
*   **States:** Default, Hover.
*   **Accessibility:** Correct headings structures inside body.
*   **Usage Guidelines:**
    *   *When to use:* Dashboard layouts.
    *   *When not to use:* Continuous tables.

### 4.2 KPI Card
*   **Purpose:** Summarize operational metrics.
*   **Description:** Card showing large telemetry values with unit tags and trend badges.
*   **Category:** Data Display
*   **Props:**
    *   `value` — String
    *   `trendDirection` — Enum
*   **Variants:** Numeric, Status Grid.
*   **States:** Default, Warning, Critical.
*   **Accessibility:** Redundant trend labels (e.g., `Up 2.4%`).
*   **Usage Guidelines:**
    *   *When to use:* Real-time performance monitors.
    *   *When not to use:* Multi-column data lists.

### 4.3 Data Table
*   **Purpose:** Displays structured datasets.
*   **Description:** Grid displaying logs or parameters with sorted headers.
*   **Category:** Data Display
*   **Props:**
    *   `columns` — Array
    *   `rows` — Array
*   **Variants:** Standard, Collapsible, Compact.
*   **States:** Default, Row Hover, Sorting, Empty.
*   **Accessibility:** Header elements declare sorting direction.
*   **Usage Guidelines:**
    *   *When to use:* Alarms, audits, policy constraints.
    *   *When not to use:* Small coordinate paths.

### 4.4 Badge
*   **Purpose:** Displays status states.
*   **Description:** Small colored text wrapper with solid border.
*   **Category:** Data Display
*   **Props:**
    *   `label` — String
    *   `statusType` (Success, Warning, Critical) — Enum
*   **Variants:** Solid, Outline.
*   **States:** Static.
*   **Accessibility:** Background meets 4.5:1 WCAG AA contrast standard.
*   **Usage Guidelines:**
    *   *When to use:* Status labels (e.g., `[ACTIVE]`).
    *   *When not to use:* Action links.

### 4.5 Chip
*   **Purpose:** Interactive metadata filtering.
*   **Description:** Rounded tag displaying a filter value with deletion action.
*   **Category:** Data Display
*   **Props:**
    *   `label` — String
    *   `onDelete` — Function
*   **Variants:** Deletable, Static.
*   **States:** Default, Hover, Focused, Disabled.
*   **Accessibility:** Target has `aria-label="Remove Filter Name"`.
*   **Usage Guidelines:**
    *   *When to use:* Active table filter lists.
    *   *When not to use:* Primary navigation tabs.

### 4.6 Tag
*   **Purpose:** Static system categorization.
*   **Description:** Small, neutral-colored metadata container.
*   **Category:** Data Display
*   **Props:**
    *   `label` — String
*   **Variants:** Monospaced, Standard.
*   **States:** Static.
*   **Accessibility:** High visual contrast text on background.
*   **Usage Guidelines:**
    *   *When to use:* Classifying log items (e.g., `SCADA`, `COMPILER`).
    *   *When not to use:* Status alerts.

### 4.7 Tooltip
*   **Purpose:** Contextual operational help overlays.
*   **Description:** Text popup displaying details on hover.
*   **Category:** Data Display
*   **Props:**
    *   `content` — String
*   **Variants:** Top, Bottom, Side alignments.
*   **States:** Hidden, Active.
*   **Accessibility:** Uses `role="tooltip"`. Triggered by keyboard focus.
*   **Usage Guidelines:**
    *   *When to use:* Explaining complex metrics.
    *   *When not to use:* Critical override procedures.

### 4.8 Accordion
*   **Purpose:** Manage vertical layouts.
*   **Description:** Collapsible details box.
*   **Category:** Data Display
*   **Props:**
    *   `title` — String
    *   `isExpanded` — Boolean
*   **Variants:** Single, Multi-group.
*   **States:** Expanded, Collapsed, Hover (Header).
*   **Accessibility:** Header sets `aria-expanded` and manages focus.
*   **Usage Guidelines:**
    *   *When to use:* Collapsing detail lists.
    *   *When not to use:* Core layouts.

### 4.9 Tabs
*   **Purpose:** Toggle visual frames.
*   **Description:** Horizontal block of tab controls.
*   **Category:** Data Display
*   **Props:**
    *   `activeTabId` — String
*   **Variants:** Borderless underline, Segmented blocks.
*   **States:** Default, Selected (Orange bottom line), Hover.
*   **Accessibility:** Uses ARIA tab list rules.
*   **Usage Guidelines:**
    *   *When to use:* Secondary dashboard views.
    *   *When not to use:* Multi-step wizard processes.

### 4.10 Timeline
*   **Purpose:** Chronological event logs.
*   **Description:** Vertical list of events linked by a timeline path.
*   **Category:** Data Display
*   **Props:**
    *   `events` — Array
*   **Variants:** Standard, Compact.
*   **States:** Default, Hover (event card).
*   **Accessibility:** Announce new events to screen readers.
*   **Usage Guidelines:**
    *   *When to use:* Event audits and simulations.
    *   *When not to use:* Simple tabular data.

### 4.11 Progress Bar
*   **Purpose:** Status tracking.
*   **Description:** Horizontal track indicating process completion percentage.
*   **Category:** Data Display
*   **Props:**
    *   `percentage` — Float
*   **Variants:** Determinate, Indeterminate.
*   **States:** Active, Completed (shifts Green).
*   **Accessibility:** Linked to `aria-valuenow`.
*   **Usage Guidelines:**
    *   *When to use:* Deploying policy rules.
    *   *When not to use:* Continuous telemetry.

### 4.12 Avatar
*   **Purpose:** User account identification.
*   **Description:** Monogram circle showing initials and access role.
*   **Category:** Data Display
*   **Props:**
    *   `initials` — String
    *   `clearanceLevel` — String
*   **Variants:** Small, Medium.
*   **States:** Default, Active.
*   **Accessibility:** Alt-text labels present.
*   **Usage Guidelines:**
    *   *When to use:* Navbars.
    *   *When not to use:* Asset tracking.

### 4.13 Pagination
*   **Purpose:** Grid navigation.
*   **Description:** Bottom bar containing page navigation selectors.
*   **Category:** Data Display
*   **Props:**
    *   `currentPage` — Integer
    *   `totalPages` — Integer
*   **Variants:** Standard.
*   **States:** Default, Selected, Disabled.
*   **Accessibility:** Screen reader declares total page counts.
*   **Usage Guidelines:**
    *   *When to use:* Telemetry tables.
    *   *When not to use:* Real-time maps.

---

## 5. Feedback Components

### 5.1 Modal
*   **Purpose:** Focused operations.
*   **Description:** Overlay popup center-aligned, locking background interaction.
*   **Category:** Feedback
*   **Props:**
    *   `isOpen` — Boolean
*   **Variants:** Centered, Full Screen.
*   **States:** Open, Dismissed.
*   **Accessibility:** Traps keyboard focus. Esc key exits.
*   **Usage Guidelines:**
    *   *When to use:* Setting overrides.
    *   *When not to use:* Simple help displays.

### 5.2 Drawer
*   **Purpose:** Collapsible details panels.
*   **Description:** Slide-out panel at right margin.
*   **Category:** Feedback
*   **Props:**
    *   `isOpen` — Boolean
*   **Variants:** Right-aligned.
*   **States:** Open, Closed.
*   **Accessibility:** Traps keyboard focus.
*   **Usage Guidelines:**
    *   *When to use:* Telemetry properties.
    *   *When not to use:* Login forms.

### 5.3 Toast
*   **Purpose:** Non-disruptive feedback.
*   **Description:** Popup card at top-right corner.
*   **Category:** Feedback
*   **Props:**
    *   `message` — String
    *   `type` (Success, Error) — Enum
*   **Variants:** Success, Error, Info.
*   **States:** Active, Dismissed.
*   **Accessibility:** Announcement uses `aria-live="polite"`.
*   **Usage Guidelines:**
    *   *When to use:* Form confirmations.
    *   *When not to use:* Operational alarms.

### 5.4 Alert
*   **Purpose:** Status warnings.
*   **Description:** Colored banner block located inside the content layout.
*   **Category:** Feedback
*   **Props:**
    *   `message` — String
    *   `type` — Enum
*   **Variants:** Warning, Critical, Information.
*   **States:** Default.
*   **Accessibility:** Color independent (pairs labels/symbols with color codes).
*   **Usage Guidelines:**
    *   *When to use:* Subsystem offline warnings.
    *   *When not to use:* Popover menus.

### 5.5 Confirmation Dialog
*   **Purpose:** Prevent accidental destructive actions.
*   **Description:** High-priority modal block with Cancel and Confirm buttons.
*   **Category:** Feedback
*   **Props:**
    *   `title` — String
    *   `confirmAction` — Function
*   **Variants:** Destructive, Constructive.
*   **States:** Open.
*   **Accessibility:** Focus initializes on the Cancel button.
*   **Usage Guidelines:**
    *   *When to use:* Deleting rules, triggering grid islanding.
    *   *When not to use:* Simple view changes.

### 5.6 Empty State
*   **Purpose:** Handle empty layout states.
*   **Description:** Dotted border canvas displaying graphic and actionable button.
*   **Category:** Feedback
*   **Props:**
    *   `title` — String
*   **Variants:** Default.
*   **States:** Static.
*   **Accessibility:** Screen reader declares zero items.
*   **Usage Guidelines:**
    *   *When to use:* Empty search/filter results.
    *   *When not to use:* Loading states.

### 5.7 Error State
*   **Purpose:** System failure feedback.
*   **Description:** Schematic error card showing error codes.
*   **Category:** Feedback
*   **Props:**
    *   `errorCode` — String
*   **Variants:** Card-size, Full-screen.
*   **States:** Static.
*   **Accessibility:** Technical error details collapsible.
*   **Usage Guidelines:**
    *   *When to use:* Compiler crashes.
    *   *When not to use:* Simple form validation issues.

### 5.8 Loading State
*   **Purpose:** Indicate active loading.
*   **Description:** Layout mask indicating pending operations.
*   **Category:** Feedback
*   **Props:**
    *   `message` — String
*   **Variants:** Overlay.
*   **States:** Active.
*   **Accessibility:** Set `aria-busy="true"`.
*   **Usage Guidelines:**
    *   *When to use:* Initializing application data.
    *   *When not to use:* Subsecond data updates.

### 5.9 Skeleton Loader
*   **Purpose:** Placeholder container during fast loads.
*   **Description:** Flat, fading graphite compartments.
*   **Category:** Feedback
*   **Props:**
    *   `layoutType` — Enum
*   **Variants:** Table row, Card block.
*   **States:** Fading loop. Pulse timings and fade transitions are governed by [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
*   **Accessibility:** Excluded from screen reader index during load.
*   **Usage Guidelines:**
    *   *When to use:* Loading KPI values.
    *   *When not to use:* Live topology maps.

### 5.10 Spinner
*   **Purpose:** Interactive inline loading indicator.
*   **Description:** Animated orange circular vector track.
*   **Category:** Feedback
*   **Props:**
    *   `size` — Enum
*   **Variants:** Small, Medium.
*   **States:** Rotating loop. Rotation timing and easing are governed by [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
*   **Accessibility:** Linked to `aria-live`.
*   **Usage Guidelines:**
    *   *When to use:* Button loading states.
    *   *When not to use:* General page placeholders.

---

## 6. Charts

### 6.1 Chart Container
*   **Purpose:** Layout framework for graphs.
*   **Description:** Panel card housing legends, axes, and canvas grids.
*   **Category:** Charts
*   **Props:**
    *   `chartTitle` — String
*   **Variants:** Standard.
*   **States:** Default, Loading.
*   **Accessibility:** Supports high-contrast grids.
*   **Usage Guidelines:**
    *   *When to use:* Wrapping line/bar charts.
    *   *When not to use:* Simple indicators.

### 6.2 Line Chart
*   **Purpose:** Track real-time metric trends.
*   **Description:** Line graph tracking values (Hz, MW) with linear vector points.
*   **Category:** Charts
*   **Props:**
    *   `dataSeries` — Array
*   **Variants:** Single Line, Multi Line.
*   **States:** Live, Static.
*   **Accessibility:** Uses unique dash configurations for line series.
*   **Usage Guidelines:**
    *   *When to use:* Voltage and frequency logs.
    *   *When not to use:* Proportion metrics.

### 6.3 Bar Chart
*   **Purpose:** Compare discrete categorical variables.
*   **Description:** Grouped vertical bars outlining capacities or limits.
*   **Category:** Charts
*   **Props:**
    *   `data` — Array
*   **Variants:** Vertical, Grouped.
*   **States:** Default.
*   **Accessibility:** Alt-text equivalent data tables are accessible.
*   **Usage Guidelines:**
    *   *When to use:* DER capacity reserves.
    *   *When not to use:* Continuous real-time frequencies.

### 6.4 Area Chart
*   **Purpose:** Highlight cumulative telemetry levels.
*   **Description:** Line graph with shaded area fill underneath.
*   **Category:** Charts
*   **Props:**
    *   `data` — Array
*   **Variants:** Stacked Area.
*   **States:** Default.
*   **Accessibility:** Fills use low-opacity colors (10% max) to ensure grid lines remain visible.
*   **Usage Guidelines:**
    *   *When to use:* Total solar/wind integration levels.
    *   *When not to use:* Isolated voltage paths.

### 6.5 Pie Chart
*   **Purpose:** Display relative proportions.
*   **Description:** Divided circular chart block.
*   **Category:** Charts
*   **Props:**
    *   `data` — Array
*   **Variants:** Donut (with center text total).
*   **States:** Default, Slice Hover.
*   **Accessibility:** Individual segments mapped to data tables.
*   **Usage Guidelines:**
    *   *When to use:* Grid load mix (Solar, Wind, Gas, Battery).
    *   *When not to use:* Tracking variables over time.

### 6.6 Heat Map
*   **Purpose:** Highlight localized congestion levels.
*   **Description:** Visual grid of coordinates colored from green to red based on values.
*   **Category:** Charts
*   **Props:**
    *   `gridMatrix` — Array
*   **Variants:** Daily Log, Station Grid.
*   **States:** Default, Cell Hover.
*   **Accessibility:** High-contrast cell borders outline values.
*   **Usage Guidelines:**
    *   *When to use:* Line thermal loads.
    *   *When not to use:* Simple single-value variables.

### 6.7 Legend
*   **Purpose:** Chart line series identification.
*   **Description:** Horizontal list mapping colored symbols to labels.
*   **Category:** Charts
*   **Props:**
    *   `legendItems` — Array
*   **Variants:** Interactive (clickable series toggle).
*   **States:** Selected, Muted.
*   **Accessibility:** Keyboard navigates legend checkboxes.
*   **Usage Guidelines:**
    *   *When to use:* Under charts.
    *   *When not to use:* Single-series charts.

### 6.8 Filter Panel
*   **Purpose:** Filter chart datasets.
*   **Description:** Horizontal card displaying date, node, and rule selectors.
*   **Category:** Charts
*   **Props:**
    *   `activeFilters` — Array
*   **Variants:** Collapsible.
*   **States:** Default, Active.
*   **Accessibility:** Groups parameters in clear layout zones.
*   **Usage Guidelines:**
    *   *When to use:* Analytics views.
    *   *When not to use:* Emergency overrides.

---

## 7. Domain Components

### 7.1 Grid Node Card
*   **Purpose:** Monitor specific grid node devices.
*   **Description:** Card displaying live telemetry, ID parameters, and warning badge overrides.
*   **Category:** Smart Grid
*   **Props:**
    *   `nodeId` — String
    *   `voltageLevel` — Float
    *   `onManualBypass` — Function
*   **Variants:** Substations, Generators, Batteries.
*   **States:** Nominal, Warning, Critical, Offline.
*   **Accessibility:** Color-independent status badge mappings.
*   **Usage Guidelines:**
    *   *When to use:* Grid visual boards.
    *   *When not to use:* General system configurations.

### 7.2 Transmission Line Card
*   **Purpose:** Monitor transmission line thermal limits.
*   **Description:** Card showing line load (MW), phase angle, and limits.
*   **Category:** Smart Grid
*   **Props:**
    *   `lineId` — String
    *   `currentLoad` — Float
*   **Variants:** Active, De-energized.
*   **States:** Nominal, Warning, Tripped.
*   **Accessibility:** Status labels are screen-reader accessible.
*   **Usage Guidelines:**
    *   *When to use:* Feeder dashboard lists.
    *   *When not to use:* Component forms.

### 7.3 Substation Card
*   **Purpose:** Manage substation parameters.
*   **Description:** Card showing breaker arrays, active load, and active agents.
*   **Category:** Smart Grid
*   **Props:**
    *   `stationId` — String
    *   `breakerStatus` — Array
*   **Variants:** Distribution, Transmission.
*   **States:** Nominal, Emergency.
*   **Accessibility:** Header uses Space Grotesk.
*   **Usage Guidelines:**
    *   *When to use:* Detail drawers and map sidebars.
    *   *When not to use:* Settings forms.

### 7.4 Scenario Card
*   **Purpose:** Configure simulation test cases.
*   **Description:** Card showing scenario parameters, failure nodes, and run actions.
*   **Category:** Smart Grid
*   **Props:**
    *   `scenarioName` — String
    *   `onExecuteSim` — Function
*   **Variants:** Deployed, Draft.
*   **States:** Default, Selected, Running.
*   **Accessibility:** Start button has active `aria-label`.
*   **Usage Guidelines:**
    *   *When to use:* Simulation dashboard lists.
    *   *When not to use:* Live operations dashboards.

### 7.5 Simulation Card
*   **Purpose:** Monitor simulation runs.
*   **Description:** Card showing execution time, progress bar, and logs.
*   **Category:** Smart Grid
*   **Props:**
    *   `simId` — String
    *   `progress` — Float
*   **Variants:** Compact.
*   **States:** Configuring, Running, Success, Failed.
*   **Accessibility:** Progress value changes are announced.
*   **Usage Guidelines:**
    *   *When to use:* Simulator sandbox modules.
    *   *When not to use:* Deployed production setups.

### 7.6 Policy Card
*   **Purpose:** View dynamic policy rule parameters.
*   **Description:** Card showing rule logic, NERC target standards, and author details.
*   **Category:** Policy
*   **Props:**
    *   `policyId` — String
    *   `ruleLogic` — String
*   **Variants:** Active, Draft, Retired.
*   **States:** Deployed, Suspended, Error.
*   **Accessibility:** Monospace fonts are used to display rule structures.
*   **Usage Guidelines:**
    *   *When to use:* Policy Studio registers.
    *   *When not to use:* Real-time dashboards.

### 7.7 Policy Selector
*   **Purpose:** Select active policies during simulation configurations.
*   **Description:** List selector displaying checkbox policy items.
*   **Category:** Policy
*   **Props:**
    *   `availablePolicies` — Array
    *   `onSelectToggle` — Function
*   **Variants:** Compact.
*   **States:** Default, Selected.
*   **Accessibility:** Keyboard arrow keys navigate lists.
*   **Usage Guidelines:**
    *   *When to use:* Scenario Builder view.
    *   *When not to use:* General settings view.

### 7.8 Agent Card
*   **Purpose:** Monitor active edge software agents.
*   **Description:** Card showing negotiation state, decision logs, and override targets.
*   **Category:** AI
*   **Props:**
    *   `agentId` — String
    *   `negotiationState` — Enum
*   **Variants:** Control, Monitor.
*   **States:** Idle, Negotiating, Executing, Blocked.
*   **Accessibility:** Indicators match agent state colors.
*   **Usage Guidelines:**
    *   *When to use:* AI agent grids.
    *   *When not to use:* Analytics reports.

### 7.9 Recommendation Card
*   **Purpose:** Displays AI-generated mitigation proposals.
*   **Description:** Card showing the proposed action, justification, and policy rule link.
*   **Category:** AI
*   **Props:**
    *   `actionProposed` — String
    *   `supportingPolicyId` — String
*   **Variants:** Active warning, Normal suggestion.
*   **States:** Default, Executing, Dismissed.
*   **Accessibility:** Action buttons require clear label properties.
*   **Usage Guidelines:**
    *   *When to use:* Decision-making dashboards.
    *   *When not to use:* Configuration forms.

### 7.10 Explainability Card
*   **Purpose:** Trace the logic behind AI agent decisions.
*   **Description:** Card displaying decision trees and telemetry limits in mono font.
*   **Category:** AI
*   **Props:**
    *   `decisionId` — String
    *   `limitValues` — Array
*   **Variants:** Diagram view.
*   **States:** Default.
*   **Accessibility:** High contrast lines and labels.
*   **Usage Guidelines:**
    *   *When to use:* Audit logs and agent trace views.
    *   *When not to use:* Live operations dashboards.

### 7.11 Decision Card
*   **Purpose:** Log active agent decisions.
*   **Description:** Card detailing action taken, execution speed (ms), and outcomes.
*   **Category:** AI
*   **Props:**
    *   `action` — String
    *   `executionTimeMs` — Integer
*   **Variants:** Nominally Resolved, Tripped.
*   **States:** Nominal, Emergency.
*   **Accessibility:** Display execution speed in JetBrains Mono.
*   **Usage Guidelines:**
    *   *When to use:* Incident logs and audit trails.
    *   *When not to use:* Main dashboards.

### 7.12 Risk Card
*   **Purpose:** Display real-time risk scores for grid nodes.
*   **Description:** Card displaying percentage risk indicators and risk factors.
*   **Category:** Analytics
*   **Props:**
    *   `nodeId` — String
    *   `riskScore` — Float
*   **Variants:** Detailed, Compact.
*   **States:** Nominal, Warning, Critical.
*   **Accessibility:** Redundant text tags (e.g. `[CRITICAL]`) accompany the risk score.
*   **Usage Guidelines:**
    *   *When to use:* Dashboards and GIS Maps.
    *   *When not to use:* Form configuration screens.

### 7.13 Notification Card
*   **Purpose:** Central management card for alarms.
*   **Description:** Alert block showing alarm category, timestamp, and details.
*   **Category:** Feedback
*   **Props:**
    *   `alarmId` — String
    *   `timestamp` — String
*   **Variants:** Informative, Warning, Critical.
*   **States:** Active, Acknowledged, Suppressed.
*   **Accessibility:** Critical alarms play a distinct low-frequency audio tone.
*   **Usage Guidelines:**
    *   *When to use:* Notifications panel.
    *   *When not to use:* Main navigation blocks.

### 7.14 Audit Log Item
*   **Purpose:** Records a specific system transaction.
*   **Description:** Compact row detail displaying user, action, timestamp, and signature.
*   **Category:** Analytics
*   **Props:**
    *   `logId` — String
    *   `signature` — String
*   **Variants:** Standard.
*   **States:** Verified.
*   **Accessibility:** Monospaced values use JetBrains Mono.
*   **Usage Guidelines:**
    *   *When to use:* Compliance registers.
    *   *When not to use:* Real-time maps.

---

## 8. Logically Added Enterprise Components

To support the requirements of a NERC CIP-compliant control room and simulation compile loops, the following reusable components are included:

### 8.1 Grid Schema Visualizer (Interactive Canvas Component)
*   **Rationale:** Operators require a highly responsive, custom interactive area to pan, zoom, and select substation schemas without page reloads.
*   **Purpose:** Custom vector canvas displaying grid single-line diagrams.
*   **Description:** Interactive viewport using vector graphics to render breakers, lines, transformers, and generation buses.
*   **Category:** Visualization
*   **Props:**
    *   `activeNodes` — Array
    *   `zoomLevel` — Float
    *   `selectedNodeId` — String
*   **Variants:** Read-Only, Fully Interactive.
*   **States:** Loading, Idle, Node Hover, Node Selected. Hover highlights, selection indicators, and pan/zoom easing follow [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
*   **Accessibility:** Keyboard support (tab navigates nodes, Space/Enter selects). Arrow keys pan; plus/minus keys zoom.
*   **Usage Guidelines:**
    *   *When to use:* Main Topology Map and Simulation canvases.
    *   *When not to use:* Data tables or forms.

### 8.2 Terminal Console Component
*   **Purpose:** Outputs real-time compiler trace logs.
*   **Description:** Monospaced console area with auto-scrolling, buffer controls, and text copy actions.
*   **Category:** Visualization
*   **Props:**
    *   `logBuffer` (Stream of trace events) — Array
    *   `autoScroll` — Boolean
*   **Variants:** Inline card console, Drawer console.
*   **States:** Idle, Streaming, Paused. Streaming scroll containment and console buffer updates follow [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
*   **Accessibility:** Keyboard selection of raw console text. Uses `role="log"`.
*   **Usage Guidelines:**
    *   *When to use:* Policy Studio compile output, simulation run logs.
    *   *When not to use:* Configuration form panels.

### 8.3 MFA Code Input Component
*   **Purpose:** Secure multi-factor code authorization.
*   **Description:** Segmented input fields capturing 6 numeric digits individually.
*   **Category:** Form
*   **Props:**
    *   `onComplete` (Triggered after 6 digits are input) — Function
*   **Variants:** Secure.
*   **States:** Default, Typing, Focused, Error, Success.
*   **Accessibility:** Focus automatically transitions to the next field as digits are entered. Screen reader announces empty fields.
*   **Usage Guidelines:**
    *   *When to use:* Login security gates and Emergency Override execution confirmations.
    *   *When not to use:* Standard numerical values.

---

## 9. Related Documents
*   [Design System Specifications](DESIGN_SYSTEM.md)
*   [User Experience Standards](UX_GUIDELINES.md)
*   [Screen Inventory & Flow Catalog](SCREEN_CATALOG.md)
*   [Technical Architecture Specification](ARCHITECTURE.md)
*   [Motion Guidelines](MOTION_GUIDELINES.md)

---

## 10. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Enterprise UI Component Architect |
| v1.0.1 | July 23, 2026 | Integrated motion behavior references to MOTION_GUIDELINES.md | Enterprise UI Component Architect |
