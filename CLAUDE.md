# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Project Rules

- Prefer small, reviewable changes.
- Preserve existing behavior unless a task explicitly changes it.
- Run the narrowest relevant checks before handing work back.
- Do not overwrite user changes or generated secrets.

## Quality Gates

- Use `bun run check` as the default full local verification command when available.
- Keep generated files deterministic and idempotent.
