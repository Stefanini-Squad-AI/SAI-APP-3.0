# TuCreditoOnline — Automation Framework

AI-powered BDD test automation built on **AURA** (Playwright + Cucumber-JS) with K6 performance testing.

## Structure

```
automation/
├── src/
│   ├── constants/        App URLs and expected content constants
│   ├── features/
│   │   ├── en/           Gherkin feature files in English
│   │   ├── es/           Gherkin feature files in Spanish  (# language: es)
│   │   └── pt/           Gherkin feature files in Portuguese (# language: pt)
│   ├── steps/            Step definitions (multi-language regex)
│   ├── cucumber/         World context and lifecycle hooks
│   └── core/             AURA engine (cognitive AI, intent pipeline, reporting)
└── performance/          K6 load and stress tests
```

## Quick Start

```bash
cd automation
npm install
npx playwright install chromium --with-deps
cp .env.example .env      # fill in your API key
npm test                  # runs EN features tagged @ci
```

## Running by Language

```bash
npm run test:en           # English features
npm run test:es           # Spanish features
npm run test:pt           # Portuguese features
```

Or by Cucumber profile:

```bash
npx cucumber-js --profile es
npx cucumber-js --profile pt
```

## Running by Tag

```bash
npm run test:smoke        # @smoke scenarios
npm run test:ci           # @ci scenarios (used in GitHub Actions)
npx cucumber-js --tags @demo-sai3   # demo scenarios
```

## Environment Variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|---|---|
| `BASE_URL` | App URL (default: GitHub Pages) |
| `MODEL_PROVIDER` | AI provider: `perplexity`, `gemini`, `openai`, `anthropic`, `ollama` |
| `PERPLEXITY_API_KEY` / `GEMINI_API_KEY` / etc. | API key for the chosen provider |
| `AURA_REPORT_LANGUAGE` | Executive summary language: `en`, `es`, `pt` |
| `AURA_COGNITIVE_ENABLED` | Enable AI element resolution (default: `false` in CI) |
| `AURA_RECORD_VIDEO` | Record video of each test run |

## Performance Tests (K6)

```bash
cd automation/performance
k6 run scripts/test-tco-pages.js                    # PERFORMANCE (default)
TEST_TYPE=LOAD k6 run scripts/test-tco-pages.js     # LOAD test
TEST_TYPE=STRESS k6 run scripts/test-tco-api.js     # STRESS test against API
```

## GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `automation.yml` | After deploy + manual | Runs AURA `@ci` tests against GitHub Pages |
| `security.yml` | After deploy + manual | OWASP ZAP baseline scan |

Reports are uploaded as artifacts and retained for 30–90 days.
