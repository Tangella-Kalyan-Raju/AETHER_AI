# Grid Policy Orchestrator (GPO)
## API Specification Contract

*   **Version:** v1.0.0
*   **Status:** Approved
*   **Owner:** Principal API Architect / Backend Architect
*   **Phase:** Phase 0.9
*   **Last Updated:** July 22, 2026
*   **Purpose:** Outlines RESTful and WebSocket API contracts, response wrappers, validation, error formats, and external integrations.

---

## Table of Contents
*   [1. API Overview](#1-api-overview)
    *   [1.1 API Philosophy](#11-api-philosophy)
    *   [1.2 Design Principles](#12-design-principles)
    *   [1.3 REST Conventions](#13-rest-conventions)
    *   [1.4 Naming Standards](#14-naming-standards)
    *   [1.5 Resource Organization](#15-resource-organization)
*   [2. API Versioning](#2-api-versioning)
*   [3. Authentication & Authorization](#3-authentication--authorization)
*   [4. Standard Request Format](#4-standard-request-format)
*   [5. Standard Response Format](#5-standard-response-format)
    *   [5.1 Success Response Structure](#51-success-response-structure)
    *   [5.2 Error Response Structure](#52-error-response-structure)
*   [6. Error Handling](#6-error-handling)
*   [7. Endpoint Groups](#7-endpoint-groups)
    *   [7.1 Authentication Group](#71-authentication-group)
    *   [7.2 Users Group](#72-users-group)
    *   [7.3 Dashboard Group](#73-dashboard-group)
    *   [7.4 Digital Twin Group](#74-digital-twin-group)
    *   [7.5 Grid Assets Group](#75-grid-assets-group)
    *   [7.6 Scenarios Group](#76-scenarios-group)
    *   [7.7 Simulation Group](#77-simulation-group)
    *   [7.8 Policies Group](#78-policies-group)
    *   [7.9 AI Group](#79-ai-group)
    *   [7.10 Analytics Group](#710-analytics-group)
    *   [7.11 Notifications Group](#711-notifications-group)
    *   [7.12 Audit Logs Group](#712-audit-logs-group)
    *   [7.13 Administration Group](#713-administration-group)
    *   [7.14 Health Group](#714-health-group)
*   [8. External Integrations](#8-external-integrations)
*   [9. Security Standards](#9-security-standards)
*   [10. API Best Practices](#10-api-best-practices)
*   [11. Related Documents](#11-related-documents)
*   [12. Revision History](#12-revision-history)

---

## 1. API Overview

### 1.1 API Philosophy
GPO employs a **RESTful API design** for standard configurations, resource CRUD tasks, and historical logs, coupled with **WebSocket protocols** for real-time, low-latency telemetry updates (frequency and voltage fluctuations). 

### 1.2 Design Principles
*   **Stateless Operations:** REST endpoints contain all context required to process requests. User state is verified using tokens.
*   **Predictable URL Paths:** Endpoint structures map directly to resources.
*   **Type-Safe Request Payload:** Input parameters are checked against schemas at the gateway boundary.
*   **Resource Separation:** Separate physical grid telemetry endpoints from policy compile actions to optimize bandwidth.

### 1.3 REST Conventions
*   `GET` - Retrieve a resource or list.
*   `POST` - Create a resource or execute an operation (e.g. compile policy).
*   `PUT` - Overwrite an existing resource.
*   `PATCH` - Partially update a resource (e.g. modify line status).
*   `DELETE` - Soft-delete a resource.

### 1.4 Naming Standards
URLs and request queries use **lowercase, kebab-case**. Resource paths are plural (e.g. `/api/v1/grid-assets`). Request payloads use **camelCase** parameter naming.

### 1.5 Resource Organization
Subsystems are grouped under namespace modules:
*   `/auth` (Authentication)
*   `/users` (Operator profiles)
*   `/dashboard` (Real-time telemetry and overview data)
*   `/digital-twin` (Grid models and structural topology)
*   `/scenarios` (Contingency configurations)
*   `/simulations` (Active test runs)
*   `/policies` (Rules, guidelines, compiler)
*   `/agents` (Multi-agent configurations, decisions)
*   `/analytics` (Reports, logs)
*   `/admin` (Role access management, backups)

---

## 2. API Versioning

*   **Versioning Strategy:** API versions are declared in the URL path prefix (e.g., `/api/v1/...`).
*   **Current Version:** `v1.0.0-ALPHA`.
*   **Future Compatibility:** Patch updates do not change paths. Major changes increment version codes.
*   **Deprecation Policy:** Deprecated APIs return the `Sunset` HTTP header. Deactivation occurs 90 days after announcement.

---

## 3. Authentication & Authorization

*   **Authentication Mechanism:** OpenID Connect (OIDC) via JSON Web Tokens (JWT).
*   **Authorization Strategy:** Role-Based Access Control (RBAC).
*   **Token Lifecycle:** Access tokens expire in 15 minutes; Refresh tokens are valid for 12 hours.
*   **Refresh Flow:** Clients trade valid Refresh tokens for new Access tokens via `/api/v1/auth/refresh`.
*   **RBAC Levels:** Permissions are verified at the gateway level. For example, manual overrides require `Operator` or `Administrator` clearances.

---

## 4. Standard Request Format

*   **Headers:**
    *   `Content-Type: application/json`
    *   `Accept: application/json`
    *   `X-Request-ID: [Unique UUID generated by client for tracking]`
*   **Authentication Header:** `Authorization: Bearer [JWT_ACCESS_TOKEN]`
*   **Query Parameters:**
    *   *Pagination:* `page=[integer]`, `limit=[integer]` (Max 100).
    *   *Filtering:* Key-value checks (e.g., `status=active`, `type=substation`).
    *   *Sorting:* `sort_by=[field]`, `order=[asc|desc]`.

---

## 5. Standard Response Format

### 5.1 Success Response Structure
Every successful response returns:
*   `requestId` (String, UUID mapping the request).
*   `success` (Boolean, set to true).
*   `data` (Object or Array containing the resource payload).
*   `meta` (Object containing pagination details like `page`, `limit`, `totalCount`, `totalPages` if applicable).

### 5.2 Error Response Structure
Every failed request returns:
*   `requestId` (String, UUID mapping the request).
*   `success` (Boolean, set to false).
*   `error` (Object containing `code` [JetBrains Mono error code], `message` [Actionable text summary], and `details` [Optional validation checklist mapping invalid parameters]).

---

## 6. Error Handling

| Category | Recommended HTTP Code | Standard GPO Error Code | Purpose / Context |
| :--- | :--- | :--- | :--- |
| **Authentication** | `401 Unauthorized` | `ERR.AUTH-EXPIRED` | Expired access token. |
| **Authorization** | `403 Forbidden` | `ERR.AUTHZ-PERM` | Missing role permission clearances. |
| **Validation** | `400 Bad Request` | `ERR.VAL-LIMIT` | Parameter outside safety limits. |
| **Resource** | `404 Not Found` | `ERR.RES-NOT-FOUND` | Substation or policy ID does not exist. |
| **Business Logic** | `422 Unprocessable` | `ERR.POL-COMPILE-FAIL` | Policy file failed syntax compilation. |
| **AI Service** | `502 Bad Gateway` | `ERR.AI-CONSENSUS-TIMEOUT` | Agents failed to reach consensus. |
| **Simulation** | `500 Server Error` | `ERR.SIM-SOLVER-FAIL` | Power flow calculation failure. |
| **Server** | `500 Server Error` | `ERR.SYS-DATABASE-DOWN` | Database connection lost. |

---

## 7. Endpoint Groups

### 7.1 Authentication Group

#### Login
*   **Purpose:** Authenticate credentials.
*   **HTTP Method & URL:** `POST /api/v1/auth/login`
*   **Authentication Required:** No.
*   **Request Schema:** `email` (String, required), `password` (String, required), `mfaCode` (String, required).
*   **Response Schema:** `accessToken` (String), `refreshToken` (String), `expiresIn` (Integer), `userRole` (String).
*   **Possible Errors:** `ERR.VAL-EMPTY`, `ERR.AUTH-INVALID-CREDENTIALS`.

#### Logout
*   **Purpose:** Invalidate session tokens.
*   **HTTP Method & URL:** `POST /api/v1/auth/logout`
*   **Authentication Required:** Yes.
*   **Request Schema:** `refreshToken` (String, required).
*   **Response Schema:** `status` (String, confirmation value).
*   **Possible Errors:** `ERR.AUTH-INVALID-TOKEN`.

#### Signup
*   **Purpose:** Register user credentials.
*   **HTTP Method & URL:** `POST /api/v1/auth/signup`
*   **Authentication Required:** No.
*   **Request Schema:** `name` (String, required), `email` (String, required), `employeeId` (String, required), `password` (String, required), `adToken` (String, required).
*   **Response Schema:** `userId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.VAL-EMPTY`, `ERR.VAL-DUP-EMAIL`, `ERR.AUTH-INVALID-AD-TOKEN`.

#### Refresh Token
*   **Purpose:** Renew access tokens.
*   **HTTP Method & URL:** `POST /api/v1/auth/refresh`
*   **Authentication Required:** No.
*   **Request Schema:** `refreshToken` (String, required).
*   **Response Schema:** `accessToken` (String), `expiresIn` (Integer).
*   **Possible Errors:** `ERR.AUTH-EXPIRED-REFRESH`.

#### Forgot Password
*   **Purpose:** Request a password reset link.
*   **HTTP Method & URL:** `POST /api/v1/auth/forgot-password`
*   **Authentication Required:** No.
*   **Request Schema:** `email` (String, required).
*   **Response Schema:** `message` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Reset Password
*   **Purpose:** Set new password.
*   **HTTP Method & URL:** `POST /api/v1/auth/reset-password`
*   **Authentication Required:** No.
*   **Request Schema:** `resetToken` (String, required), `newPassword` (String, required).
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.AUTH-INVALID-RESET-TOKEN`, `ERR.VAL-PASSWORD-WEAK`.

#### Verify Email
*   **Purpose:** Validate email verification code.
*   **HTTP Method & URL:** `POST /api/v1/auth/verify-email`
*   **Authentication Required:** No.
*   **Request Schema:** `email` (String, required), `verificationCode` (String, required).
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.AUTH-INVALID-CODE`.

#### Current User
*   **Purpose:** Retrieve active user metadata.
*   **HTTP Method & URL:** `GET /api/v1/auth/me`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `id` (String, UUID), `email` (String), `role` (String), `clearanceLevel` (String).
*   **Possible Errors:** `ERR.AUTH-EXPIRED-TOKEN`.

---

### 7.2 Users Group

#### Profile
*   **Purpose:** Retrieve profile parameters.
*   **HTTP Method & URL:** `GET /api/v1/users/profile`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `id` (String, UUID), `name` (String), `email` (String), `employeeId` (String), `created_at` (String).
*   **Possible Errors:** `ERR.AUTH-EXPIRED-TOKEN`.

#### Update Profile
*   **Purpose:** Update profile parameters.
*   **HTTP Method & URL:** `PATCH /api/v1/users/profile`
*   **Authentication Required:** Yes.
*   **Request Schema:** `name` (String, optional), `email` (String, optional).
*   **Response Schema:** `id` (String, UUID), `name` (String), `email` (String).
*   **Possible Errors:** `ERR.VAL-INVALID-FORMAT`.

#### Change Password
*   **Purpose:** Update user password.
*   **HTTP Method & URL:** `POST /api/v1/users/change-password`
*   **Authentication Required:** Yes.
*   **Request Schema:** `currentPassword` (String, required), `newPassword` (String, required).
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.AUTH-INVALID-CREDENTIALS`, `ERR.VAL-PASSWORD-WEAK`.

#### Preferences
*   **Purpose:** Get user interface settings.
*   **HTTP Method & URL:** `GET /api/v1/users/preferences`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `theme` (String), `enableAudioAlarms` (Boolean), `refreshIntervalMs` (Integer).
*   **Possible Errors:** `ERR.AUTH-EXPIRED-TOKEN`.

---

### 7.3 Dashboard Group

#### Dashboard Summary
*   **Purpose:** Retrieve system overview data.
*   **HTTP Method & URL:** `GET /api/v1/dashboard/summary`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `substationCount` (Integer), `activeAlarmsCount` (Integer), `policyComplianceStatus` (String).
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

#### KPIs
*   **Purpose:** Retrieve core telemetry metrics.
*   **HTTP Method & URL:** `GET /api/v1/dashboard/kpis`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `frequencyHz` (Float), `activeLoadMw` (Float), `voltageStabilityIndex` (Float).
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

#### Recent Activity
*   **Purpose:** Get recent system events.
*   **HTTP Method & URL:** `GET /api/v1/dashboard/activity`
*   **Authentication Required:** Yes.
*   **Request Schema:** `limit` (Integer, optional).
*   **Response Schema:** List of events containing `id`, `event_type`, `description`, `timestamp`.
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

---

### 7.4 Digital Twin Group

#### Create
*   **Purpose:** Create a new grid model.
*   **HTTP Method & URL:** `POST /api/v1/digital-twin`
*   **Authentication Required:** Yes (Engineer/Admin).
*   **Request Schema:** `modelName` (String, required), `topologySchema` (Object, required).
*   **Response Schema:** `modelId` (String, UUID), `modelName` (String).
*   **Possible Errors:** `ERR.VAL-EMPTY`, `ERR.VAL-INVALID-TOPOLOGY`.

#### Read
*   **Purpose:** Retrieve a grid model.
*   **HTTP Method & URL:** `GET /api/v1/digital-twin/{modelId}`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `modelId` (String, UUID), `modelName` (String), `topologySchema` (Object).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Update
*   **Purpose:** Update a grid model configuration.
*   **HTTP Method & URL:** `PUT /api/v1/digital-twin/{modelId}`
*   **Authentication Required:** Yes (Engineer/Admin).
*   **Request Schema:** `modelName` (String, optional), `topologySchema` (Object, optional).
*   **Response Schema:** `modelId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Delete
*   **Purpose:** Delete a grid model.
*   **HTTP Method & URL:** `DELETE /api/v1/digital-twin/{modelId}`
*   **Authentication Required:** Yes (Admin).
*   **Request Schema:** None.
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### List Assets
*   **Purpose:** Retrieve all assets linked to a digital twin.
*   **HTTP Method & URL:** `GET /api/v1/digital-twin/{modelId}/assets`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of assets containing `assetId`, `assetCode`, `assetType`.
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

---

### 7.5 Grid Assets Group

#### Nodes
*   **Purpose:** Retrieve grid node metrics.
*   **HTTP Method & URL:** `GET /api/v1/grid-assets/nodes`
*   **Authentication Required:** Yes.
*   **Request Schema:** `substationId` (String, optional).
*   **Response Schema:** List of nodes containing `nodeId`, `nodeCode`, `nominalVoltage`, `currentVoltage`, `currentFrequency`.
*   **Possible Errors:** `ERR.VAL-INVALID-FORMAT`.

#### Transmission Lines
*   **Purpose:** Retrieve transmission line statuses.
*   **HTTP Method & URL:** `GET /api/v1/grid-assets/lines`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of lines containing `lineId`, `lineCode`, `capacityLimitMw`, `currentFlowMw`, `status`.
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

#### Substations
*   **Purpose:** Retrieve substation metrics.
*   **HTTP Method & URL:** `GET /api/v1/grid-assets/substations`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of substations containing `substationId`, `substationCode`, `totalCapacityMw`, `activeLoadMw`, `status`.
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

---

### 7.6 Scenarios Group

#### Create
*   **Purpose:** Create a test scenario.
*   **HTTP Method & URL:** `POST /api/v1/scenarios`
*   **Authentication Required:** Yes (Engineer/Admin).
*   **Request Schema:** `scenarioName` (String, required), `digitalTwinId` (String, required), `faultNodeId` (String, required), `durationSeconds` (Integer, required).
*   **Response Schema:** `scenarioId` (String, UUID), `scenarioName` (String).
*   **Possible Errors:** `ERR.VAL-EMPTY`, `ERR.RES-NOT-FOUND`.

#### Execute
*   **Purpose:** Trigger a simulation run.
*   **HTTP Method & URL:** `POST /api/v1/scenarios/{scenarioId}/execute`
*   **Authentication Required:** Yes (Operator/Engineer).
*   **Request Schema:** None.
*   **Response Schema:** `simRunId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`, `ERR.SIM-INITIALIZATION-FAILED`.

#### Duplicate
*   **Purpose:** Clone an existing scenario.
*   **HTTP Method & URL:** `POST /api/v1/scenarios/{scenarioId}/duplicate`
*   **Authentication Required:** Yes (Engineer).
*   **Request Schema:** `newScenarioName` (String, required).
*   **Response Schema:** `scenarioId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Archive
*   **Purpose:** Soft-delete a scenario.
*   **HTTP Method & URL:** `DELETE /api/v1/scenarios/{scenarioId}`
*   **Authentication Required:** Yes (Engineer/Admin).
*   **Request Schema:** None.
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### History
*   **Purpose:** Retrieve historical runs.
*   **HTTP Method & URL:** `GET /api/v1/scenarios/{scenarioId}/history`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of runs containing `simRunId`, `status`, `startedAt`, `completedAt`.
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

---

### 7.7 Simulation Group

#### Start Simulation
*   **Purpose:** Start a simulation run.
*   **HTTP Method & URL:** `POST /api/v1/simulations/start`
*   **Authentication Required:** Yes (Engineer).
*   **Request Schema:** `scenarioId` (String, required).
*   **Response Schema:** `simRunId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Stop Simulation
*   **Purpose:** Cancel a simulation run.
*   **HTTP Method & URL:** `POST /api/v1/simulations/{simRunId}/stop`
*   **Authentication Required:** Yes (Engineer).
*   **Request Schema:** None.
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Status
*   **Purpose:** Monitor simulation progress.
*   **HTTP Method & URL:** `GET /api/v1/simulations/{simRunId}/status`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `simRunId` (String, UUID), `status` (String), `progressPercent` (Float).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Results
*   **Purpose:** Retrieve timeseries metrics from a simulation run.
*   **HTTP Method & URL:** `GET /api/v1/simulations/{simRunId}/results`
*   **Authentication Required:** Yes.
*   **Request Schema:** `nodeId` (String, optional).
*   **Response Schema:** List of offsets containing `timestampOffsetMs`, `nodeId`, `voltage`, `frequency`.
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Export Results
*   **Purpose:** Generate an export file.
*   **HTTP Method & URL:** `POST /api/v1/simulations/{simRunId}/export`
*   **Authentication Required:** Yes.
*   **Request Schema:** `format` (String, CSV/PDF).
*   **Response Schema:** `fileUrl` (String), `checksum` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`, `ERR.EXPORT-GENERATION-FAILED`.

---

### 7.8 Policies Group

#### Create
*   **Purpose:** Create a new policy file.
*   **HTTP Method & URL:** `POST /api/v1/policies`
*   **Authentication Required:** Yes (Compliance Officer).
*   **Request Schema:** `fileName` (String, required), `rawRulesText` (String, required).
*   **Response Schema:** `policyId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.VAL-EMPTY`, `ERR.POL-COMPILE-FAIL`.

#### Update
*   **Purpose:** Modify an existing policy ruleset.
*   **HTTP Method & URL:** `PUT /api/v1/policies/{policyId}`
*   **Authentication Required:** Yes (Compliance Officer).
*   **Request Schema:** `rawRulesText` (String, required).
*   **Response Schema:** `policyId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`, `ERR.POL-COMPILE-FAIL`.

#### Delete
*   **Purpose:** Soft-delete a policy.
*   **HTTP Method & URL:** `DELETE /api/v1/policies/{policyId}`
*   **Authentication Required:** Yes (Admin).
*   **Request Schema:** None.
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Evaluate
*   **Purpose:** Dry-run evaluate an action against active policies.
*   **HTTP Method & URL:** `POST /api/v1/policies/evaluate`
*   **Authentication Required:** Yes (Operator/Engineer).
*   **Request Schema:** `targetNodeId` (String, required), `proposedAction` (String, required).
*   **Response Schema:** `isCompliant` (Boolean), `violationRuleCode` (String, optional), `message` (String).
*   **Possible Errors:** `ERR.VAL-EMPTY`.

#### Validation
*   **Purpose:** Validate compiler grammar of raw policy text.
*   **HTTP Method & URL:** `POST /api/v1/policies/validate`
*   **Authentication Required:** Yes (Compliance/Engineer).
*   **Request Schema:** `rawRulesText` (String, required).
*   **Response Schema:** `isValid` (Boolean), `compilerLogs` (String).
*   **Possible Errors:** `ERR.VAL-EMPTY`.

---

### 7.9 AI Group

#### Agent List
*   **Purpose:** Retrieve all active agents.
*   **HTTP Method & URL:** `GET /api/v1/agents`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of agents containing `agentId`, `agentCode`, `gridNodeId`, `status`.
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

#### Agent Status
*   **Purpose:** Retrieve agent status parameters.
*   **HTTP Method & URL:** `GET /api/v1/agents/{agentId}/status`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `agentId` (String, UUID), `status` (String), `lastHeartbeat` (String), `currentLoadMw` (Float).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Recommendations
*   **Purpose:** Retrieve AI-generated mitigation recommendations.
*   **HTTP Method & URL:** `GET /api/v1/agents/recommendations`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of proposals containing `id`, `proposedAction`, `supportingRuleCode`, `justification`.
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

#### Decision Support
*   **Purpose:** Log user decision on AI recommendation.
*   **HTTP Method & URL:** `POST /api/v1/agents/recommendations/{recommendationId}/decide`
*   **Authentication Required:** Yes (Operator).
*   **Request Schema:** `approve` (Boolean, required), `remarks` (String, optional).
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Explainability
*   **Purpose:** Retrieve logic logs for an agent decision.
*   **HTTP Method & URL:** `GET /api/v1/agents/decisions/{decisionId}/explanation`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `decisionId` (String, UUID), `decisionTree` (Object), `compliantRules` (Array), `violatedRules` (Array).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Conversation History
*   **Purpose:** Get negotiation history between agents during a run.
*   **HTTP Method & URL:** `GET /api/v1/agents/negotiations/{runId}`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of dialogues containing `timestamp`, `sourceAgentCode`, `targetAgentCode`, `messageContent`, `consensusPercent`.
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

---

### 7.10 Analytics Group

#### Reports
*   **Purpose:** Generate a new report.
*   **HTTP Method & URL:** `POST /api/v1/analytics/reports`
*   **Authentication Required:** Yes (Analyst/Compliance).
*   **Request Schema:** `templateId` (String, required), `startDate` (String, required), `endDate` (String, required).
*   **Response Schema:** `reportId` (String, UUID), `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Metrics
*   **Purpose:** Retrieve historical aggregate metrics.
*   **HTTP Method & URL:** `GET /api/v1/analytics/metrics`
*   **Authentication Required:** Yes.
*   **Request Schema:** `metricName` (String, required), `duration` (String, required).
*   **Response Schema:** List of points containing `timestamp`, `value`.
*   **Possible Errors:** `ERR.VAL-EMPTY`.

#### Dashboards
*   **Purpose:** Get configured analytics widgets.
*   **HTTP Method & URL:** `GET /api/v1/analytics/dashboards`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** List of widget configurations.
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

#### Trends
*   **Purpose:** Retrieve trend forecast models.
*   **HTTP Method & URL:** `GET /api/v1/analytics/trends`
*   **Authentication Required:** Yes.
*   **Request Schema:** `targetAssetId` (String, required).
*   **Response Schema:** `forecastDataPoints` (Array).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

---

### 7.11 Notifications Group

#### List
*   **Purpose:** Retrieve all system notifications.
*   **HTTP Method & URL:** `GET /api/v1/notifications`
*   **Authentication Required:** Yes.
*   **Request Schema:** `isDismissed` (Boolean, optional).
*   **Response Schema:** List of alarms containing `id`, `severity`, `title`, `message`, `isDismissed`, `timestamp`.
*   **Possible Errors:** `ERR.SYS-DATABASE-DOWN`.

#### Read
*   **Purpose:** Dismiss an active notification.
*   **HTTP Method & URL:** `PATCH /api/v1/notifications/{notificationId}/read`
*   **Authentication Required:** Yes.
*   **Request Schema:** None.
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Delete
*   **Purpose:** Delete a notification.
*   **HTTP Method & URL:** `DELETE /api/v1/notifications/{notificationId}`
*   **Authentication Required:** Yes (Admin).
*   **Request Schema:** None.
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

---

### 7.12 Audit Logs Group

#### List
*   **Purpose:** Retrieve system audit logs.
*   **HTTP Method & URL:** `GET /api/v1/audit-logs`
*   **Authentication Required:** Yes (Compliance/Admin).
*   **Request Schema:** None.
*   **Response Schema:** List of entries containing `id`, `userEmail`, `action`, `subsystem`, `timestamp`.
*   **Possible Errors:** `ERR.AUTHZ-PERM`.

#### Search
*   **Purpose:** Filter audit logs.
*   **HTTP Method & URL:** `GET /api/v1/audit-logs/search`
*   **Authentication Required:** Yes (Compliance/Admin).
*   **Request Schema:** `query` (String, required).
*   **Response Schema:** List of matching entries.
*   **Possible Errors:** `ERR.VAL-EMPTY`.

#### Export
*   **Purpose:** Generate an export file of the audit logs.
*   **HTTP Method & URL:** `POST /api/v1/audit-logs/export`
*   **Authentication Required:** Yes (Compliance/Admin).
*   **Request Schema:** `format` (String, CSV/PDF).
*   **Response Schema:** `exportUrl` (String), `checksum` (String).
*   **Possible Errors:** `ERR.EXPORT-GENERATION-FAILED`.

---

### 7.13 Administration Group

#### Users
*   **Purpose:** Modify user details.
*   **HTTP Method & URL:** `PATCH /api/v1/admin/users/{userId}`
*   **Authentication Required:** Yes (Admin).
*   **Request Schema:** `roleId` (String, optional), `isActive` (Boolean, optional).
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### Roles
*   **Purpose:** List security roles.
*   **HTTP Method & URL:** `GET /api/v1/admin/roles`
*   **Authentication Required:** Yes (Admin).
*   **Request Schema:** None.
*   **Response Schema:** List of roles containing `roleId`, `roleName`, `description`.
*   **Possible Errors:** `ERR.AUTHZ-PERM`.

#### Permissions
*   **Purpose:** Modify permissions mapped to a role.
*   **HTTP Method & URL:** `PUT /api/v1/admin/roles/{roleId}/permissions`
*   **Authentication Required:** Yes (Admin).
*   **Request Schema:** `permissionIds` (Array, required).
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.RES-NOT-FOUND`.

#### System Settings
*   **Purpose:** Save system-wide configurations.
*   **HTTP Method & URL:** `POST /api/v1/admin/settings`
*   **Authentication Required:** Yes (Admin).
*   **Request Schema:** `settingsMap` (Object, required).
*   **Response Schema:** `status` (String).
*   **Possible Errors:** `ERR.VAL-INVALID-FORMAT`.

---

### 7.14 Health Group

#### Health Check
*   **Purpose:** Retrieve database and microservice statuses.
*   **HTTP Method & URL:** `GET /api/v1/health`
*   **Authentication Required:** No.
*   **Request Schema:** None.
*   **Response Schema:** `status` (String, e.g. "healthy"), `databases` (Object), `broker` (Object).
*   **Possible Errors:** None.

#### System Status
*   **Purpose:** View system load.
*   **HTTP Method & URL:** `GET /api/v1/health/system`
*   **Authentication Required:** No.
*   **Request Schema:** None.
*   **Response Schema:** `cpuLoad` (Float), `memoryUsage` (Float), `diskUsage` (Float).
*   **Possible Errors:** None.

#### Version
*   **Purpose:** Get active service version code.
*   **HTTP Method & URL:** `GET /api/v1/health/version`
*   **Authentication Required:** No.
*   **Request Schema:** None.
*   **Response Schema:** `version` (String), `environment` (String).
*   **Possible Errors:** None.

---

## 8. External Integrations

*   **AI Providers (Model Hosting):**
    *   *Protocol:* HTTPS / REST with API Key authorization.
    *   *Request:* Mapped system instructions, validation guidelines, and telemetry logs.
    *   *Response:* JSON decision logs and explainability trees.
*   **Simulation Engine (Julia Server):**
    *   *Protocol:* gRPC / Protocol Buffers.
    *   *Request:* Scenario limits, line loads, source/target nodes.
    *   *Response:* Binary timeseries outputs showing voltage and frequency steps.
*   **Email Services (MTA Gateway):**
    *   *Protocol:* REST API via secure keys.
    *   *Request:* Target operator address, reset token codes, or alarm descriptions.
    *   *Response:* Delivery status logs.
*   **Object Storage (S3 API):**
    *   *Protocol:* AWS SDK with signed URL parameters.
    *   *Request:* Upload payload stream containing reports or CAD diagrams.
    *   *Response:* Permanent, encrypted object URL with validation hash.
*   **Authentication Providers (AD / OIDC Host):**
    *   *Protocol:* OAuth2 OIDC redirects.
    *   *Request:* User login claims, security tokens.
    *   *Response:* Signed OIDC ID tokens.

---

## 9. Security Standards

*   **Input Validation:** Payloads are validated against strict JSON schemas at the API gateway boundary. Malformed parameters are rejected with `400 Bad Request` before reaching backend services.
*   **Rate Limiting:** IP-based sliding window rate limiter enforced by the API Gateway:
    *   *Standard REST APIs:* Max 100 requests per minute per IP.
    *   *Authentication (`/auth/login`):* Max 5 requests per minute per IP.
*   **API Key Handling:** External integrations authenticate using signed API keys loaded in headers (`X-API-Key`). Keys are stored encrypted in the database.
*   **CORS Policies:** Configured to whitelist only the specific corporate intranet domains and utility control room IP ranges. All other origins are rejected.
*   **CSRF Protection:** Secure cookies and double-submit cookie patterns are applied to all authenticated sessions.
*   **Sensitive Data Handling:** Personal fields (email, names) are encrypted at rest using AES-256. Passwords use bcrypt hashing.
*   **Audit Logging:** Every mutating request (POST, PUT, PATCH, DELETE) is logged to the database with a SHA-256 checksum computed from the previous audit record.

---

## 10. API Best Practices

*   **Idempotency:** Mutating requests support the `Idempotency-Key` header. Identical calls returned within 5 minutes bypass execution and return cached responses, preventing duplicate grid overrides.
*   **Pagination Standards:** Collections return standard page metadata (`page`, `limit`, `totalCount`, `totalPages`). Links to first/last pages are included in headers.
*   **Filtering & Sorting:** Implement consistent query parameter patterns across all tables (e.g., `/api/v1/audit-logs?sort_by=timestamp&order=desc`).
*   **Caching Strategy:** Static config data (policies, system settings) are cached in Redis. Responses return standard `Cache-Control` headers.
*   **Consistent Naming:** Unified PascalCase for component exports, snake_case/kebab-case for URL endpoints, and camelCase for JSON properties.
*   **Backward Compatibility:** Prior version paths (e.g., `/api/v1`) remain active and functional during incremental minor updates.

---

## 11. Related Documents
*   [Technical Architecture Specification](ARCHITECTURE.md)
*   [Database & Schema Design](DATABASE_DESIGN.md)
*   [Screen Inventory & Flow Catalog](SCREEN_CATALOG.md)
*   [Development & Git Standards](CONTRIBUTING.md)

---

## 12. Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| v1.0.0 | July 22, 2026 | Initial Release for Phase 0 | Principal API Architect |
