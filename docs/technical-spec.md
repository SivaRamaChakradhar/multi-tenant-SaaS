# Technical Specification

## Project Structure

### Backend
backend/
├── src/
│   ├── controllers/   # API logic
│   ├── routes/        # Route definitions
│   ├── middleware/    # Auth & RBAC
│   ├── utils/         # Helpers
│   ├── config/        # DB config
│   └── services/      # Audit logging
├── migrations/
├── seeds/
└── Dockerfile

### Frontend
frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── api/
│   ├── context/
│   └── styles/
└── Dockerfile

---

## Development Setup

### Prerequisites
- Docker
- Docker Compose
- Node.js 18+

### Environment Variables
- DB credentials
- JWT secret
- FRONTEND_URL

### Run Locally
```bash
docker-compose up -d
