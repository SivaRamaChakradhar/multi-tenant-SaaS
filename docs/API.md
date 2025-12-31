# API Documentation

Complete reference for all 19+ REST API endpoints of the Multi-Tenant SaaS Platform.

**Base URL:** `http://localhost:5000/api`

---

## Table of Contents

1. [Authentication (4 endpoints)](#authentication)
2. [Tenants (3 endpoints)](#tenants)
3. [Users (4 endpoints)](#users)
4. [Projects (5 endpoints)](#projects)
5. [Tasks (4 endpoints)](#tasks)
6. [Health Check (1 endpoint)](#health-check)

---

## Authentication

### 1. Register Tenant

Create a new tenant with an admin user.

**Request:**
```http
POST /auth/register-tenant
Content-Type: application/json

{
  "tenantName": "Acme Corporation",
  "subdomain": "acme",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePass123!",
  "adminFullName": "John Admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "Acme Corporation",
      "subdomain": "acme",
      "status": "active"
    },
    "admin": {
      "id": "uuid",
      "email": "admin@acme.com",
      "fullName": "John Admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Status Codes:**
- `201` - Tenant and admin created successfully
- `400` - Validation failed
- `409` - Subdomain already exists

---

### 2. Login

Authenticate user and receive JWT token.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "fullName": "John Admin",
      "role": "tenant_admin",
      "tenant": {
        "id": "uuid",
        "name": "Acme Corporation"
      }
    }
  }
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials
- `404` - User not found

---

### 3. Get Current User

Retrieve authenticated user details.

**Request:**
```http
GET /auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@acme.com",
    "fullName": "John Admin",
    "role": "tenant_admin",
    "isActive": true,
    "tenant": {
      "id": "uuid",
      "name": "Acme Corporation"
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (missing or invalid token)

---

### 4. Logout

Invalidate user session.

**Request:**
```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200` - Logout successful
- `401` - Unauthorized

---

## Tenants

### 5. Get Tenant Details

Retrieve information about a specific tenant.

**Request:**
```http
GET /tenants/{tenantId}
Authorization: Bearer {token}
```

**Parameters:**
- `tenantId` (path, required) - Tenant UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Corporation",
    "subdomain": "acme",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 50,
    "maxProjects": 30,
    "userCount": 5,
    "projectCount": 3,
    "createdAt": "2025-12-31T10:30:00Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not tenant member)
- `404` - Tenant not found

**Authorization:**
- Requires: tenant_admin or user role for own tenant, or super_admin

---

### 6. Update Tenant

Update tenant information.

**Request:**
```http
PUT /tenants/{tenantId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Acme Corporation Updated",
  "subscriptionPlan": "enterprise",
  "maxUsers": 100,
  "maxProjects": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Corporation Updated",
    "subscriptionPlan": "enterprise",
    "maxUsers": 100,
    "maxProjects": 50
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `401` - Unauthorized
- `403` - Forbidden (requires tenant_admin)
- `404` - Tenant not found

**Authorization:**
- Requires: tenant_admin for own tenant, or super_admin

---

### 7. List All Tenants

Retrieve list of all tenants (super_admin only).

**Request:**
```http
GET /tenants
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional, default: 20) - Results per page
- `offset` (optional, default: 0) - Pagination offset
- `status` (optional) - Filter by status (active, suspended, inactive)

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "uuid",
        "name": "Acme Corporation",
        "subdomain": "acme",
        "status": "active",
        "subscriptionPlan": "pro",
        "userCount": 5,
        "projectCount": 3
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (requires super_admin)

**Authorization:**
- Requires: super_admin only

---

## Users

### 8. Add User to Tenant

Create new user in tenant.

**Request:**
```http
POST /tenants/{tenantId}/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@acme.com",
  "password": "SecurePass123!",
  "fullName": "Jane Doe",
  "role": "user"
}
```

**Parameters:**
- `tenantId` (path, required) - Tenant UUID

**Request Body:**
- `email` (required) - User email (must be unique within tenant)
- `password` (required) - Password (min 8 characters)
- `fullName` (required) - User full name
- `role` (required) - user or tenant_admin

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@acme.com",
    "fullName": "Jane Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-12-31T11:00:00Z"
  }
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (requires tenant_admin)
- `409` - Email already exists in tenant

**Authorization:**
- Requires: tenant_admin for own tenant, or super_admin

---

### 9. List Tenant Users

Retrieve all users in a tenant.

**Request:**
```http
GET /tenants/{tenantId}/users
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)
- `role` (optional) - Filter by role
- `isActive` (optional) - Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "admin@acme.com",
        "fullName": "John Admin",
        "role": "tenant_admin",
        "isActive": true
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not tenant member)
- `404` - Tenant not found

**Authorization:**
- Requires: Authenticated user from same tenant, or super_admin

---

### 10. Update User

Update user information.

**Request:**
```http
PUT /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "Jane Doe Updated",
  "role": "tenant_admin",
  "isActive": true
}
```

**Parameters:**
- `userId` (path, required) - User UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@acme.com",
    "fullName": "Jane Doe Updated",
    "role": "tenant_admin",
    "isActive": true
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (requires tenant_admin)
- `404` - User not found

**Authorization:**
- Requires: tenant_admin for same tenant, or super_admin

---

### 11. Delete User

Remove user from tenant.

**Request:**
```http
DELETE /users/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Status Codes:**
- `200` - Deleted successfully
- `401` - Unauthorized
- `403` - Forbidden (requires tenant_admin)
- `404` - User not found

**Authorization:**
- Requires: tenant_admin for same tenant, or super_admin

---

## Projects

### 12. Create Project

Create new project in tenant.

**Request:**
```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Redesign company website",
  "status": "active"
}
```

**Request Body:**
- `name` (required) - Project name
- `description` (optional) - Project description
- `status` (optional, default: active) - active, completed, archived

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Website Redesign",
    "description": "Redesign company website",
    "status": "active",
    "taskCount": 0,
    "createdAt": "2025-12-31T12:00:00Z"
  }
}
```

**Status Codes:**
- `201` - Project created successfully
- `400` - Validation failed (likely exceeded max projects limit)
- `401` - Unauthorized
- `403` - Forbidden (requires authenticated user in tenant)

**Authorization:**
- Requires: Authenticated user in tenant (not super_admin)

---

### 13. List Projects

Retrieve all projects in user's tenant.

**Request:**
```http
GET /projects
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)
- `status` (optional) - Filter by status
- `search` (optional) - Search by name

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "description": "Redesign company website",
        "status": "active",
        "taskCount": 3,
        "createdBy": "admin@acme.com",
        "createdAt": "2025-12-31T12:00:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### 14. Get Project Details

Retrieve specific project with tasks.

**Request:**
```http
GET /projects/{projectId}
Authorization: Bearer {token}
```

**Parameters:**
- `projectId` (path, required) - Project UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Website Redesign",
    "description": "Redesign company website",
    "status": "active",
    "tasks": [
      {
        "id": "uuid",
        "title": "Design mockups",
        "priority": "high",
        "status": "pending",
        "assignedTo": "jane@acme.com"
      }
    ],
    "taskCount": 1,
    "createdAt": "2025-12-31T12:00:00Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not in same tenant)
- `404` - Project not found

---

### 15. Update Project

Update project information.

**Request:**
```http
PUT /projects/{projectId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Website Redesign v2",
  "description": "Updated description",
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Website Redesign v2",
    "description": "Updated description",
    "status": "completed"
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (requires project ownership)
- `404` - Project not found

---

### 16. Delete Project

Remove project (cascades to delete tasks).

**Request:**
```http
DELETE /projects/{projectId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Status Codes:**
- `200` - Deleted successfully
- `401` - Unauthorized
- `403` - Forbidden (requires project ownership)
- `404` - Project not found

---

## Tasks

### 17. Create Task

Create new task in project.

**Request:**
```http
POST /projects/{projectId}/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Design mockups",
  "description": "Create UI mockups for homepage",
  "priority": "high",
  "assignedTo": "jane@acme.com"
}
```

**Parameters:**
- `projectId` (path, required) - Project UUID

**Request Body:**
- `title` (required) - Task title
- `description` (optional) - Task description
- `priority` (optional, default: medium) - low, medium, high, critical
- `assignedTo` (optional) - User email or UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Design mockups",
    "priority": "high",
    "status": "pending",
    "assignedTo": "jane@acme.com",
    "projectId": "uuid",
    "createdAt": "2025-12-31T13:00:00Z"
  }
}
```

**Status Codes:**
- `201` - Task created successfully
- `400` - Validation failed (exceeded project limit)
- `401` - Unauthorized
- `404` - Project not found

---

### 18. List Tasks

Retrieve all tasks in project.

**Request:**
```http
GET /projects/{projectId}/tasks
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional) - Filter by status
- `priority` (optional) - Filter by priority
- `assignedTo` (optional) - Filter by assigned user

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Design mockups",
        "priority": "high",
        "status": "pending",
        "assignedTo": "jane@acme.com",
        "createdAt": "2025-12-31T13:00:00Z"
      }
    ],
    "total": 1
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not in same tenant)
- `404` - Project not found

