# Project Rules

- External word/verb management must go through the `words-api` edge function, which is intentionally public (no API key — user choice). Never widen the `words`/`verbs` RLS write policies to support it.
- See `API.md` for the endpoint contract (table/action/items JSON body).

# Git Workflow

- Commit and push directly to `main` — no feature branches, no PRs, no code-review gate.
