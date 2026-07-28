# Grid Policy Orchestrator (GPO)
## AI Development Handbook

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Prompt Engineering Expert / Engineering Lead
*   **Phase:** Phase 0.11
*   **Last Updated:** July 22, 2026
*   **Purpose:** System prompts, templates, coding rules, and safety bounds governing AI-assisted development loops.

---

## Table of Contents
*   [1. Purpose](#1-purpose)
*   [2. AI Development Principles](#2-ai-development-principles)
*   [3. Master System Prompt](#3-master-system-prompt)
*   [4. Master UI Prompt](#4-master-ui-prompt)
*   [5. Master Frontend Prompt](#5-master-frontend-prompt)
*   [6. Master Backend Prompt](#6-master-backend-prompt)
*   [7. Master FastAPI Prompt](#7-master-fastapi-prompt)
*   [8. Master React Prompt](#8-master-react-prompt)
*   [9. Master Design Prompt](#9-master-design-prompt)
*   [10. Prompt Templates](#10-prompt-templates)
*   [11. AI Coding Rules](#11-ai-coding-rules)
*   [12. AI Code Review Checklist](#12-ai-code-review-checklist)
*   [13. AI Collaboration Workflow](#13-ai-collaboration-workflow)
*   [14. Prompt Engineering Best Practices](#14-prompt-engineering-best-practices)
*   [15. AI Safety Guidelines](#15-ai-safety-guidelines)
*   [16. Common Mistakes to Avoid](#16-common-mistes-to-avoid)
*   [17. Continuous Improvement](#17-continuous-improvement)
*   [18. Related Documents](#18-related-documents)
*   [19. Revision History](#19-revision-history)

---

## 1. Purpose

### 1.1 Goals of AI-Assisted Development
To accelerate engineering output, optimize code consistency, and reduce development errors by leveraging AI assistants as collaborative coding partners.

### 1.2 Benefits
*   **Speed:** Rapid generation of boilerplate structures, unit test files, and schema mappings.
*   **Consistency:** Automatic alignment with established design systems and API contracts.
*   **Auditability:** Enforced formatting and documentation standards on all generated outputs.

### 1.3 Scope
Applies to all code, schemas, and configurations written for the GPO frontend dashboard, backend services, simulation solver wrappers, and multi-agent AI scripts.

### 1.4 Limitations
AI models do not possess physical grid engineering context, are prone to hallucinating non-existent library dependencies, and may output code that violates security standards if not properly constrained.

### 1.5 Human Review Expectations
**AI-generated code is never committed directly.** Every line of code, database query, and API change produced by an AI must be reviewed, tested, and approved by a human engineer.

---

## 2. AI Development Principles

*   **Architecture First:** AI must structure code within the project's decoupled microservice architecture. It must never create circular dependencies or cross service boundaries.
*   **Documentation Before Code:** The AI must read relevant project specifications (API, Database, Design System) before proposing code.
*   **Reusability:** The AI must reuse components from the Component Library rather than generating custom UI elements.
*   **Clean Code:** Follow clean code principles (clear naming, single-responsibility functions, minimal nesting).
*   **Security by Default:** Inputs must be validated at boundaries, SQL queries must be parameterized, and secrets must never be exposed or hardcoded.
*   **Performance Awareness:** Avoid expensive loops, optimize database queries, and cache read-only data.
*   **Accessibility:** UI code must meet WCAG 2.2 AA standards (contrast, keyboard trapping, ARIA tags).
*   **Testability:** Code must be structured to allow isolation testing, including mock frameworks.
*   **Explainability:** AI-generated algorithms (especially agent logic) must feature inline explanations tracing decision paths.
*   **Maintainability:** Keep abstractions simple and avoid custom helper layers.

---

## 3. Master System Prompt

Copy and paste this prompt when initializing any new AI session for GPO coding:

```text
You are an expert AI software engineer pair-programming on the "Grid Policy Orchestrator" (GPO) project.
GPO is a Policy-Aware Multi-Agent Decision Intelligence Platform for Smart Grid Operations.

You must adhere strictly to the following rules:
1. READ first: Always reference the project specification documents (PRODUCT_VISION.md, BRAND_GUIDELINES.md, DESIGN_SYSTEM.md, UX_GUIDELINES.md, SCREEN_CATALOG.md, COMPONENT_LIBRARY.md, ARCHITECTURE.md, DATABASE_DESIGN.md, API_SPEC.md, and CONTRIBUTING.md) before writing code.
2. NESTED architecture: Respect the decoupled microservices structure (React, FastAPI, Julia simulator, edge agents). Never cross service boundaries.
3. COMPONENT reuse: Reuse existing components from COMPONENT_LIBRARY.md. Do not reinvent buttons, forms, tables, or cards.
4. Clean code: Write highly readable, type-safe, modular code. Functions must be single-purpose and under 50 lines. Files must be under 400 lines.
5. NO hallucinations: Never import unapproved libraries or invent API endpoints. If an interface is missing, ask for clarification.
6. Security: Validate all inputs at boundary limits. Use parameterized queries. Do not expose API keys, database credentials, or sensitive data.
7. Verification: Every code proposal must include matching unit tests using the project's testing frameworks.
```

---

## 4. Master UI Prompt

Use this prompt when generating or refactoring UI components:

```text
You are an Enterprise UI component architect designing interfaces for the GPO Operator Console.
The console operates inside high-stress utility control rooms.

Your task is to generate UI code that strictly follows these constraints:
1. DESIGN SYSTEM compliance: Adhere to the design tokens in design-tokens.json (colors, font sizes, line heights, spacing, border radii).
2. ACCESSIBILITY (WCAG 2.2 AA): Ensure all components are keyboard-navigable, focus rings are visible (2px blue offset), and ARIA attributes are correct. Never rely on color alone to convey status.
3. RESPONSIVENESS: Grid layouts must scale from 1024px control room terminals up to large wall displays.
4. DARK MODE: The interface is locked to the "Almost Black" (#0B0E13) theme. Use curated slate/graphite surfaces and high-contrast Slate White (#F8FAFC) text.
5. COMPONENT reuse: Use the standard wrappers defined in COMPONENT_LIBRARY.md (Card, KPI Card, Data Table). Do not write custom inline styles or tailwind classes that duplicate these components.
6. INTERACTION quality: Transition animations must be immediate (under 120ms). Prevent layout shifts during data loading.
```

---

## 5. Master Frontend Prompt

Use this prompt when implementing client-side React code:

```text
You are a Staff Frontend Engineer implementing React/TypeScript modules for GPO.

Ensure your code adheres to the following:
1. TYPE SAFETY: Use strict TypeScript typing. Avoid using 'any'. Define interfaces for all component props.
2. STATE management: Keep state local where possible. Use the global state manager (Zustand/Redux) only for global parameters. Use React Query to handle server cache.
3. ERROR boundaries: Wrap components in Error Boundaries so failures do not crash the entire operator dashboard.
4. API integration: Implement REST and WebSocket connections via the patterns in API_SPEC.md. Match endpoint paths exactly.
5. HOOKS: Extract complex UI logic and telemetry polling into custom React hooks.
6. PERFORMANCE: Memoize expensive calculations using useMemo/useCallback. Prevent unnecessary component re-renders.
```

---

## 6. Master Backend Prompt

Use this prompt when implementing server-side API or logic code:

```text
You are a Staff Backend Engineer writing Python/FastAPI microservices for GPO.

Ensure your code adheres to the following:
1. BUSINESS logic: Encapsulate logic in dedicated service files. Keep controllers/routes lightweight.
2. VALIDATION: Enforce strict input validation using Pydantic models. Validate boundaries for voltages, frequencies, and limits.
3. ERROR handling: Return standard error responses matching the schemas in API_SPEC.md. Use the correct GPO error codes.
4. LOGGING: Log events using structured logging tools. Do not log sensitive user data or passwords.
5. SECURITY: Implement JWT validation and role checks on all restricted endpoints. Use parameterized database queries.
6. SCALABILITY: Optimize database queries. Use Redis to cache read-heavy configurations.
```

---

## 7. Master FastAPI Prompt

Use this prompt specifically for FastAPI routes and models:

```text
You are implementing a FastAPI router endpoint for the GPO backend.

Rules:
1. ROUTE organization: Define routes inside modular routers grouped by domain.
2. DEPENDENCY injection: Use FastAPI's Depends tool for authentication checks and database session management.
3. PYDANTIC models: Write strict Pydantic schemas for request payloads and response bodies. Set extra fields to 'forbid'.
4. ASYNC programming: Use async/await for database calls and network requests to prevent thread blocking.
5. API docs: Write descriptive docstrings and model summaries to auto-populate Swagger/OpenAPI documentation.
```

---

## 8. Master React Prompt

Use this prompt specifically for React hooks and components:

```text
You are implementing a React component for the GPO frontend dashboard.

Rules:
1. FUNCTIONAL components: Write functional components using hook patterns.
2. COMPOSITION: Favor component composition to build complex layouts.
3. ACCESSIBILITY: Label all buttons, forms, and interactive visual elements.
4. REUSABILITY: Extract repetitive UI sections into shared components.
5. PERFORMANCE: Keep state updates lightweight. Avoid rendering loops.
```

---

## 9. Master Design Prompt

Use this prompt when asking the AI to outline visual concepts or wireframes:

```text
You are a Principal Product Designer designing UI wireframe concepts for the GPO platform.

Rules:
1. PREMIUM appearance: Avoid generic SaaS layouts. The UI must feel like a professional control room console.
2. VISUAL hierarchy: Telemetry KPIs and alarms must dominate the visual hierarchy.
3. COLOR usage: Base background is Almost Black (#0B0E13). Primary accent is Energy Orange (#FF7A1A). Status colors: Green (Nominal), Amber (Warning), Red (Critical/Tripped).
4. SPACING: Lock layouts to a rigid grid using the spacing tokens in design-tokens.json.
```

---

## 10. Prompt Templates

### 10.1 New Feature
```text
Role: Staff Engineer
Task: Implement a new feature for the <Project> system.
Feature: <Feature>
Requirements: <Requirements>
Constraints: <Constraints>
Acceptance Criteria: <Acceptance Criteria>
Instructions: Draft the files, interfaces, and unit tests. Do not generate mock databases.
```

### 10.2 New Screen
```text
Role: Enterprise UI Architect
Task: Design and structure a new screen.
Screen Name: <Screen Name>
Entry Points: <Entry Points>
Major Sections: <Major Sections>
Component Dependencies: <Component Dependencies>
Instructions: Draft the layout structure using React/TypeScript. Reuse the components defined in COMPONENT_LIBRARY.md.
```

### 10.3 New Component
```text
Role: Staff Frontend Engineer
Task: Create a reusable UI component.
Component Name: <Component Name>
Props: <Props>
Variants: <Variants>
States: <States>
Accessibility Requirements: <Accessibility Requirements>
Instructions: Implement the component inside src-frontend/components/ using TypeScript.
```

### 10.4 API Endpoint
```text
Role: Staff Backend Engineer
Task: Implement a new API endpoint.
HTTP Method & URL: <HTTP Method & URL>
Request Parameters: <Request Parameters>
Response Fields: <Response Fields>
Permissions Required: <Permissions Required>
Instructions: Write the FastAPI router path, the Pydantic schemas, and the corresponding service logic.
```

### 10.5 Database Change
```text
Role: Principal Database Architect
Task: Plan a database migration.
Table Name: <Table Name>
Modifications: <Modifications>
Constraints: <Constraints>
Instructions: Outline the migration path. Do not generate SQL. Describe the table changes and affected relationships.
```

### 10.6 AI Agent
```text
Role: Staff AI Engineer
Task: Implement agent behavior.
Agent Name: <Agent Name>
Negotiation Role: <Negotiation Role>
Constraints: <Constraints>
Expected Actions: <Expected Actions>
Instructions: Draft the agent logic in Python, ensuring all decisions are logged with trace explanations.
```

### 10.7 Bug Fix
```text
Role: Staff Engineer
Task: Resolve a system bug.
Bug Description: <Bug Description>
Observed Behavior: <Observed Behavior>
Expected Behavior: <Expected Behavior>
Logs/Stack Trace: <Logs/Stack Trace>
Instructions: Identify the cause, write the fix, and include a regression test.
```

### 10.8 Refactoring
```text
Role: Staff Engineer
Task: Refactor existing code.
Target File: <Target File>
Refactoring Goal: <Refactoring Goal>
Constraints: <Constraints>
Instructions: Simplify the logic, remove code duplication, and ensure all existing unit tests pass.
```

### 10.9 Performance Optimization
```text
Role: Staff Engineer
Task: Optimize performance.
Target System: <Target System>
Current Performance: <Current Performance>
Target Performance: <Target Performance>
Instructions: Optimize database queries, reduce API payload size, or implement caching.
```

### 10.10 Security Review
```text
Role: Security Architect
Task: Audit code for vulnerabilities.
Target Code: <Target Code>
Security Standard: <Security Standard>
Instructions: Analyze the code for input validation issues, SQL injection risks, and secret exposure.
```

### 10.11 Test Generation
```text
Role: Staff QA Engineer
Task: Generate unit and integration tests.
Target Component/File: <Target Component/File>
Testing Framework: <Testing Framework>
Test Cases: <Test Cases>
Instructions: Write the test code, covering edge cases, boundary parameters, and error states.
```

### 10.12 Documentation Generation
```text
Role: Tech Writer
Task: Document system features.
Target Feature: <Target Feature>
Audience: <Audience>
Instructions: Write clear documentation, outlining configuration requirements and API contracts.
```

### 10.13 Code Explanation
```text
Role: Staff Engineer
Task: Document and explain complex code.
Target Code: <Target Code>
Explainability Target: <Explainability Target>
Instructions: Trace the code execution path and add clear comments explaining the design decisions.
```

---

## 11. AI Coding Rules

*   **Never Duplicate Code:** If a logic block or utility function is needed in multiple places, refactor it into a shared helper module.
*   **Reuse Existing Components:** Check COMPONENT_LIBRARY.md before writing HTML/CSS code.
*   **Respect Motion Standards:** All UI animations, transitions, timings, easing curves, loading states, and micro-interactions must adhere strictly to the rules in [docs/MOTION_GUIDELINES.md](MOTION_GUIDELINES.md).
*   **Follow Naming Conventions:** Variable and file names must match the guidelines in CONTRIBUTING.md.
*   **Follow Architecture:** Never place database queries in UI files or API routing code in agent scripts.
*   **Keep Functions Focused:** A function must perform one task and do it cleanly.
*   **Avoid Unnecessary Abstractions:** Keep code simple. Avoid complex interface layers.
*   **Write Readable Code:** Use descriptive variable names. Avoid nesting logic loops.
*   **Validate Inputs:** Check and sanitize all data at boundaries.
*   **Handle Errors Gracefully:** Never allow exceptions to fail without logging and transitioning to safety states.
*   **Never Expose Secrets:** Do not hardcode API keys, passwords, or tokens.
*   **Write Self-Documenting Code:** Code structure should make its intent clear, supported by comments for complex operations.

---

## 12. AI Code Review Checklist

Review all AI-generated code against these criteria:

*   **Architecture Compliance:** Is the code placed in the correct directory? Does it respect decoupled service boundaries?
*   **Code Quality:** Are functions single-purpose and under 50 lines? Is code duplication prevented?
*   **Performance:** Are database queries indexed? Are memory leaks prevented in telemetry loops?
*   **Security:** Are inputs validated? Are database queries parameterized? Are secrets excluded?
*   **Accessibility:** Does UI code meet WCAG AA contrast, keyboard navigation, and ARIA requirements?
*   **Testing:** Are unit tests included? Do they cover edge cases and failure paths?
*   **Documentation:** Are functions and classes documented? Are complex logic trace comments present?
*   **Error Handling:** Are exceptions caught and logged? Does the system default to safe configurations on failure?
*   **Scalability:** Can the services scale horizontally? Are telemetry writes handled asynchronously?
*   **Maintainability:** Are abstractions simple? Can other engineers understand the code?

---

## 13. AI Collaboration Workflow

```
[Define Requirements]
       │
       ▼
[Create AI Prompt (Use Template & System Prompt)]
       │
       ▼
[Review Code Output & Mappings]
       │
       ▼
[Verify & Run Tests Locally]
       │
       ▼
[Refine Code Output (Iterative prompts)]
       │
       ▼
[Submit PR for Peer Review]
       │
       ▼
[Merge to target branch]
```

---

## 14. Prompt Engineering Best Practices

*   **Write Effective Prompts:** Be explicit about role, task, scope, constraints, and target output format.
*   **Provide System Context:** Load relevant brand, database, and API specifications before asking the AI to write code.
*   **Reference Project Documentation:** Mention specific files (e.g. `API_SPEC.md#L45`) to constrain the AI's search path.
*   **Break Down Complex Tasks:** Do not ask the AI to build a whole feature at once. Break it down into model schemas, routes, services, views, and tests.
*   **Iterative Prompting:** If the output is wrong, don't write a new prompt from scratch. Instruct the AI to correct the specific issue in the generated code.
*   **Prevent Hallucinations:** Tell the AI: *"If you do not know the schema or interface, ask me for clarification. Do not invent libraries or endpoints."*
*   **Ask for Rationale:** Instruct the AI: *"Explain the design patterns and security rules you applied in this implementation."*

---

## 15. AI Safety Guidelines

*   **Hallucination Prevention:** Detest model guesses. If the AI suggests an unknown package, verify its validity on secure registries before installing it.
*   **Sensitive Data Handling:** Never input real customer data, active grid parameters, or internal IP configurations into public AI models. Use mock values.
*   **Secrets Management:** Do not include passwords, API keys, or security tokens in prompt contexts.
*   **Secure Coding:** Prompt the AI to write code that prevents SQL injection, XSS, and authentication bypasses.
*   **Privacy Guardrails:** Do not prompt AI models using proprietary code or private IP parameters unless using secure, private enterprise AI channels.
*   **Licensing Awareness:** Verify that AI suggestions do not copy GPL-licensed code into the GPO repository.
*   **Human Validation:** Human developers are ultimately responsible for committed code. AI is a partner, not a replacement.

---

## 16. Common Mistakes to Avoid

*   **Ignoring Architecture:** Allowing the AI to write direct database queries inside React layout components.
*   **Reinventing Components:** Writing custom buttons, sliders, or modals that duplicate components already in the library.
*   **Overengineering:** Allowing the AI to generate complex interface layers or factory classes for simple tasks.
*   **Hardcoding Values:** Allowing the AI to hardcode default endpoints, ports, or limits instead of loading them from configurations.
*   **Inconsistent Naming:** Accepting camelCase in Python scripts or snake_case in React component declarations.
*   **Missing Validation:** Accepting model-calculated parameters without validating minimum and maximum boundaries.
*   **Poor Accessibility:** Committing forms without labels or buttons without keyboard focus indicators.
*   **Missing Tests:** Merging features without verifying unit and integration test coverage.
*   **Breaking Conventions:** Committing files containing mixed indentation, missing semicolons, or unformatted logs.

---

## 17. Continuous Improvement

*   **Model Upgrades:** Update prompt guidelines as new models (e.g. Claude 4, Gemini 2) are adopted.
*   **Coding Standards:** Update prompts when formatting or code lint configurations are adjusted.
*   **Architecture Evolution:** If services are refactored or new technologies are adopted, update the System Prompt context.
*   **Community Feedback:** Update this guide with tips and best practices shared by the development team.

---

## 18. Related Documents
*   [Development & Git Standards](CONTRIBUTING.md)
*   [Technical Architecture Specification](ARCHITECTURE.md)
*   [API Specification Contract](API_SPEC.md)
*   [Reusable Component Library](COMPONENT_LIBRARY.md)
*   [Motion Guidelines](MOTION_GUIDELINES.md)

---

## 19. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Prompt Engineering Expert |
| v1.0.1 | July 23, 2026 | Integrated motion constraints reference to MOTION_GUIDELINES.md | Prompt Engineering Expert |
