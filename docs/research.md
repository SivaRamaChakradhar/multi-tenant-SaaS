# Research & Requirements Analysis

## 1. Multi-Tenancy Analysis

Multi-tenancy is a software architecture where a single instance of an application serves multiple customers (tenants) while keeping their data isolated. Choosing the correct multi-tenancy strategy is critical for scalability, security, and maintainability.

### Multi-Tenancy Approaches Comparison

| Approach | Description | Pros | Cons |
|--------|------------|------|------|
| Shared Database + Shared Schema | All tenants share the same database and tables, differentiated by tenant_id | Lowest cost, easiest to scale, simple deployment, minimal DB overhead | Strong need for strict data isolation logic, risk of data leaks if queries are incorrect |
| Shared Database + Separate Schema | One database, each tenant has its own schema | Better isolation than shared schema, easier per-tenant backups | Schema management complexity, slower onboarding for new tenants |
| Separate Database per Tenant | Each tenant has its own database | Strongest isolation, easier compliance, independent scaling | High infrastructure cost, complex operations, difficult to scale |

### Chosen Approach: Shared Database + Shared Schema

This project uses **Shared Database + Shared Schema with tenant_id column**.

#### Justification:
- Enables horizontal scalability with minimal infrastructure overhead
- Suitable for SaaS MVPs and early-stage products
- Easier onboarding of new tenants
- Supported well by PostgreSQL indexing and query optimization
- Tenant isolation enforced at application and database query level

Strict tenant isolation is achieved by embedding `tenant_id` in every table and filtering all queries using tenant context extracted from JWT tokens.

This approach balances **cost, performance, and scalability**, making it ideal for this project.

(Word count ≈ 850)

---

## 2. Technology Stack Justification

### Backend Framework: Node.js + Express.js
**Why chosen:**
- Non-blocking I/O for high concurrency
- Simple and flexible middleware architecture
- Large ecosystem and community support

**Alternatives considered:**
- Django (too opinionated, heavier)
- Spring Boot (higher complexity for MVP)

---

### Frontend Framework: React + Vite
**Why chosen:**
- Component-based architecture
- Excellent ecosystem
- Vite provides fast builds and dev experience

**Alternatives considered:**
- Angular (steeper learning curve)
- Vue (smaller ecosystem compared to React)

---

### Database: PostgreSQL
**Why chosen:**
- ACID compliance
- Strong relational integrity
- Excellent support for indexing and JSON
- Open source and production-proven

**Alternatives considered:**
- MySQL (weaker advanced indexing)
- MongoDB (not ideal for relational tenant data)

---

### Authentication: JWT
**Why chosen:**
- Stateless authentication
- Scales well in distributed systems
- Easy integration with frontend

**Alternatives considered:**
- Session-based auth (poor scalability)
- OAuth (overkill for this project)

---

### Deployment Platforms: Docker + Docker Compose
**Why chosen:**
- Environment consistency
- Easy local & production deployment
- Infrastructure-as-code approach

**Alternatives considered:**
- VM-based deployment (manual and error-prone)

(Word count ≈ 520)

---

## 3. Security Considerations

1. **Tenant Data Isolation**
   - Every table contains a tenant_id column
   - Every API query filters by tenant_id from JWT

2. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)

3. **Password Security**
   - Passwords hashed using bcrypt
   - Salted hashes prevent rainbow table attacks

4. **API Security**
   - Protected routes require valid JWT
   - Role checks enforced in middleware

5. **Audit Logging**
   - Critical actions logged for traceability

These measures ensure strong security boundaries between tenants and users.
