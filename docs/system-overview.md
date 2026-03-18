# System Overview — TuCreditoOnline (SAIAPP)

**Version:** 1.0  
**Last updated:** 2026-03-18

## 1. Architecture and domain map

TuCreditoOnline is a public-facing credit platform (SAIAPP) composed of:

- **Frontend (React SPA):** Public site and admin panel under a single app; routing separates public routes (MainLayout) from protected admin routes (AdminLayout).
- **Backend/API:** Credit and user management (out of scope for this document’s focus).
- **Deployment:** Preview deployments (e.g. Surge) per PR; CI runs functional tests against the preview URL.

### Domain boundaries

| Domain        | Responsibility                          | Main modules        |
|---------------|-----------------------------------------|---------------------|
| Public site   | Marketing, information, contact, legal   | sitio-publico       |
| Admin         | Credit requests, users, settings        | admin               |
| API           | Auth, credit, messages                  | backend             |

## 2. Module catalog

| Module          | Purpose                                           | Key routes / interfaces                    |
|-----------------|---------------------------------------------------|--------------------------------------------|
| **sitio-publico** | Public pages, navigation, legal and static content | `/`, `/services`, `/about`, `/faq`, `/contact`, `/calculator`, `/privacy`, `/terms`, `/legal` |
| Admin           | Dashboard, credit requests, users, reports        | `/admin/*`                                 |
| i18n            | Locales (es, en, pt) for public and static pages | `header.*`, `footer.*`, `*Page.*`           |

## 3. APIs and interfaces (relevant to this feature)

- **No new APIs.** The Legal Information page is static; content is served from the frontend via i18n keys `legalPage.*`.
- **Routing:** React Router; public routes are children of `MainLayout`. New route: `path="legal"` → `LegalInfoPage`.

## 4. Business rules (impacted)

- **Legal visibility:** Users must be able to access Legal Information (aviso legal / identificación del prestador) from the main navigation and from the footer, in the same way as Contact, Privacy and Terms.
- **Single destination for “Aviso Legal”:** The footer link “Aviso Legal” must point to `/legal` (Información legal), not to `/terms`.

## 5. User journeys (sitio público)

1. **Consultar información legal**  
   User opens the site → clicks “Información legal” in the header (or “Aviso Legal” in the footer) → lands on `/legal` → sees title, last updated, at least three content sections, and links to Contact and Home.

2. **Consistency with other static pages**  
   Same journey pattern as Política de Privacidad and Términos y Condiciones: hero, centered card, sections, and “Contáctanos” / “Volver al inicio” buttons.

## 6. Impact of SAIAPP3-14 (Legal Information page)

- **New route:** `/legal` → `LegalInfoPage`.
- **New/updated components:** `LegalInfoPage.jsx`; `Header.jsx` (link “Información legal” after Contact); `Footer.jsx` (“Aviso Legal” → `/legal`).
- **i18n:** `header.legalInfo`, `legalPage.title`, `legalPage.lastUpdated`, `legalPage.s1title`–`s3title`, `legalPage.s1body`–`s3body` in es, en, pt.
- **Documentation:** This file and `docs/site/modules/sitio-publico/index.html` describe the sitio público module and the new Legal page.
