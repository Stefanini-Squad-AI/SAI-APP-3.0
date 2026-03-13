# Pruebas funcionales web automatizadas (E2E)

Pruebas E2E con **Playwright** para TuCreditoOnline (SAIAPP3-5 — Demo QA).

## Requisitos

- Node.js 18+
- Aplicación frontend en ejecución (p. ej. `http://localhost:3000` o la URL del preview)

## Instalación

```bash
cd e2e
npm install
npx playwright install chromium
```

## Ejecución

```bash
# Ejecutar todas las pruebas (base URL por defecto: http://localhost:3000)
npm test

# Con interfaz visible
npm run test:headed

# Modo UI de Playwright
npm run test:ui

# Contra otra URL (preview, staging, etc.)
BASE_URL=https://stefanini-squad-ai.github.io/SAI-APP-3.0/ npm test
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `BASE_URL` | URL base del frontend | `http://localhost:3000` |
| `E2E_ADMIN_EMAIL` | Email para prueba de login exitoso | `admin@example.com` |
| `E2E_ADMIN_PASSWORD` | Contraseña para prueba de login | `Admin123!` |

## Estructura de pruebas

| Spec | Descripción |
|------|-------------|
| `tests/home.spec.js` | Portada: branding, hero, CTAs |
| `tests/navigation.spec.js` | Navegación pública (Services, About, FAQ, Contact, Calculator, Admin Login, 404) |
| `tests/login.spec.js` | Login admin: formulario, validaciones, redirección tras login |
| `tests/calculator.spec.js` | Calculadora de crédito: carga, selector de tipo, formulario |

## Reporte

Tras la ejecución:

```bash
npm run test:report
```

Se abre el reporte HTML en `playwright-report/`.
