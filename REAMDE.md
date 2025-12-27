# Multi-Tenant SaaS Project Management Platform

A production-ready **Multi-Tenant SaaS Project & Task Management platform** designed for organizations to manage users, projects, and tasks with strict tenant-level data isolation.  
The system supports **multiple tenants**, role-based access, and scalable architecture using Docker.

**Target Audience:**  
SaaS startups, enterprises, and developers building multi-tenant applications with secure tenant isolation.

---

## 🚀 Features

- Multi-tenant architecture with strict tenant data isolation
- Tenant registration with subdomain-based login
- Role-based access control (super_admin, tenant_admin, user)
- JWT-based authentication & authorization
- Project creation, update, and deletion with ownership rules
- Task management with assignment, priority, and status tracking
- Dashboard with real-time statistics
- User management (add/edit/delete users per tenant)
- Subscription plan limits (projects/users)
- Audit logging for critical actions
- Fully Dockerized (frontend, backend, database)
- Health check endpoint for production readiness

---

## 🧱 Technology Stack

### Frontend
- React 18
- Vite
- Axios
- React Router DOM

### Backend
- Node.js 18
- Express.js
- PostgreSQL (pg)
- JWT (jsonwebtoken)
- bcrypt

### Database
- PostgreSQL 15

### DevOps & Containerization
- Docker
- Docker Compose

---

## 🏗 Architecture Overview

The system follows a **service-based multi-tenant architecture**:

- Single backend API serving multiple tenants
- Tenant ID embedded in JWT tokens
- Every request is filtered by tenant_id
- Database-level isolation using tenant_id foreign keys

### Architecture Diagram

![Architecture Diagram](docs/architecture.png)

---

## ⚙ Installation & Setup

### Prerequisites
- Docker
- Docker Compose
- Node.js (for local dev, optional)

---

### 1️⃣ Clone Repository
```bash
git clone <your-repo-url>
cd multi-tenant-saas


Create environment file:

cp backend/.env.example backend/.env

Start Application (Docker)

docker-compose up -d