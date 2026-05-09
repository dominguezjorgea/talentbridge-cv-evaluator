# Commands

Custom slash commands for Claude Code, invokable with `/command-name` in the chat.

Each file defines one command. The filename (without `.md`) becomes the command name.

## Conventions

- **Filename**: `<command-name>.md` — no spaces, no leading slash (e.g., `review-pr.md` → `/review-pr`)
- **Required fields**: Command, Description, Prompt
- **Prompt**: The full instruction Claude executes when the command is triggered

## When to use

Create a command for any workflow you trigger frequently during development: running audits, generating changelogs, scaffolding components, summarizing diffs, etc.

## Note

Custom commands defined here are project-scoped. Place global commands in `~/.claude/commands/` instead.
