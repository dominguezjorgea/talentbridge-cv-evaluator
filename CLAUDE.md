# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # Type-check only (tsc --noEmit, no eslint configured)
npm run preview   # Serve the production build
npm run clean     # Remove dist/
```

## Environment

Copy `.env.example` to `.env.local` and set:

- `GEMINI_API_KEY` — required; used directly in browser via Vite's `define` config (not a server secret)
- `APP_URL` — optional; the deployed service URL

The API key is injected at build time via `vite.config.ts` → `process.env.GEMINI_API_KEY`, meaning it's bundled into the client JS. This is intentional for Google AI Studio deployment.

Architecture##

Pure client-side React 19 SPA — no backend, no routing library, no state management library.

**Data flow (linear, step-driven):**

1. **JD step** → user pastes job description → `extractCriteria(jd)` calls Gemini → returns `Criterion[]` with `name`, `weight`, `observable_signs`, `degradation_signs`
2. **CRITERIA step** → user adjusts weights (must sum to exactly 100%) → confirms
3. **CVS step** → user pastes multiple CVs separated by `---` → `evaluateCandidate(cv, criteria, jd)` called sequentially per CV → all results fed to `generateExecutiveSummary(rankings, criteria)`
4. **RESULTS step** → ranked `CandidateRanking[]` + `ExecutiveSummary` displayed; near-ties (score diff ≤ 0.5) surfaced via a `useMemo` guard

**Key files:**

- `src/App.tsx` — entire app: all steps, all inline sub-components (`CandidateCard`, `StepIndicator`, etc.), all state
- `src/services/geminiService.ts` — three Gemini calls, each using structured JSON output with explicit `responseSchema`; model is `gemini-3-flash-preview`
- `src/types.ts` — shared interfaces (`Criterion`, `CandidateRanking`, `ExecutiveSummary`, `AppStep`)

**Gemini integration:** Uses `@google/genai` SDK with `responseMimeType: "application/json"` and `responseSchema` (structured output) for all three calls — no prompt parsing needed, responses are `JSON.parse(response.text)` directly.

**Recommendation thresholds** (in `geminiService.ts` prompt, not enforced in code): AVANZAR ≥ 8.0, CONSIDERAR 6.0–7.9, RECHAZAR < 6.0.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js` — config is inline). Animations use `motion/react` (Framer Motion v12). Icons from `lucide-react`.

## Rules

### R-SEC: Seguridad de credenciales
- NUNCA escribas `GEMINI_API_KEY` en ningún archivo dentro de `frontend/`.
- NUNCA uses el prefijo `VITE_` para secrets que llamen a servicios externos.
- Si necesitas una variable de entorno en el cliente, documenta por qué es segura de exponer. Si no puedes justificarlo, muévela al backend.
- Antes de cada commit verifica: `grep -r "GEMINI_API_KEY" frontend/` debe retornar vacío.

### R-API: Contrato de los endpoints /api/*
- Las respuestas de error siempre son `{ error: string }` en español claro.
- Nunca incluyas stack traces ni variables de proceso en respuestas al cliente.
- Códigos HTTP: 400 = input inválido, 500 = fallo del servidor, 200 = éxito.
- Endpoints actuales: `POST /api/extract-criteria`, `POST /api/evaluate-candidates`, `POST /api/generate-summary`, `GET /api/health`.

### R-GEMINI: Llamadas al modelo
- Siempre usa `responseMimeType: "application/json"` + `responseSchema` explícito.
- Siempre envuelve las llamadas con `withRetry()` (máx 3 intentos, backoff 800 ms).
- Siempre valida el JSON parseado con los validators de `backend/src/validators/`.
- El modelo se configura con la variable `GEMINI_MODEL` en `backend/.env` (default: `gemini-2.0-flash-lite`). No uses `gemini-3-flash-preview` (nombre deprecado).

### R-TYPES: Tipado TypeScript
- Prohibido `any` implícito o explícito — usa `unknown` y type guards.
- Toda función pública debe tener tipos explícitos en parámetros y retorno.
- Los tipos compartidos entre frontend y backend van en `frontend/src/types.ts` hasta que exista `shared/types.ts`. Nunca dupliques interfaces.

### R-STATE: Gestión de estado React
- El estado de evaluación va en custom hooks (`useEvaluation`, `useCriteria`, `useCandidates`) — nunca directamente en `App.tsx` una vez extraído.
- Los componentes de paso (`JDStep`, `CriteriaStep`, etc.) son funciones puras: reciben props, no leen estado global.
- Prohibido `alert()` y `console.log` en componentes UI. Usa `ErrorBanner` y `console.error` en servicios.

### R-GIT: Workflow de commits
- Formato: `type(scope): descripción` en inglés.
  Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
  Scopes: `frontend`, `backend`, `shared`, `docs`, `ci`.
  Ejemplo: `fix(backend): handle empty cvs array with 400 response`
- No hagas commits con `npm run lint` fallando.
- No hagas commits con `GEMINI_API_KEY` real en ningún archivo tracked.

## Glossary
- **JD**: Job Description — texto libre con el perfil del cargo a evaluar.
- **Criterion**: criterio de evaluación con peso (0–100) que debe sumar 100%.
- **CandidateRanking**: resultado de evaluar un CV contra los `Criterion[]`.
- **ExecutiveSummary**: síntesis top-3 generada tras evaluar todos los CVs.
- **near-tie**: dos candidatos con diferencia de score ≤ 0.5 (requiere revisión humana).
- **withRetry**: utilidad de reintentos con exponential backoff para llamadas Gemini.
