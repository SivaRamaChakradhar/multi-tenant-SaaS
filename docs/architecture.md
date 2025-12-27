# System Architecture

## High-Level Architecture

The system follows a client-server architecture with containerized services.

### Components
- Browser (Client)
- Frontend (React)
- Backend API (Node.js + Express)
- PostgreSQL Database

### Authentication Flow
1. User logs in
2. Backend validates credentials
3. JWT issued with tenant_id and role
4. Frontend attaches JWT to requests

![System Architecture](images/system-architecture.png)

---

## Database Schema Design

- tenants
- users
- projects
- tasks
- audit_logs

Each table includes `tenant_id` for isolation.

![Database ERD](images/database-erd.png)

---

## API Architecture

| Module | Endpoint | Method | Auth | Role |
|-----|--------|------|------|-----|
Auth | /auth/login | POST | ❌ | - |
Auth | /auth/me | GET | ✅ | Any |
Tenant | /tenants/:id/users | GET | ✅ | tenant_admin |
Projects | /projects | POST | ✅ | Any |
Projects | /projects/:id | DELETE | ✅ | tenant_admin |
Tasks | /projects/:id/tasks | POST | ✅ | Any |
Health | /health | GET | ❌ | - |
