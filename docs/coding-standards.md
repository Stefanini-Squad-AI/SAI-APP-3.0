# Coding Standards

## Purpose

This document defines baseline coding standards for the SAI APP 3.0 repository to keep implementation quality consistent across frontend, backend, automation, and documentation updates.

## General standards

- Write code and technical documentation in English.
- Keep changes scoped to the issue requirements; avoid unrelated refactors in feature branches.
- Prefer clear naming over abbreviations for symbols, files, and test scenarios.
- Keep functions cohesive and focused on one responsibility.
- Add comments only when the intent is non-obvious.

## Frontend standards (React)

- Use functional components and hooks.
- Keep route definitions centralized and predictable.
- Preserve i18n coverage:
  - add/update translation keys in `en`, `es`, and `pt` locale files;
  - avoid hardcoded user-facing strings in components.
- Reuse shared layout/components before creating new variants.
- Keep JSX readable: small components, explicit props, and consistent class naming.

## Backend standards (.NET)

- Keep controller actions concise and delegate business logic to application/infrastructure services.
- Validate inputs and return explicit HTTP responses.
- Preserve JWT auth and authorization boundaries for protected endpoints.
- Keep CORS and environment-specific behavior explicit and documented.

## Automation standards

- Map tests to acceptance criteria and user-visible behavior.
- For i18n scope, include language-switch assertions and translated-text checks.
- Keep scenarios deterministic and suitable for CI execution.
- Treat "existing suite execution" separately from "new test delivery."

## Documentation standards

- Primary documentation artifacts must live under `docs/`.
- Keep module pages navigable and structured (`docs/site/.../index.html`).
- Update links so PR reviewers can open documentation previews directly.
- Include both architecture context and impacted module details when behavior changes.

## Language switch requirement

The product must continue to support runtime language switching through the header selector:

- English (`en`)
- Latin American Spanish (`es`)
- Brazilian Portuguese (`pt`)

Any UI feature touching labels, navigation, or page copy must include localization updates and verification.
