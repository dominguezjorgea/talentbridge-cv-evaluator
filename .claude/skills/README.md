# Skills

Reusable prompt modules that encode repeatable tasks or workflows.

A skill is a structured prompt template invoked by name when a specific type of work is needed. Skills are composable — an agent can run multiple skills in sequence.

## Conventions

- **Filename**: `<skill-name>.md` in kebab-case (e.g., `write-test-suite.md`)
- **Required fields**: Name, Trigger, Steps, Output
- **Trigger**: A natural-language phrase that signals when this skill applies

## When to use

Use skills for tasks you perform repeatedly across sessions: code reviews, documentation generation, refactoring patterns, API integration steps, etc.
