# Project Context — TalentBridge CV Evaluator

_Critical rules and patterns for AI agents implementing code in this project. Focus on unobvious details agents might otherwise miss._

_Last updated: 2026-05-16_

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

## Technology Stack & Versions

| Layer | Package | Version |
|---|---|---|
| Frontend | react / react-dom | 19.0.1 |
| Frontend | vite | 6.2.3 |
| Frontend | @tailwindcss/vite | 4.1.14 — no `tailwind.config.js`; config is inline |
| Frontend | motion | 12.23.24 (Framer Motion v12, import as `motion/react`) |
| Frontend | lucide-react | 0.546.0 |
| Frontend | react-markdown | 10.1.0 |
| Backend | express | 4.21.2 |
| Backend | @google/genai | 1.29.0 |
| Backend | typescript | 5.8.2 (both sides) |
| Backend | dotenv | 17.2.3 |
| AI Model | default | `gemini-2.0-flash-lite` (override via `GEMINI_MODEL` in `backend/.env`) |

**Critical version constraints:**
- Tailwind v4: no config file — all customization via `@theme {}` in CSS or Vite plugin options.
- `motion` v12 is imported as `motion/react`, NOT `framer-motion`.
- Both packages use `"type": "module"` (ESM) — no `require()` anywhere.

## Language-Specific Rules

### TypeScript
- Both `frontend/` and `backend/` use `strict: true` — no implicit `any`, no type assertions without narrowing.
- Use `unknown` + type guards instead of `any` for untyped external data (API responses, request bodies).
- All public function signatures require explicit parameter and return types.
- `moduleResolution: "bundler"` on frontend; `module: "ESNext"` on backend — always use `.js` extension in backend relative imports (e.g., `import ... from './routes/evaluate.js'`).

### ESM
- Both sides are `"type": "module"` — never use `require()`, `module.exports`, or `__dirname`/`__filename`.
- Backend uses `tsx` for dev (no build needed) and `tsc` for production output to `dist/`.

### Error Handling
- Backend error responses: always `{ error: string }` — never expose stack traces or `process.env` values to the client.
- HTTP codes: `400` = invalid input, `500` = server/Gemini failure, `200` = success.
- Frontend `apiFetch` unwraps `{ error }` and throws as `Error` — callers catch and display via `ErrorBanner`, never `alert()`.
- Use `console.error('[route-name Error]', error)` in backend catch blocks; no `console.log` in UI components.

### Shared Types
- Shared interfaces (`Criterion`, `CandidateRanking`, `ExecutiveSummary`, `AppStep`) live in `frontend/src/types.ts`.
- Backend duplicates these inline in `routes/evaluate.ts` until a `shared/` package exists — keep both in sync manually when changing types.

## Framework-Specific Rules

### React (Frontend)
- Single-file architecture: all steps, state, and sub-components live in `src/App.tsx` — do not split into separate files unless explicitly asked.
- Step components (`JDStep`, `CriteriaStep`, etc.) are inline pure functions: receive props, own no state, no global reads.
- State of evaluation flow belongs in custom hooks (`useEvaluation`, `useCriteria`, `useCandidates`) once extracted — never add new step-level state directly to `App.tsx`.
- Animations via `motion/react` (Framer Motion v12) — import: `import { motion, AnimatePresence } from 'motion/react'`.
- Icons via `lucide-react` — tree-shakeable named imports only.
- No routing library — step navigation is controlled state (`AppStep` union type).
- No state management library — React `useState`/`useReducer`/`useMemo` only.
- Near-tie guard: candidates with score diff ≤ 0.5 require a `useMemo` flag in RESULTS — always preserve this logic when modifying rankings display.

### Express (Backend)
- All routes are in `backend/src/routes/evaluate.ts` — mounted at `/api` in `index.ts`.
- Request body is typed via `as { ... }` cast after reading (no runtime schema validation library currently in use).
- Body size limit: `5mb` (set in `express.json` middleware) — do not exceed when building prompts.
- CORS origin locked to `process.env.CORS_ORIGIN || 'http://localhost:5173'`.
- `getAI()` is called per-request (not a singleton) — intentional, avoids stale key issues.

### Gemini SDK (`@google/genai`)
- Always use `responseMimeType: 'application/json'` + explicit `responseSchema` (using `Type` enum from `@google/genai`).
- Parse response with `JSON.parse(response.text ?? '[]')` — never assume response is pre-parsed.
- Model: `const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'` — never hardcode model name.
- Recommendation enum values are Spanish: `'AVANZAR' | 'CONSIDERAR' | 'RECHAZAR'` — do not translate.
- Score range: 0–10 (not 0–100).

