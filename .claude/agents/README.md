# Agents

Subagents with specialized roles launched via the `Agent` tool in Claude Code.

Each file defines a single agent's identity, goal, and constraints. Use one `.md` file per agent role.

## Conventions

- **Filename**: `<role-name>.md` in kebab-case (e.g., `code-reviewer.md`)
- **Required fields**: Role, Goal, Tools, Constraints
- **Invocation**: Reference the file in your Agent tool prompt to establish the agent's context

## When to use

Spawn a subagent when a task is independent, long-running, or benefits from a focused context window (e.g., auditing a specific module, generating a document, running parallel research).
