# Example Command Template

Copy this file and rename it to define a new slash command.
The filename (without `.md`) becomes the command: `example-command.md` → `/example-command`

---

## Command
`/review-backend`

## Description
Runs a focused review of the backend source code: checks for missing input validation, exposed secrets in error responses, and TypeScript strictness issues.

## Prompt
```
Review the backend source code in `backend/src/`.

Check for:
1. Any route handler that does not validate its request body before processing
2. Any `catch` block that returns `error.stack`, `process.env`, or raw error messages to the client
3. Any `any` types or missing return type annotations in TypeScript

For each issue found:
- State the file path and line number
- Describe the problem in one sentence
- Suggest the fix

Output a numbered list. If no issues are found, say "No issues found."
```
