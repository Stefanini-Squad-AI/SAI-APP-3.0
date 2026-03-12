# AURA - Autonomous Understanding and Reasoning Automator

Next-generation test automation framework based on Playwright, TypeScript, and Cucumber.

## Overview

AURA provides:

- BDD test definitions with Gherkin features.
- Reusable step definitions and common web actions.
- Semantic intent resolution with optional LLM support.
- HTML and JSON reporting with screenshots and video support.

## Requirements

- Node.js 20+
- npm 10+

## Installation

```bash
npm install
npx playwright install chromium
```

## Configuration

Create a local `.env` file in this folder (do not commit it):

```env
MODEL_PROVIDER=perplexity
PERPLEXITY_API_KEY=your_key_here
PERPLEXITY_MODEL=sonar

AURA_TESTER_NAME=Your Name
AURA_TESTER_EMAIL=your@email.com
AURA_BROWSER=chromium
AURA_HEADLESS=true
AURA_TIMEOUT=30000
AURA_COGNITIVE_ENABLED=true
AURA_COGNITIVE_CACHE=true
AURA_COGNITIVE_CACHE_TTL=3600
AURA_REPORT_TITLE=SAI Test Report
AURA_REPORT_VERSION=1.0.0
AURA_REPORT_THEME=light
AURA_RECORD_VIDEO=true
AURA_DOCS_DIR=docs
```

For PR preview validation in CI, set:

```env
AURA_TARGET_URL=https://your-preview-domain.surge.sh
```

## Running tests

Run all features:

```bash
npm test
```

Run only preview checks:

```bash
npx cucumber-js --tags "@preview"
```

Run only smoke checks:

```bash
npx cucumber-js --tags "@smoke"
```

## Reports

After execution, reports are generated under `reports/` and may include:

- `aura-report.html`
- `aura-report.json`
- step screenshots
- execution video (`.webm`) when enabled

## Notes

- Keep all runtime secrets in GitHub Actions secrets or local `.env`.
- Keep test content and implementation in English for consistency.
