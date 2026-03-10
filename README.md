# TuCreditoOnline

Full-stack online credit application platform.

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | .NET 8 (ASP.NET Core Web API) |
| Database | MongoDB 7 |
| Auth | JWT Bearer tokens |

The UI supports **English**, **Latin American Spanish**, and **Brazilian Portuguese** — switchable at runtime via the language selector in the header.

---

## Quick Start (Docker)

**Prerequisites:** Docker Desktop running.

```bash
# 1. Copy the environment file
cp .env.example .env

# 2. Build and start all services
docker compose up --build

# 3. Open the app
#    Frontend  → http://localhost:3000
#    API docs  → http://localhost:5000/swagger
```

To stop:

```bash
docker compose down
```

To stop and also wipe the database volume:

```bash
docker compose down -v
```

---

## Services

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | React dev server with hot reload |
| Backend API | http://localhost:5000 | ASP.NET Core |
| Swagger UI | http://localhost:5000/swagger | API documentation |
| MongoDB | localhost:27017 | Internal; use a GUI like Compass to inspect |

---

## First Login

The database initializes empty. Create the first admin user via the Swagger UI:

1. Open http://localhost:5000/swagger
2. `POST /api/auth/register` with:
```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "fullName": "Admin User",
  "role": "Admin"
}
```
3. Log in at http://localhost:3000/admin/login with those credentials.

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `MONGO_USERNAME` | `admin` | MongoDB root username |
| `MONGO_PASSWORD` | `admin123` | MongoDB root password — **change in production** |
| `MONGO_DATABASE` | `tucreditoonline` | Database name |
| `API_PORT` | `5000` | Host port for the backend API |
| `JWT_SECRET` | *(see file)* | JWT signing key — must be 32+ characters |

---

## Project Structure

```
CLEAN/
├── backend/          .NET 8 Web API (clean architecture)
│   └── src/
│       ├── TuCreditoOnline.API/          Controllers, middleware, Program.cs
│       ├── TuCreditoOnline.Application/  DTOs, interfaces
│       ├── TuCreditoOnline.Domain/       Entities, domain models
│       └── TuCreditoOnline.Infrastructure/ MongoDB repos, services, security
├── database/
│   └── init/init-db.js   MongoDB initialization script
├── frontend/         React 18 + Vite
│   └── src/
│       ├── components/   Layout, admin modals, wizard
│       ├── contexts/     AuthContext (JWT in memory)
│       ├── hooks/        useApi, useCreditCalculator
│       ├── i18n/         en.json, es.json, pt.json
│       ├── pages/        Public pages + admin panel
│       ├── services/     Axios API clients
│       └── utils/        JWT decoder, secure storage, input sanitizer
├── .env.example
├── .gitignore
└── docker-compose.yml
```

---

## Internationalization

The frontend uses [i18next](https://www.i18next.com/). Three locales are bundled:

| Code | Language |
|---|---|
| `en` | English (default) |
| `es` | Latin American Spanish |
| `pt` | Brazilian Portuguese |

Users switch languages at runtime using the dropdown in the navigation header. The selection is persisted via `localStorage` between sessions.