### Vite (Frontend Dev)
- `/api/*` is proxied to `http://localhost:3001` — never use absolute backend URLs in frontend code.
- Tailwind v4 loaded via `@tailwindcss/vite` plugin — no PostCSS config needed.

## Code Quality & Style Rules

### TypeScript / Linting
- Lint command is `tsc --noEmit` (type-check only) — no ESLint configured. Run before every commit.
- No `any` implicit or explicit — use `unknown` + type guards at system boundaries.
- No unused variables — TypeScript strict catches these; fix them, don't suppress.

### Naming Conventions
- Files: `PascalCase` for React components (`App.tsx`), `camelCase` for services/utilities (`apiService.ts`), `camelCase` for type files (`types.ts`).
- Components: PascalCase function names.
- Services: camelCase named exports (e.g., `extractCriteria`, `evaluateCandidate`).
- Backend routes: kebab-case URL segments (`/extract-criteria`, `/evaluate-candidates`).

### Comments
- No comments explaining *what* code does — well-named identifiers cover that.
- Only add a comment when the WHY is non-obvious: a hidden constraint, workaround, or surprising invariant.
- No multi-line comment blocks or docstrings.

### Git / Commits
- Format: `type(scope): description` in English.
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- Scopes: `frontend`, `backend`, `shared`, `docs`, `ci`.
- Never commit with `npm run lint` (tsc) failing.
- Never commit with a real `GEMINI_API_KEY` in any tracked file.

### Security
- `GEMINI_API_KEY` must never appear in `frontend/` source or bundles.
- Never use `VITE_` prefix for secrets calling external services.
- Verify with `grep -r "GEMINI_API_KEY" frontend/` before each commit — must return empty.

## Critical Don't-Miss Rules

### Anti-Patterns — Never Do These
- **Never add Gemini SDK or `GEMINI_API_KEY` to frontend** — all AI calls are backend-only.
- **Never use `gemini-3-flash-preview`** — deprecated; use `gemini-2.0-flash-lite` or read `GEMINI_MODEL` env var.
- **Never skip `responseSchema`** on Gemini calls — unstructured output breaks `JSON.parse` silently.
- **Never call `alert()`** in React components — use `ErrorBanner` component instead.
- **Never add global state management** (Redux, Zustand, etc.) — intentionally stateless React.
- **Never split `App.tsx`** into separate files without explicit instruction.
- **Never hardcode `localhost:3001`** in frontend — always use relative `/api/` paths (Vite proxy handles it).
- **Never duplicate type interfaces** — `frontend/src/types.ts` is the source of truth; sync backend manually.

### Edge Cases to Always Handle
- **Empty CV array**: `POST /api/evaluate-candidates` returns `400` if `cvs.length === 0`.
- **CV array > 20**: return `400` — Gemini rate limits make larger batches unreliable.
- **Missing `GEMINI_API_KEY`**: return `500` with safe message, never expose env state.
- **Criteria weights**: must sum to exactly 100% before Step 3 — enforced in UI.
- **Near-tie guard**: always preserve `useMemo` check (score diff ≤ 0.5) in RESULTS step.
- **CV separator**: `---` on its own line separates multiple CVs — preserve this parsing contract.

### Recommendation Thresholds (prompt-enforced only, not code-enforced)
- `AVANZAR` ≥ 8.0 | `CONSIDERAR` 6.0–7.9 | `RECHAZAR` < 6.0 — live in Gemini prompt text, not application logic.

## Docs

See `docs/` for full technical analysis, UX friction points, and improvement roadmap:
- `docs/01-analisis-tecnico.md` — data flow, tech debt, security risks
- `docs/02-arquitectura-y-ux.md` — Mermaid diagram, UX analysis per step
- `docs/03-propuestas-de-mejora.md` — actionable refactoring and feature backlog
- `docs/00-plan-de-accion.md` — top 5 immediate actions with dependencies

---

## Usage Guidelines

**For AI agents:** Read this file before implementing any code. Follow ALL rules exactly. When in doubt, prefer the more restrictive option. Flag this file for update if new patterns emerge.

**For humans:** Keep lean — only rules agents wouldn't infer from the code. Update when the stack changes. Remove rules that become obvious over time.
