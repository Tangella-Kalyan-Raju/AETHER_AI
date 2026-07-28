# Grid Policy Orchestrator (GPO)
## Motion & Interaction Design Guidelines

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Principal UX Architect / Motion Designer
*   **Phase:** Phase 0.13
*   **Last Updated:** July 23, 2026
*   **Purpose:** The single source of truth and authority for all UI animations, transitions, timings, easing functions, and micro-interactions across the GPO platform.

---

## Table of Contents
*   [1. Motion Philosophy](#1-motion-philosophy)
*   [2. Motion Principles](#2-motion-principles)
*   [3. Animation Timing Standards](#3-animation-timing-standards)
*   [4. Easing Standards](#4-easing-standards)
*   [5. Motion Tokens](#5-motion-tokens)
*   [6. Component Motion](#6-component-motion)
*   [7. Page Transition Standards](#7-page-transition-standards)
*   [8. Scroll Behaviour](#8-scroll-behaviour)
*   [9. Loading States](#9-loading-states)
*   [10. AI Interaction Motion](#10-ai-interaction-motion)
*   [11. Chart Animation Standards](#11-chart-animation-standards)
*   [12. Digital Twin Motion](#12-digital-twin-motion)
*   [13. Notification Motion](#13-notification-motion)
*   [14. Micro Interactions](#14-micro-interactions)
*   [15. Accessibility & Reduced Motion](#15-accessibility--reduced-motion)
*   [16. Performance Guidelines](#16-performance-guidelines)
*   [17. Approved Animation Libraries](#17-approved-animation-libraries)
*   [18. Motion Do's](#18-motion-dos)
*   [19. Motion Don'ts](#19-motion-donts)
*   [20. Future Motion Expansion Guidelines](#20-future-motion-expansion-guidelines)
*   [21. Related Documents](#21-related-documents)
*   [22. Revision History](#22-revision-history)

---

## 1. Motion Philosophy

To protect operational stability and support quick decision-making in high-stress utility control environments, GPO treats motion as a cognitive tool, not a visual decoration. 

### 1.1 Purpose
Motion inside GPO exists strictly to orient operators, establish spatial hierarchies, direct attention to anomalies, and confirm critical systems-level transitions.

### 1.2 Design Rationale
In dark-mode control rooms where operators work 12-hour shifts under low-light ambient conditions, decorative or uncoordinated motion triggers eye fatigue, causes distraction, and degrades situational awareness. Therefore, all motion within the system must be:
- **Premium:** Refined curves, smooth frame updates, and zero visual stutter.
- **Enterprise-Grade:** Built for reliability and performance on multi-screen workspaces.
- **Minimal:** Reduced movement amplitudes, fast durations, and instant feedback.

---

## 2. Motion Principles

Every transition and micro-interaction across the GPO platform must follow these three architectural core principles:

### 2.1 Functional Utility
An animation is only permitted if it aids the operator's mental model. Transitions must clarify relationships between parent and child elements (e.g., sliding out a detail drawer from its parent row) or emphasize critical status shifts (e.g., alerting of a tripped breaker).

### 2.2 Low Cognitive Friction
Operator workflows during contingencies require split-second parsing. Animation durations must be kept as short as possible to avoid delaying data reads. Total animation durations are capped at `240ms`.

### 2.3 Visual Containment & Layout Stability
Animations must never shift adjacent structural layout panels. Height, width, or margin shifts that cause document reflow are strictly prohibited. Telemetry parameters and tables must load static coordinates, updating text values in place.

---

## 3. Animation Timing Standards

GPO enforces three precise duration ranges depending on the visual scale and structural role of the animating element:

| Timing Tier | Duration (ms) | Target UI Interactivity | Rationale |
| :--- | :--- | :--- | :--- |
| **Instant / Fast** | `100ms` - `120ms` | Buttons hover, tooltips, checkboxes, radio selections, icon rotations, simple status dot toggles | Provides immediate feedback for micro-actions. |
| **Standard UI** | `150ms` - `180ms` | Dropdown panel lists, tab switching content panels, KPI value updates, progress bar increments | Smoothly fades or slides content containers without delaying tasks. |
| **Structural** | `200ms` - `240ms` | Collapsible left nav sidebars, sliding right drawers, modal dialog window overlays | Manages physical movement of large overlays over the workspace. |

---

## 4. Easing Standards

To create smooth and natural motion without bouncy, toy-like characteristics, GPO standardizes on three cubic-bezier easing functions:

```
                                  CUBIC-BEZIER CURVES
                                  
    [Standard Ease]               [Entrance Ease]                [Exit/Dismiss Ease]
    cubic-bezier(0.4, 0, 0.2, 1)   cubic-bezier(0, 0, 0.2, 1)     cubic-bezier(0.4, 0, 1, 1)
           +---+                         +---+                         +---+
          /                             /                             /
         /                             /                             /
    +---+                         +---+                         +---+
```

### 4.1 Standard Ease
- **Formula:** `cubic-bezier(0.4, 0, 0.2, 1)`
- **Description:** Used for general interactions inside the workspace canvas where elements remain in the viewport (e.g., tab selections, hovers, color fades).

### 4.2 Entrance / Deceleration Ease
- **Formula:** `cubic-bezier(0, 0, 0.2, 1)`
- **Description:** Used for components entering the screen (e.g., right side drawer sliding in, modal fade-in). The animation starts fast and slows down at the end to create a clean landing.

### 4.3 Exit / Acceleration Ease
- **Formula:** `cubic-bezier(0.4, 0, 1, 1)`
- **Description:** Used for components leaving the screen (e.g., drawer sliding out, modal fade-out). The animation starts slow and accelerates off-screen to clear space instantly.

---

## 5. Motion Tokens

To maintain timing consistency, motion properties must use defined CSS/JS variables:

```json
{
  "tokens": {
    "duration": {
      "fast": "120ms",
      "normal": "180ms",
      "slow": "240ms"
    },
    "easing": {
      "standard": "cubic-bezier(0.4, 0, 0.2, 1)",
      "entrance": "cubic-bezier(0, 0, 0.2, 1)",
      "exit": "cubic-bezier(0.4, 0, 1, 1)",
      "linear": "linear"
    }
  }
}
```

---

## 6. Component Motion

### 6.1 Buttons
- **Hover:** Border color transitions to Energy Orange (`#FF7A1A`) over `120ms` using `standard` easing.
- **Pressed:** Scale down slightly to `98%` of baseline size using `fast` timing. Restores instantly on release.

### 6.2 Dropdowns
- **Open:** Dropdown options container slides down `8px` and fades in over `150ms` using `entrance` easing.
- **Close:** Fades out instantly (`100ms`) using `exit` easing.

### 6.3 Side Drawers
- **Entrance:** Right-aligned drawer slides left from the right margin into the viewport over `240ms` using `entrance` easing.
- **Exit:** Drawer slides right back out of the viewport over `200ms` using `exit` easing.

### 6.4 Modals & Confirmation Dialogs
- **Backdrop Overlay:** Fades from transparent to `#000000`/`80%` over `180ms` (linear).
- **Dialog Container:** Fades in and scales up from `97%` to `100%` over `200ms` using `entrance` easing.

---

## 7. Page Transition Standards

Transitions between primary workspace panels (e.g. swapping from Dashboard to Topology Map) must avoid sudden jarring layout changes.
- **Transition Style:** Standard cross-fade.
- **Parameters:** Fade opacity from `0` to `1` over `150ms` using `standard` easing.
- **Axis Locking:** Horizontal/vertical layout shifts during route updates are prohibited.

---

## 8. Scroll Behaviour

Viewport and panel scroll actions must prioritize layout containment:
- **Containment:** Body scroll must remain locked (`overflow: hidden`). Scrollable areas are restricted to specific containers (e.g., data tables, side drawers, log panels).
- **Scroll Easing:** Standard smooth scrolling (`scroll-behavior: smooth`) is applied to long log listings and policy text blocks.
- **No Layout Shifts:** Scrolling within a container must never cause page jitter or alter adjacent sidebar or navbar widths.

---

## 9. Loading States

To prevent layout jumps during high-volume API requests, GPO uses skeleton screens:

```
                            SKELETON LOADER TIMELINES
                            
    0ms                     750ms                     1500ms
    +-----------------------+-------------------------+
    | Fades to #151A21      | Fades to #1C222B        | Fades back to #151A21
    | (Surface Color)       | (Elevated Surface)      | (Loop continues)
    +-----------------------+-------------------------+
```

### 9.1 Skeleton Loaders
- **Animation:** Continuous opacity pulse fading background colors between `#151A21` and `#1C222B`.
- **Timing:** Loop cycle duration is set to `1.5s` (`1500ms`) using `linear` easing.
- **Transition Out:** Once telemetry data arrives, the skeleton loader fades out, and actual data fades in over `150ms` (cross-fade).

### 9.2 Progress Bars
- **Animation:** Linear increase matching actual compile state. Progress bar tracks remain flat without decorative light glimmers or diagonal stripes.

---

## 10. AI Interaction Motion

AI Agent activities during consensus calculations utilize subtle, non-intrusive micro-animations:

### 10.1 Negotiation State
- **Visual:** Electric Amber (`#FFA940`) status dot or border glow.
- **Animation:** Soft pulse loop transitioning opacity between `40%` and `100%`.
- **Timing:** Pulse cycle duration is set to `2.0s` (`2000ms`) using `standard` easing.

### 10.2 Decision Finalization
- **Visual:** Glow shifts from Electric Amber (`#FFA940`) to Grid Green (`#22C55E`).
- **Animation:** Quick flash highlight over `240ms` using `entrance` easing, then fades to a solid green state.

---

## 11. Chart Animation Standards

Live operational graphs must ensure visual stability:
- **Initial Load:** Lines or bar columns render on mount with a simple vertical scale-up and fade-in over `300ms` using `entrance` easing.
- **Telemetry Data Stream Updates:** When new real-time points (Hz, MW) are appended, data paths must update instantly without tween transitions. Smooth animations on telemetry updates are forbidden, as grid operators require seeing exact, un-interpolated value spikes immediately.

---

## 12. Digital Twin Motion

Topology maps and schematic canvases must highlight grid events clearly:
- **Outage / Tripped Breaker:** Status indicator circle and breaker outline flash between red (`#EF4444`) and dark red (`#3F1414`) at a constant rate of **1Hz** (one flash per second). The flashing state remains active until acknowledged or resolved.
- **Nominal Operations:** Breakers, lines, and transformers remain static. Hovering over path elements highlights connections instantly with a soft outer accent shadow over `120ms`.
- **Dynamic Path Allocation:** Proposed agent restoration paths animate a dashed flow highlight over `200ms` using standard easing.

---

## 13. Notification Motion

### 13.1 Toast Alerts
- **Entrance:** Toast card slides in from the right edge of the screen, offset by `16px`, over `180ms` using `entrance` easing.
- **Exit:** Toast card slides out to the right margin over `150ms` using `exit` easing.
- **Vertical Reordering:** When a toast dismisses, adjacent toasts stack up smoothly over `180ms` using `standard` easing.

### 13.2 Critical Alarms (Top Banner)
- **Entrance:** Banner drops down from the top header boundary over `200ms` using `entrance` easing.
- **Pulse:** Pulsing alert outline (Red, `#EF4444`) transitions opacity at a slow, constant rate of `1.2s` cycles to signify urgent priority without blinking aggressively.

---

## 14. Micro Interactions

- **Tooltips:** Hovering over parameters or elements fades in tooltips after a `400ms` delay to prevent accidental popups during mouse sweeps. Fade duration is `100ms`.
- **Icons:** Hovering over action icons (e.g., Settings, Help, Collapsible Nav) shifts stroke color to Energy Orange (`#FF7A1A`) over `120ms` without scale or rotational shifts.

---

## 15. Accessibility & Reduced Motion

GPO respects system-level accessibility settings to prevent adverse reactions (e.g., motion sickness, seizures):

### 15.1 Media Query Rule
Whenever `prefers-reduced-motion: reduce` is detected at the OS level:
- Disable all sliding transitions (drawers, toast alerts). They must open/close instantly.
- Disable all scale transforms (button presses, modal entrances).
- Disable all pulsing animations (AI negotiation loops, warning banner glow cycles).
- Limit visual alerts to static color borders and high-contrast text indicators (e.g. `[CRITICAL ALERT]`).

---

## 16. Performance Guidelines

To maintain high frames-per-second (FPS) rendering on utility control wall boards:
- **Property Restrictions:** Transitions are restricted to GPU-accelerated CSS properties: `transform` (translates, scales) and `opacity`.
- **Prohibited Transition Properties:** Never transition properties that trigger layout reflow: `height`, `width`, `top`, `left`, `margin`, `padding`, `border-width`.
- **Hardware Acceleration:** Force GPU layering on moving elements (like drawers and modal wrappers) using CSS properties: `will-change: transform, opacity`.

---

## 17. Approved Animation Libraries

To ensure performance and maintain simple dependency codebases, GPO restricts tools to:
1.  **CSS Transitions & Keyframes:** The primary mechanism for standard buttons, tooltips, loading skeleton pulses, and toast entries.
2.  **React State Transitions:** Simple component-level mounting transitions.
3.  **Framer Motion / GSAP (Optional, SVG-Only):** Approved exclusively for zoom, pan, and coordinate calculations on the complex Grid Topology digital twin schematic map. All utility timing thresholds specified in Section 3 must still be configured.

---

## 18. Motion Do's

*   **DO** cap modal entrances and slide-out panels under `240ms`.
*   **DO** respect `prefers-reduced-motion: reduce` across all modules.
*   **DO** verify that all animated state transitions pair color changes with text descriptions (e.g., adding `[NEGOTIATING]` to a pulsing yellow dot).
*   **DO** leverage GPU-accelerated transition properties to ensure smooth `60 FPS` renderings.

---

## 19. Motion Don'ts

*   **DON'T** apply bouncing, elastic, or overshoot easing functions.
*   **DON'T** transition width, height, or padding properties that trigger browser reflow.
*   **DON'T** let telemetry values move, float, or slide during updates.
*   **DON'T** use looping animations for informational notifications.
*   **DON'T** animate chart metrics during real-time SCADA telemetry updates.

---

## 20. Future Motion Expansion Guidelines

If future updates require new animations (e.g. adding new vector graphics for physical assets):
1.  **Alignment:** Review this document to verify the proposed timing fits standard GPO tokens.
2.  **Peer Review:** New motion tokens must undergo review by at least one Senior UX Architect and one Frontend Engineer.
3.  **Performance Verification:** Confirm that the implementation does not trigger layout reflow and passes performance checks under heavy telemetry mock data loads.

---

## 21. Related Documents

*   [Product Vision](PRODUCT_VISION.md)
*   [Design System Specifications](DESIGN_SYSTEM.md)
*   [User Experience Standards](UX_GUIDELINES.md)
*   [Reusable Component Library](COMPONENT_LIBRARY.md)

---

## 22. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 23, 2026 | Initial Release of GPO Motion Design Specification | Principal UX Architect |
