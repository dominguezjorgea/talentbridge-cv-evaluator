# Project Context — TalentBridge CV Evaluator

Load this file at the start of a session to orient Claude without repeating background.

---

## Project

**Name:** TalentBridge CV Evaluator
**Purpose:** AI-assisted technical CV screening tool. Evaluates candidates against a Job Description using Google Gemini, with a structured 4-step wizard UI.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, motion/react, lucide-react |
| Backend | Express 4, TypeScript, `@google/genai` SDK |
| AI | Google Gemini (`gemini-2.0-flash-lite` by default, configurable via `GEMINI_MODEL` env var) |
| Dev tooling | concurrently, tsx, tsc |

## Architecture

```
frontend/ (port 5173)          backend/ (port 3001)
  src/
    App.tsx      ──fetch──►  POST /api/extract-criteria
    services/               POST /api/evaluate-candidates
      apiService.ts          POST /api/generate-summary
    types.ts                GET  /api/health
  vite.config.ts
    proxy: /api → :3001
```

The frontend is a pure SPA — no Gemini SDK, no API key. All Gemini calls happen server-side. The Vite dev server proxies `/api/*` to `localhost:3001`.

## Key decisions

- **3 separate endpoints** (not 1 batch): preserves the Step 2 criteria-editing UX where the user adjusts weights before evaluation runs.
- **GEMINI_MODEL env var**: model is configurable without code changes (`backend/.env`).
- **`GEMINI_API_KEY` never in the client bundle**: removed from `vite.config.ts` `define` block as part of the security migration.
- **Wizard steps**: JD → CRITERIA (editable weights, must sum 100%) → CVS (separator `---`) → RESULTS (near-ties guard, score 0-10).

## Active branches

- `main` — stable, deployed
- `feature/claude-code-structure` — scaffolding `.claude/` directory structure

## Docs

See `docs/` for full technical analysis, UX friction points, and improvement roadmap:
- `docs/01-analisis-tecnico.md` — data flow, tech debt, security risks
- `docs/02-arquitectura-y-ux.md` — Mermaid diagram, UX analysis per step
- `docs/03-propuestas-de-mejora.md` — actionable refactoring and feature backlog
- `docs/00-plan-de-accion.md` — top 5 immediate actions with dependencies
