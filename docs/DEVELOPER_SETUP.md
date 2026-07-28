# Grid Policy Orchestrator (GPO)
## Developer Setup Guide

*   **Version:** v1.1.0
*   **Last Updated:** July 24, 2026

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|:---|:---|:---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build toolchain |
| npm | 9+ | Package management |
| Git | 2.30+ | Version control |

---

## 1. Clone Repository

```bash
git clone <repository-url>
cd aug1
```

---

## 2. Backend Setup

### 2.1 Install Dependencies

```bash
cd src-backend
pip install -r requirements.txt
```

### 2.2 Environment Configuration

Copy or verify the `.env` file in `src-backend/`:

```env
ENV=development
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=gpo_auth
JWT_SECRET=gpo-enterprise-jwt-decisions-secret-key-2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
LOG_LEVEL=INFO
```

> **Note:** If MySQL is not running, the application automatically falls back to a local SQLite database (`gpo_auth.db`).

### 2.3 Start the Backend

```bash
cd src-backend
python main.py
```

The server starts at `http://127.0.0.1:8000` with hot-reload enabled.

### 2.4 Auto-Initialization

On first startup the system automatically:
- Creates all database tables
- Seeds 12 default permissions
- Seeds 5 default roles (Super Admin, Grid Administrator, Operations Engineer, Policy Analyst, Viewer)
- Seeds a default organization ("GPO Corp")
- Creates a default Super Admin user

**Default Admin Credentials:**
- Email: `admin@gpo.gov`
- Password: `admin`

> **IMPORTANT:** Change the admin password before any production deployment.

### 2.5 API Documentation

Interactive API documentation is available in development mode:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 3. Frontend Setup

### 3.1 Install Dependencies

```bash
cd src-frontend
npm install
```

### 3.2 Environment Configuration

Verify the `.env` file in `src-frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

### 3.3 Start the Frontend

```bash
npm run dev
```

The frontend starts at `http://localhost:5173`.

---

## 4. Running Tests

```bash
# From the project root
python -m pytest tests/ -v
```

---

## 5. Project Structure

```
aug1/
├── src-backend/          # Python FastAPI backend
├── src-frontend/         # React TypeScript frontend
├── src-agents/           # AI agent modules (Phase 4+)
├── src-simulation/       # Simulation engine (Phase 4+)
├── database/             # SQL schema files
├── config/               # Shared configuration
├── docs/                 # Engineering documentation
├── tests/                # Automated tests
└── design-tokens.json    # Design system tokens
```

---

## 6. Log Files

Backend log files are auto-generated in `src-backend/logs/`:

| File | Contents |
|:---|:---|
| `app.log` | General application events |
| `api.log` | API request processing |
| `db.log` | Database operations and SQL queries |
| `error.log` | Error-level events only |
| `performance.log` | Request latency measurements |

---

## 7. API Endpoints Overview

| Group | Prefix | Description |
|:---|:---|:---|
| Auth | `/api/v1/auth` | Login, register, session, logout |
| Users | `/api/v1/users` | User management (admin only) |
| Grid Assets | `/api/v1/grid-assets` | Physical grid equipment |
| Policies | `/api/v1/policies` | Rules and compiler versions |
| Incidents | `/api/v1/incidents` | Operational incidents |
| Notifications | `/api/v1/notifications` | User alerts |
| Reports | `/api/v1/reports` | Compliance reports |
| Audit Logs | `/api/v1/audit-logs` | Security audit trail |
| Settings | `/api/v1/settings` | System configuration |
| Health | `/api/v1/health` | System health check |
