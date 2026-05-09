# Context

Shared context files loaded at the start of conversations to orient Claude without repeating background information.

These files capture project memory: architecture decisions, team conventions, active workstreams, and personas.

## Conventions

- **Filename**: descriptive, in kebab-case (e.g., `project-context.md`, `api-conventions.md`)
- **Format**: Free-form Markdown — use headers to organize sections
- **Usage**: Reference a context file in your opening message: "Read `.claude/context/project-context.md` before proceeding."

## When to use

- Starting a new session on a complex feature
- Onboarding a subagent that needs project background
- Preserving decisions that would otherwise require re-explaining each session
