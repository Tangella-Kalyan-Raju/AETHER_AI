# Grid Policy Orchestrator (GPO)
## Backend Architecture Documentation

*   **Version:** v1.1.0
*   **Status:** Approved
*   **Phase:** Pre-Phase 3 (Engineering Foundation)
*   **Last Updated:** July 24, 2026

---

## 1. Overview

The GPO backend is a Python FastAPI application following a layered enterprise architecture pattern. It provides RESTful API endpoints for authentication, RBAC authorization, grid asset management, policy compilation, incident tracking, notifications, reports, audit logging, and system configuration.

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────┐
│            API Router Layer                  │
│  (routers/auth.py, routers/users.py, etc.)  │
├─────────────────────────────────────────────┤
│          Schema Validation Layer             │
│  (schemas/auth_schemas.py, etc.)             │
├─────────────────────────────────────────────┤
│          Repository Layer                    │
│  (repositories/base_repository.py, etc.)     │
├─────────────────────────────────────────────┤
│          ORM Model Layer                     │
│  (models/auth_models.py, etc.)               │
├─────────────────────────────────────────────┤
│          Database Connection Layer           │
│  (database/connection.py, database/init_db.py│
├─────────────────────────────────────────────┤
│          Core Infrastructure                 │
│  (core/security.py, core/logging.py, etc.)   │
├─────────────────────────────────────────────┤
│          Configuration Management            │
│  (config/settings.py, config/db_config.py)   │
└─────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
src-backend/
├── main.py                    # Entry point (delegates to app.main)
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── alembic.ini                # Migration configuration
├── migrations/                # Alembic migration scripts
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── logs/                      # Auto-generated log files
│   ├── app.log
│   ├── api.log
│   ├── db.log
│   ├── error.log
│   └── performance.log
└── app/
    ├── __init__.py
    ├── main.py                # FastAPI application factory
    ├── config/
    │   ├── settings.py        # Centralized configuration
    │   └── db_config.py       # Database URL resolution
    ├── core/
    │   ├── exceptions.py      # Custom exception hierarchy
    │   ├── logging.py         # Structured logging setup
    │   ├── response.py        # Standard response envelopes
    │   └── security.py        # JWT, bcrypt, auth guards
    ├── database/
    │   ├── connection.py      # Engine, session, health check
    │   └── init_db.py         # Schema creation & seeding
    ├── models/
    │   ├── base.py            # Base model with soft delete
    │   ├── auth_models.py     # User, Role, Permission, Org
    │   ├── grid_models.py     # GridAsset, Policy, Incident
    │   └── system_models.py   # Notification, Report, AuditLog
    ├── repositories/
    │   ├── base_repository.py # Generic CRUD with pagination
    │   ├── user_repository.py
    │   ├── grid_repository.py
    │   └── system_repository.py
    ├── schemas/
    │   ├── auth_schemas.py    # Pydantic request/response models
    │   ├── grid_schemas.py
    │   └── system_schemas.py
    └── routers/
        ├── auth.py            # /api/v1/auth/*
        ├── users.py           # /api/v1/users/*
        ├── grid_assets.py     # /api/v1/grid-assets/*
        ├── policies.py        # /api/v1/policies/*
        ├── incidents.py       # /api/v1/incidents/*
        ├── notifications.py   # /api/v1/notifications/*
        ├── reports.py         # /api/v1/reports/*
        ├── audit_logs.py      # /api/v1/audit-logs/*
        ├── system_settings.py # /api/v1/settings/*
        └── health.py          # /api/v1/health
```

---

## 4. Key Design Patterns

### 4.1 Generic Repository Pattern
`BaseRepository[T]` provides CRUD, pagination, filtering, sorting, search, and soft-delete support for any SQLAlchemy model. Domain-specific repositories extend this base.

### 4.2 Dependency Injection
FastAPI `Depends()` injects database sessions (`get_db`), authenticated users (`get_current_user`), and permission guards (`PermissionGuard("permission_name")`).

### 4.3 Centralized Exception Handling
Global exception handlers in `app/main.py` catch `HTTPException`, `RequestValidationError`, and custom `GPOException` subclasses, returning structured JSON error envelopes.

### 4.4 Structured Logging
Five dedicated log streams (app, api, db, error, performance) write to both stdout and rotating file handlers under the `logs/` directory.

### 4.5 Lifespan Events
Database tables are created and seeded with default data (roles, permissions, admin user) during application startup. Connection pools are disposed during shutdown.

---

## 5. Authentication & Authorization

- **JWT Tokens**: Generated using PyJWT with HS256 algorithm and configurable expiration.
- **Password Hashing**: bcrypt with auto-generated salts.
- **RBAC**: 5 built-in roles with 12 granular permissions. Permission checks are enforced via `PermissionGuard` dependency.
- **Session Restoration**: `/api/auth/me` endpoint validates tokens and returns the current user profile.

### Default Roles & Permissions

| Role | Permissions |
|:---|:---|
| Super Admin | All (`*`) |
| Grid Administrator | dashboard:view, grid:view, grid:control, assets:view, assets:manage, policies:view, policies:compile, settings:view |
| Operations Engineer | dashboard:view, grid:view, grid:control, assets:view, policies:view, settings:view |
| Policy Analyst | dashboard:view, grid:view, policies:view, policies:compile, policies:deploy, reports:view, reports:create |
| Viewer | dashboard:view, reports:view |

---

## 6. API Versioning

All endpoints are mounted under `/api/v1/`. Legacy endpoints (`/api/auth/*`, `/api/health`) are maintained for backward compatibility with the existing frontend.

---

## 7. Database

- **Primary**: MySQL (production) with connection pooling.
- **Fallback**: SQLite (development) with automatic failover.
- **ORM**: SQLAlchemy 2.0 with declarative models.
- **Migrations**: Alembic configured and ready.
- **Soft Delete**: `BaseModelMixin` provides `is_deleted` flag and `soft_delete()` method.
- **Audit Fields**: `created_at`, `updated_at` on all models.
