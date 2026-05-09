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
