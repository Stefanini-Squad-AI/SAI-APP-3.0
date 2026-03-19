# TuCreditoOnline

Full-stack online credit application platform.

**Live demo (GitHub Pages):** https://stefanini-squad-ai.github.io/SAI-APP-3.0/

**Documentation hub (GitHub Pages):** https://stefanini-squad-ai.github.io/SAI-APP-3.0/docs/

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | .NET 8 (ASP.NET Core Web API) |
| Database | MongoDB 7 |
| Auth | JWT Bearer tokens |

The UI supports **English**, **Latin American Spanish**, and **Brazilian Portuguese** — switchable at runtime via the language selector in the header.

---

## Run Modes and Requirements

You can run this project in two modes:

1. **Local Full-Stack Mode** (frontend + backend + MongoDB with real API)
2. **GitHub Pages Demo Mode** (frontend-only, no backend dependency)

### Requirements

| Mode | Requirements |
|---|---|
| Local Full-Stack | Docker Desktop (running) |
| GitHub Pages Demo | GitHub Actions + GitHub Pages enabled on the repository |

---

## Quick Start (Local Full-Stack via Docker)

**Prerequisites:** Docker Desktop running.

```bash
# 1. The .env file is included with safe defaults for local development.
#    Edit it if you need to change ports or credentials.

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

## First Login (Local Full-Stack)

The backend seeds a default admin account at startup (idempotent).

- Open: `http://localhost:3000/admin/login`
- Default credentials:
  - Email: `admin@tucreditoonline.local`
  - Password: `Admin123!`

You can override these with env vars in `.env`:
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_FULL_NAME`

---

## GitHub Pages Demo Mode (No Backend Dependency)

GitHub Pages deploys the frontend only. In this mode, login and admin pages run with frontend mock data so the demo works without backend/API.

CD workflow (`.github/workflows/cd-pipeline.yml`) enables:
- `VITE_ENABLE_MOCK_AUTH=true`

Optional GitHub repository secrets for demo credentials shown in the login panel:
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

If these secrets are not set, fallback values are used:
- `admin@tucreditoonline.local`
- `Admin123!`

---

## Environment Variables

A `.env` file with safe local defaults is included. Edit it as needed.

| Variable | Default | Description |
|---|---|---|
| `MONGO_USERNAME` | `admin` | MongoDB root username |
| `MONGO_PASSWORD` | `admin123` | MongoDB root password — **change in production** |
| `MONGO_DATABASE` | `tucreditoonline` | Database name |
| `API_PORT` | `5000` | Host port for the backend API |
| `JWT_SECRET` | *(see file)* | JWT signing key — must be 32+ characters |
| `DEFAULT_ADMIN_EMAIL` | `admin@tucreditoonline.local` | Seeded admin email (local/full-stack) |
| `DEFAULT_ADMIN_PASSWORD` | `Admin123!` | Seeded admin password (local/full-stack) |
| `DEFAULT_ADMIN_FULL_NAME` | `System Administrator` | Seeded admin display name |

---

## Project Structure

```
├── backend/          .NET 8 Web API (clean architecture)
│   └── src/
│       ├── TuCreditoOnline.API/            Controllers, middleware, Program.cs
│       ├── TuCreditoOnline.Application/    DTOs, interfaces
│       ├── TuCreditoOnline.Domain/         Entities, domain models
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
│       ├── services/     Axios API clients (with demo fallbacks)
│       └── utils/        JWT decoder, secure storage, input sanitizer
├── scripts/          Report generators (e.g. ZAP Tailwind dashboard v2)
├── .env
├── .gitignore
└── docker-compose.yml
```

---

## Security reports — OWASP ZAP (Tailwind dashboard v2)

After running ZAP scans (CI or locally), raw reports are written under `test-results/security/` (`zap-frontend-report.json`, `zap-api-report.html`, etc.).

Generate the **homologated interactive dashboard** (TailwindCSS, Dark/Grey mode, i18n ES/EN/PT, Chart.js widgets, executive summary via **Perplexity** from the root `.env`):

```bash
node scripts/generate-security-tailwind-report.cjs
```

Output:

- `test-results/security/tailwind-dashboard/security-dashboard.html` — self-contained style aligned with unit/functional (AURA) reports  
- `test-results/security/tailwind-dashboard/security-dashboard.md` — short executive markdown  

Requires `PERPLEXITY_API_KEY` (and optionally `PERPLEXITY_MODEL`) in the project `.env` for the AI summary.

---

## Internationalization

The frontend uses [i18next](https://www.i18next.com/). Three locales are bundled:

| Code | Language |
|---|---|
| `en` | English (default) |
| `es` | Latin American Spanish |
| `pt` | Brazilian Portuguese |

Users switch languages at runtime using the dropdown in the navigation header. The selection is persisted via `localStorage` between sessions.