---

### 19. Update Task Status

Update task status (quick update).

**Request:**
```http
PATCH /tasks/{taskId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress"
}
```

**Parameters:**
- `taskId` (path, required) - Task UUID

**Request Body:**
- `status` (required) - pending, in_progress, completed, blocked

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "in_progress",
    "updatedAt": "2025-12-31T13:30:00Z"
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Invalid status
- `401` - Unauthorized
- `404` - Task not found

---

### 20. Update Task

Full task update.

**Request:**
```http
PUT /tasks/{taskId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Design mockups v2",
  "priority": "critical",
  "status": "in_progress",
  "assignedTo": "john@acme.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Design mockups v2",
    "priority": "critical",
    "status": "in_progress",
    "assignedTo": "john@acme.com"
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation failed
- `401` - Unauthorized
- `404` - Task not found

---

## Health Check

### 21. Service Health Status

Check if API is running and database is connected.

**Request:**
```http
GET /health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-31T14:00:00Z",
  "uptime": 3600
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Database connection failed",
  "timestamp": "2025-12-31T14:00:00Z"
}
```

**Status Codes:**
- `200` - Service healthy
- `503` - Service unhealthy (database disconnected)

---

## Authentication

All endpoints except `/auth/login`, `/auth/register-tenant`, and `/health` require a valid JWT token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes:
- `VALIDATION_ERROR` - Invalid request data
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Authenticated but insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

To prevent abuse, endpoints are rate-limited:
- **Authentication endpoints:** 5 requests per minute per IP
- **Other endpoints:** 100 requests per minute per token
- **Health check:** Unlimited

---

## Versioning

This API is version 1.0. Future versions will be available at `/api/v2`, etc.

---

## Testing

Use the test credentials from `submission.json` to test the API:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123"}'

# Get current user
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {token}"
```

---

## Support

For issues or questions, refer to the README.md or contact the development team.