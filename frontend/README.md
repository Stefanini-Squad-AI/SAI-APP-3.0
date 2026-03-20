# TuCreditoOnline — Frontend

React + Vite frontend for the TuCreditoOnline online credit platform.

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **i18n**: i18next (EN / ES / PT)
- **Testing**: Jest + React Testing Library

## Quick Start

```bash
npm install
npm run dev       # http://localhost:3000
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |

## Environment Variables

Create a `.env.local` file in this directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_ENABLE_MOCK_BACKEND=false
```

The default value is `http://localhost:5000/api` if the variable is not set.

Set `VITE_ENABLE_MOCK_BACKEND=true` to run the admin area entirely with frontend mock responses (no backend API required). In this demo mode, admin login accepts any non-empty credentials for easy access.

## Project Structure

```
src/
├── components/
│   ├── admin/         # Admin modals (CreditRequest, CreditType, Service, User)
│   ├── auth/          # ProtectedRoute guard
│   ├── layout/        # Header, Footer, MainLayout, AdminLayout, LanguageSelector
│   └── wizard/        # Multi-step credit application wizard
├── config/
│   └── api.config.js  # API base URL and endpoint constants
├── contexts/
│   └── AuthContext.jsx # JWT-based auth state (memory only, no sensitive data in storage)
├── hooks/
│   ├── useApi.js
│   └── useCreditCalculator.js
├── i18n/
│   └── locales/       # en.json, es.json, pt.json
├── pages/
│   ├── admin/         # Dashboard, Requests, Users, CreditTypes, Services, Messages, Settings
│   ├── HomePage.jsx
│   ├── ServicesPage.jsx
│   ├── CalculatorPage.jsx
│   ├── ContactPage.jsx
│   ├── AboutPage.jsx
│   ├── FAQPage.jsx
│   └── NotFoundPage.jsx
├── services/          # Axios service modules (one per API resource)
└── utils/
    ├── inputSanitizer.js  # XSS prevention helpers
    ├── jwtDecoder.js      # JWT decode/expiry utilities
    └── secureStorage.js   # localStorage wrapper (allowlist-only keys)
```

## Security Notes

- JWT tokens are stored in localStorage via `secureStorage` (allowlist-enforced)
- User data (name, email, role) is kept in memory only — never persisted
- Input sanitization is applied before any data is sent to the API
- All API calls automatically attach the Bearer token via an Axios interceptor
- Expired tokens are cleared automatically on every request and on 401 responses
