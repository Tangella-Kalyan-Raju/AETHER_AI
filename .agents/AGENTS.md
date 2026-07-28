# Grid Policy Orchestrator - Project-Scoped Rules

This document outlines the permanent foundational rules for development, design, and architecture for the Grid Policy Orchestrator (GPO).

---

## 1. Product Vision & Direction
* **AI-Native Operating System**: The GPO is an AI-powered Enterprise Grid Operating System for electrical utility control rooms. It is NOT an admin template, Grafana/Kibana dashboard clone, or Power BI dashboard.
* **No Redesign of Completed Code**: Do NOT redesign completed backend functionality or rebuild previously completed modules unless explicitly instructed by the user.

---

## 2. User Experience & Design Philosophy
* **AI-First Workspace Layout**: The primary interaction interface is the conversational AI Workspace (similar to ChatGPT/Claude/Cursor). Traditional graphs and tables are supporting views.
* **Three-Panel Layout**:
  1. **Left Sidebar Navigation**: Organizes modules into flat operational groups (Operations, Planning, Grid, Monitoring, Intelligence, Administration).
  2. **Center Canvas**: The primary workspace where conversations, digital twin simulations, optimization results, and interactive widgets are rendered.
  3. **Right Context Panel**: Displays contextual parameters (weather logs, running solvers, incident feeds) dynamically without permanent KPI blocks.
* **Workflow-First Design**: Lead every module with an operational question/goal (e.g., *"What scenario would you like to simulate?"*) and hide heavy graphs/charts until relevant workflows are initiated.

---

## 3. Core Capabilities
* **Green Mode Strategy**: Optimize battery dispatch, renewable solar/wind yield integration, and overall grid stability. Do NOT prioritize carbon accounting/ESG unless requested.
* **Weather & GIS**: Treat localized weather intelligence as a core dependency for all optimization and load prediction tasks. Integrate GIS mappings with substation SCADA telemetry.
* **AI Recommendations**: Always explain recommendations with confidence scores, reasoning steps, evidence bounds, alternative paths, and operational impact projections.

---

## 4. Development Principles
* Extend existing modules rather than building duplicate pages.
* Maintain strict backwards compatibility for backend API endpoints, RBAC policies, SCADA telemetry streaming, database migrations, and testing scripts.
