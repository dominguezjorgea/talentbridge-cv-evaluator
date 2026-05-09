# Example Skill Template

Copy this file and rename it to define a new reusable skill.

---

## Name
`write-api-endpoint`

## Trigger
Use this skill when adding a new Express route to `backend/src/routes/`.

## Steps
1. Read the existing routes in `backend/src/routes/evaluate.ts` to understand the pattern (Router, Request/Response types, try/catch structure, error response format).
2. Define the new route function following the same structure:
   - Validate the request body first, return 400 on invalid input
   - Wrap Gemini or business logic in try/catch
   - Never expose stack traces or env vars in error responses
3. Export the router and register it in `backend/src/index.ts`.
4. Run `tsc --noEmit` inside `backend/` to confirm no TypeScript errors.

## Output
A working Express route registered at the specified path, with input validation and error handling consistent with the existing codebase.
