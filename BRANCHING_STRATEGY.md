# Branching Strategy

## Branches

- **`main`** — Production. Deployed to Vercel production. Never push directly.
- **`dev`** — Active development. Deployed to Vercel preview. Never push directly.
- **`feature/*`** — New features, branched off `dev` (e.g. `feature/login-page`)
- **`fix/*`** — Bug fixes, branched off `dev` (e.g. `fix/routing-bug`)
- **`chore/*`** — Non-feature work, branched off `dev` (e.g. `chore/eslint-setup`)

## Workflow

1. Create a branch off `dev` (e.g. `feature/my-feature`)
2. Do your work, commit, and push
3. Open a PR into `dev`
4. Get at least 1 review, then merge
5. When `dev` is stable and ready for release, open a PR from `dev` into `main`

## Rules

- No direct pushes to `main` or `dev`
- All changes go through PRs with at least 1 approval
- No force pushes to `main` or `dev`
