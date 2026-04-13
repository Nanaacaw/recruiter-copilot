# Repository Notes

## Current Repository Shape

The project is now managed as a single main repository.

Current state:

- root repo branch: `main`
- `frontend/` is now tracked as a normal directory inside the main repo
- `frontend/.git` has been removed from the working directory
- the old frontend Git metadata was backed up locally under `.repo-backups/`

This means GitHub will now be able to show the actual frontend source files directly from the main repository once you commit and push the flattening change.

## What Changed During Flattening

Previously:

- the root repo stored `frontend` as a Git link
- `frontend/` had its own branch and remote
- GitHub would often show the folder like a linked/private/unavailable repository

Now:

- the git-link entry has been removed from the root index
- the frontend source tree is staged as normal files in the root repo
- secret and build artifacts remain ignored by the root `.gitignore`

## Backup Location

Before flattening, the frontend Git metadata was backed up to:

- `.repo-backups/frontend-git-<timestamp>/`

That backup contains:

- previous frontend `HEAD`
- previous frontend branch name
- previous frontend remote information
- the old `.git` metadata directory

This gives you a recovery path if you ever want to inspect the old standalone frontend repo again.

## Why `frontend` Looked "Private" On GitHub Before

The old issue was not caused by:

- `package.json` using `"private": true`
- a frontend API key being hardcoded in source

It was caused by repository structure:

- the main repo referenced `frontend` indirectly
- GitHub tried to resolve it as a separate repository
- if that repository was private, missing, or inaccessible, the folder looked unavailable

## Clarification About `package.json`

`frontend/package.json` contains:

```json
"private": true
```

That only means:

- npm should not publish this app as a public package by accident

It does **not** hide the folder on GitHub.

## Frontend Secret Audit

Based on the current audit, no frontend API secret appears to be hardcoded in source files.

What is present:

- `frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

Why this is acceptable:

- `NEXT_PUBLIC_*` values are intentionally public in Next.js
- this value is only the backend URL, not a secret token

## Files That Must Stay Out Of Git

The root `.gitignore` now protects the most important local-only artifacts, including:

- `backend/.env`
- `frontend/.env.local`
- `frontend/node_modules/`
- `frontend/.next/`
- `frontend/*.tsbuildinfo`
- local SQLite databases
- uploaded CV files
- `.repo-backups/`

## Recommended Git Flow Now

Use the main repo for day-to-day work:

1. edit backend and frontend in the same repository
2. run `git status` from the project root
3. commit from the project root
4. push to the main remote

This is the simplest setup for:

- one pull request per feature
- one deployment story
- one code review surface
- one GitHub repository to browse
