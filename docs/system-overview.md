# System Overview

## Architecture and domain

The system is a full-stack web application for online credit management (TuCreditoOnline). The frontend is a React SPA; the backend provides REST APIs for authentication, credit types, and admin operations. The public site serves static legal and informational pages and does not require authentication.

## Module catalog

| Module | Purpose |
|--------|---------|
| **frontend-public** | React SPA: home, services, about, FAQ, contact, calculator, and static legal pages (Privacy, Terms, Legal Information). Served under the same origin as the main app. |
| **frontend-admin** | Admin UI (dashboard, credit requests, users, etc.) protected by JWT. |
| **backend** | Node/Express API: auth, credit types, messages, reports, settings. |

## Public routes

| Path | Description | Auth |
|------|-------------|------|
| `/` | Home | No |
| `/services` | Services | No |
| `/about` | About Us | No |
| `/faq` | FAQ | No |
| `/contact` | Contact | No |
| `/calculator` | Credit calculator | No |
| `/privacy` | Privacy Policy | No |
| `/terms` | Terms and Conditions | No |
| `/legal` | Legal Information (titular, datos registrales, aviso legal) | No |
| `/admin/login` | Admin login | No |

## Business rules (navigation)

- Header (desktop and mobile): Home, Services, Calculator, About, FAQ, Contact, **Información legal**, language selector, Admin login.
- Footer Legal section: Privacy Policy, Terms and Conditions, Información legal, Aviso Legal (both legal entries link to `/legal`), Admin access.
- All public routes are accessible without authentication.

## User flows

- **Visitor → Legal information:** From any public page, the user clicks "Información legal" in the Header or in the Footer Legal section and lands on `/legal`, where they see the legal information page (hero, sections, and links to Contact and Home).

## APIs and interfaces

- Backend REST API for admin and credit operations; not required for public static pages.
- i18n: Spanish (es), English (en), Portuguese (pt) for all public copy and navigation, including the Legal Information page and its nav entry.

## Diagrams

(Add architecture diagrams here as needed; e.g. frontend/public vs admin, route tree.)
