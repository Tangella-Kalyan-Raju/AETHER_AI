# Grid Policy Orchestrator (GPO)
## Development & Git Standards

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Staff Developer Experience Engineer
*   **Phase:** Phase 0.10
*   **Last Updated:** July 22, 2026
*   **Purpose:** Guidelines for code formatting, branching models, conventional commit rules, and pull request review criteria.

---

## Table of Contents
*   [1. Development Philosophy](#1-development-philosophy)
*   [2. Repository Structure](#2-repository-structure)
*   [3. Branch Strategy](#3-branch-strategy)
*   [4. Commit Message Convention](#4-commit-message-convention)
*   [5. Pull Request Standards](#5-pull-request-standards)
*   [6. Code Style Guidelines](#6-code-style-guidelines)
*   [7. Linting Standards](#7-linting-standards)
*   [8. Formatting Standards](#8-formatting-standards)
*   [9. Naming Conventions](#9-naming-conventions)
*   [10. Folder Organization](#10-folder-organization)
*   [11. Environment Variables](#11-environment-variables)
*   [12. Documentation Standards](#12-documentation-standards)
*   [13. Testing Standards](#13-testing-standards)
*   [14. Code Review Checklist](#14-code-review-checklist)
*   [15. Security Best Practices](#15-security-best-practices)
*   [16. Development Workflow](#16-development-workflow)
*   [17. Related Documents](#17-related-documents)
*   [18. Revision History](#18-revision-history)

---

## 1. Development Philosophy

*   **Engineering-First Principles:** GPO is a mission-critical utility instrument. Code must be written with priority on correctness, predictability, and performance over convenience.
*   **Clean Architecture Mindset:** Maintain clear separation of concerns. UI layers must remain completely decoupled from core calculations, policy evaluation, and database queries.
*   **Maintainability & Readability:** Code is read far more often than it is written. Variable names must be explicit, functions must serve single purposes, and complex logic must be documented.
*   **Simplicity:** Avoid over-engineering. Rely on standard, proven design patterns (e.g., repository pattern, dependency injection) instead of custom frameworks.
*   **Scalability:** Design modules to run asynchronously where possible (e.g., telemetry processing, log exports) to handle scaling needs without locking main event loops.

---

## 2. Repository Structure

```
gpo-monolith/
├── .github/          # GitHub configuration, pull request templates, and CI/CD pipelines
├── docs/             # Technical specifications, user manuals, and compliance documentation
├── src-frontend/     # Client-side React dashboard code
├── src-backend/      # FastAPI API services and core orchestration modules
├── src-simulation/   # Julia power-flow simulation engine and solvers
├── src-agents/       # Multi-agent consensus systems and edge controller scripts
├── database/         # Database migrations, seed data, and schema definitions
├── tests/            # Test suites (unit, integration, end-to-end)
└── config/           # Default system constants, logging profiles, and configs
```

---

## 3. Branch Strategy

*   **`main` Branch:** Represents the stable, production-ready release state. Direct commits are blocked. Deploys to the production cloud.
*   **`development` Branch:** The primary integration branch where feature branches merge. All automated integration tests run here.
*   **`feature/*` Branches:** Used to develop new features (e.g., `feature/policy-studio-compiler`). Branched from `development`, merged back via PR.
*   **`bugfix/*` Branches:** Used for standard bug fixes (e.g., `bugfix/dnp3-packet-drop`). Branched from `development`, merged back via PR.
*   **`hotfix/*` Branches:** High-priority production fixes (e.g., `hotfix/auth-session-leak`). Branched directly from `main`, merged to both `main` and `development`.
*   **`release/*` Branches:** Pre-production staging builds (e.g., `release/v1.0.0-rc1`). Branched from `development` to freeze features for final validation.

---

## 4. Commit Message Convention

GPO follows Conventional Commits formatting: `<type>(<scope>): <description>`.

### 4.1 Commit Types
*   `feat`: A new system feature or component.
*   `fix`: A bug fix.
*   `refactor`: Code changes that neither fix bugs nor add features.
*   `docs`: Documentation updates only.
*   `style`: Formatting updates (missing semicolons, spacing, linting).
*   `test`: Adding or correcting tests.
*   `chore`: Tooling updates, dependency bumps, or config adjustments.
*   `perf`: Code changes improving calculation or execution speed.
*   `ci`: CI/CD pipeline or action script adjustments.
*   `build`: Changes affecting build systems or packaging configurations.

### 4.2 Commit Examples
*   `feat(policy): integrate syntax highlighter in rules text editor`
*   `fix(scada): resolve DNP3 pointer mismatch in telemetry loader`
*   `docs(api): document websocket parameters in API contract`
*   `test(agents): add unit check verifying consensus timeout trigger`
*   `refactor(db): optimize user-role junction table indexes`

---

## 5. Pull Request Standards

*   **PR Naming:** Prefixed with conventional type (e.g. `feat: add GIS weather overlays`).
*   **Required Description:** Must outline:
    1.  *Summary:* Purpose of the changes.
    2.  *Impact:* Affected components or database schemas.
    3.  *Manual Testing:* Steps taken to verify functionality.
*   **Linked Issues:** Must reference open tracking issues (e.g. `Closes #124`).
*   **Screenshots / Recordings:** Required for any visible UI modifications.
*   **Testing Checklist:** Verification that unit, integration, and security checks pass locally.
*   **Review Checklist:** Code style checks, security reviews, and verification of architectural alignment.
*   **Approval Process:** Requires approval from at least two senior engineers before merge eligibility.
*   **Merge Strategy:** Squashed and merged into `development` to maintain a clean git history.

---

## 6. Code Style Guidelines

*   **Formatting Consistency:** Enforce automatic formatting on save. Codebases must share identical spacing and styles.
*   **Readability Over Conciseness:** Write explicit code. Avoid obscure syntax.
*   **Function Size Limits:** Keep functions focused on a single task. Functions should not exceed 50 lines of code.
*   **File Size Limits:** Files should focus on a single concern, keeping size under 400 lines of code.
*   **Class Design:** Apply SOLID principles. Favor composition over inheritance.
*   **Error Handling:** Never swallow exceptions. Wrap external network calls in try-catch-finally blocks, ensuring system resources are cleared.
*   **Comments:** Write comments explaining *why* a particular approach was taken for complex operations, rather than *what* the code does.
*   **Documentation:** Functions, classes, and APIs must feature clear docstrings outlining input parameters, return types, and exceptions.

---

## 7. Linting Standards

*   **Static Analysis:** Enforce linting checks (e.g., ESLint, Ruff) during local development and CI stages to block invalid syntax.
*   **Unused Code Detection:** Unused variables, empty imports, and dead functions must be detected and removed before pull requests are submitted.
*   **Import Ordering:** Group imports cleanly:
    1.  Core language imports (React, Python packages).
    2.  External third-party libraries.
    3.  Internal components, utilities, and assets.
*   **Consistency Policies:** Lint rules must check code format patterns, variable definitions, and type checks to maintain codebase consistency.

---

## 8. Formatting Standards

*   **Code Formatter:** Prettier (or language equivalent) runs automatically on save.
*   **Indentation:** Locked to 2 spaces for frontend code (TypeScript, HTML, CSS), and 4 spaces for backend code (Python, Julia). Tabs are prohibited.
*   **Line Length limits:** Keep lines under 120 characters to improve legibility on split-screen displays.
*   **Quotes:** Double quotes (`"`) for TypeScript and HTML, single quotes (`'`) for Python string declarations (unless containing quotes).
*   **Semicolons:** Required in TypeScript/JavaScript; omitted in Python.
*   **Spacing:** Enforce single spaces around operators, parameters, and block brackets.
*   **Trailing Commas:** Required on multi-line objects, arrays, and parameter declarations to minimize git diff line noise.

---

## 9. Naming Conventions

*   **Files:** PascalCase for React component files (`GridMap.tsx`), lowercase kebab-case for assets and scripts (`dnp3_handler.py`).
*   **Folders:** Lowercase kebab-case across all directories (e.g. `/src-frontend/shared-components`).
*   **Components:** PascalCase (e.g., `SubstationDetailsDrawer`).
*   **Functions:** camelCase for TypeScript (`calculateLoad`), snake_case for Python (`verify_constraints`).
*   **Variables:** camelCase for TypeScript, snake_case for Python.
*   **Constants:** SCREAMING_SNAKE_CASE (e.g. `MAX_VOLTAGE_LIMIT`).
*   **Interfaces & Types:** PascalCase, descriptive names (e.g., `GridNodeProperties`).
*   **Classes:** PascalCase (e.g., `TelemetryBrokerConnection`).
*   **APIs:** Lowercase kebab-case URL path parameters (e.g. `/api/v1/grid-assets`).
*   **Database Entities:** Plural snake_case for tables (`audit_logs`); singular snake_case for fields (`user_id`).
*   **Environment Variables:** SCREAMING_SNAKE_CASE prefixed by environment name (e.g. `GPO_DB_PASSWORD`).

---

## 10. Folder Organization

*   **Feature-Based Organization:** Group modules by functional domains (e.g., `/features/policy-editor`).
*   **Shared Modules:** Common resources (shared helpers, base classes) are isolated in root shared folders to prevent circular dependencies.
*   **Assets:** Static files (SVG markers, brand icons) are kept in dedicated asset directories.
*   **Components:** Reusable UI elements are stored in `/components` directories.
*   **Services:** Classes wrapping external APIs (e.g. database gateways, email servers) are isolated from layout views.
*   **Utilities:** Pure helper functions (formatters, mathematical calculators) are kept in `/utils`.
*   **Hooks:** Custom React state managers are isolated in `/hooks`.
*   **Context:** Global view states are kept in `/context` or `/store`.
*   **Configuration:** Platform settings, constants, and logging rules are kept in `/config`.
*   **Tests:** Kept in adjacent directories named `/tests` matching the structure of the target code.

---

## 11. Environment Variables

*   **Naming Conventions:** Standard SCREAMING_SNAKE_CASE using a subsystem prefix (e.g. `GPO_AUTH_CLIENT_SECRET`).
*   **Public vs Private:** 
    *   *Public:* UI configuration variables (prefixed with `PUBLIC_` or `REACT_APP_`).
    *   *Private:* DB credentials, private security tokens, and encryption keys.
*   **Secrets Management:** Secrets must never be committed to git repositories. Staging and production secrets are injected at runtime using secure container vault systems.
*   **Local Development:** Loaded from local `.env.example` templates, copied to a git-ignored `.env` file.
*   **Staging & Production:** Loaded directly from container environments managed by the deployment gateway.

---

## 12. Documentation Standards

*   **README Updates:** Major feature updates require updates to the root README, covering installation instructions, dependencies, and parameters.
*   **Inline Documentation:** Complex logic, workarounds, or regulatory checks must feature comments explaining the implementation rationale.
*   **API Documentation:** Changes to API routes require updates to the API specifications.
*   **Architecture Documentation:** System design changes must be documented in the technical architecture specifications.
*   **Change Logs:** Commits are compiled into a central CHANGELOG markdown file at each release, listing updates, fixes, and security patches.

---

## 13. Testing Standards

*   **Unit Testing:** Focuses on pure functions, validation logic, and utility algorithms. Target code coverage: 90%.
*   **Integration Testing:** Verifies connections between services, database queries, and multi-agent negotiations. Target code coverage: 80%.
*   **End-to-End (E2E) Testing:** Simulates user flows (e.g. login, scenario execution, manual overrides) on staging builds.
*   **Coverage Expectations:** Pull requests are blocked if code coverage drops below systemic baselines.
*   **Naming Conventions:** Test files must match the target file name with a `.test` suffix (e.g. `rule_compiler.test.py`).
*   **Test Organization:** Test suites are kept in adjacent `/tests` directories matching the structure of the target modules.

---

## 14. Code Review Checklist

During review, code must be evaluated against the following criteria:
*   **Readability:** Is the code clean and understandable? Do variables use descriptive names?
*   **Performance:** Are database queries indexed? Are memory leak loops prevented?
*   **Security:** Are user inputs validated? Are database queries parameterized?
*   **Accessibility:** Does the interface support WCAG AA requirements? Are color blind safety markers present?
*   **Error Handling:** Are exceptions caught and logged? Are fail-safe configurations defined?
*   **Testing:** Are unit and integration tests present? Does coverage match baselines?
*   **Documentation:** Are functions and classes documented? Are inline explanations clear?
*   **Architecture Compliance:** Does the implementation follow clean architecture principles? Is UI logic decoupled from system calculations?

---

## 15. Security Best Practices

*   **Secret Handling:** Never hardcode secrets. Ensure credentials are loaded from system environment variables at runtime.
*   **Dependency Management:** Regularly scan dependencies for security vulnerabilities. Update packages containing known exploits.
*   **Input Validation:** Sanitize user inputs at boundary limits. Use parameterized queries to prevent SQL injections.
*   **Logging Security:** Ensure user passwords, session tokens, and keys are masked in logs.
*   **Authentication & Authorization:** Verify access tokens at the API gateway. Verify user role permissions for all mutating endpoints.
*   **Sensitive Data Protection:** Encrypt personal data at rest using AES-256 keys, and in transit using TLS 1.3.

---

## 16. Development Workflow

```
[Issue Creation]
       │
       ▼
[Branch Creation (feature/*)]
       │
       ▼
[Development & Local Testing]
       │
       ▼
[Commit & Push]
       │
       ▼
[Pull Request Submission]
       │
       ▼
[CI/CD Check Pipeline (Build, Lint, Test)]
       │
       ▼
[Code Review & Two Approvals]
       │
       ▼
[Squash & Merge to development]
       │
       ▼
[Release Candidate compilation (release/*)]
       │
       ▼
[Staging Verification Tests]
       │
       ▼
[Merge to main & Production Deployment]
```

---

## 17. Related Documents
*   [AI Development Handbook](AI_DEVELOPMENT_GUIDE.md)
*   [Technical Architecture Specification](ARCHITECTURE.md)
*   [Database & Schema Design](DATABASE_DESIGN.md)
*   [API Specification Contract](API_SPEC.md)

---

## 18. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Staff Developer Experience Engineer |
