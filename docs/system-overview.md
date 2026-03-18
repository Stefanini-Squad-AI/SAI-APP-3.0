# System Overview

## Architecture and domain

TuCreditoOnline is a full-stack credit management platform:

- `frontend/`: React 18 + Vite + Tailwind CSS single-page application.
- `backend/`: ASP.NET Core Web API (.NET 8) with JWT authentication and MongoDB repositories.
- `database/`: MongoDB initialization and seed support for local dockerized environments.
- `automation/`: test and quality tooling, including the `applied-ai-aura` functional framework.

The platform serves two primary experiences:

1. Public user flows (no authentication required).
2. Admin flows (JWT-protected).

## Module catalog

| Module | Purpose | Tech |
|---|---|---|
| `frontend-public` | Public web experience: home, services, calculator, about, FAQ, contact, privacy, terms | React, React Router, i18next |
| `frontend-admin` | Administrative console: dashboard, credit requests, messages, users, credit types, services, reports, settings | React, protected routes, API client |
| `backend-api` | REST API for auth, dashboard, credit requests, users, credit types, services, messages, backup, health | ASP.NET Core, JWT, MongoDB |
| `automation-aura` | Functional automation scenarios and report generation | TypeScript, Cucumber, Playwright tooling |

## Public routes

| Path | Description | Auth |
|---|---|---|
| `/` | Home | No |
| `/services` | Services catalog | No |
| `/about` | About page | No |
| `/faq` | FAQ page | No |
| `/contact` | Contact page | No |
| `/calculator` | Credit calculator | No |
| `/privacy` | Privacy policy | No |
| `/terms` | Terms and legal notice destination | No |
| `/admin/login` | Admin login | No |

## Admin routes

| Path | Description | Auth |
|---|---|---|
| `/admin/dashboard` | KPI and status dashboard | Yes (JWT) |
| `/admin/credit-requests` | Credit request management | Yes (JWT) |
| `/admin/messages` | Contact message management | Yes (JWT) |
| `/admin/users` | User administration | Yes (JWT) |
| `/admin/credit-types` | Credit type catalog management | Yes (JWT) |
| `/admin/services` | Service catalog management | Yes (JWT) |
| `/admin/reports` | Report views | Yes (JWT) |
| `/admin/settings` | App/admin settings | Yes (JWT) |

## Key business/navigation rules

- Header navigation exposes public sections and language selector.
- Footer contains legal links (`/privacy`, `/terms`) and admin access entry.
- Authentication is mandatory for `/admin/*` except `/admin/login`.
- UI language is persisted through local storage/cookie (`tco-user-language`).

## Internationalization

Supported UI languages:

- `en` (English, fallback/default)
- `es` (Latin American Spanish)
- `pt` (Brazilian Portuguese)

Language switching behavior:

- Users switch languages at runtime from the header selector component.
- Selected language is persisted in local storage/cookie (`tco-user-language`).
- New UI copy should be added across all three locales to avoid mixed-language screens.

## APIs and interfaces

Base API convention: `/api/<controller>`

Core controller groups:

- `AuthController`: login/register.
- `DashboardController`: stats and status distribution.
- `CreditRequestsController`: listing, by id/status, approve/reject.
- `UsersController`: user operations and password change.
- `CreditTypesController`: credit type catalog operations.
- `ServicesController`: service catalog operations.
- `ContactMessagesController`: contact inbox operations.
- `BackupController`: backup generation and status.
- `HealthController`: service health checks.

## CI/CD and hosted surfaces

- Main app demo is deployed via GitHub Pages from `frontend/dist`.
- PR previews are published in CI (Surge and docs preview links in dashboard updates).
- Documentation pages under `docs/site` are intended to be browsed as static HTML and can be hosted side-by-side with app previews.

## Documentation map

- `docs/site/index.html`: documentation hub and entry point.
- `docs/site/modules/frontend-public/index.html`: public frontend module details.
- `docs/site/modules/frontend-admin/index.html`: admin module details.
- `docs/site/modules/backend-api/index.html`: backend API module details.
