# Project Docs

This folder contains the operational and technical documentation for `ai_screening_copilot`.

## Document Map

- [build-phases.md](./build-phases.md)
  Phase-by-phase guide for rebuilding this project from zero in a sensible learning order.
- [architecture.md](./architecture.md)
  High-level system architecture, component responsibilities, and deployment shape.
- [system-flows.md](./system-flows.md)
  User journeys and backend request/processing flows from upload to export.
- [database.md](./database.md)
  Database schema, relationships, JSON fields, and storage notes.
- [api-reference.md](./api-reference.md)
  REST endpoints exposed by the FastAPI backend.
- [ai-integration.md](./ai-integration.md)
  AI provider design, model selection, retry logic, and failure-handling rules.
- [repository-notes.md](./repository-notes.md)
  Repository layout, nested `frontend` Git repo behavior, and secret-handling notes.
- [code-audit.md](./code-audit.md)
  Findings for potentially unused files/dependencies and recommended cleanup order.
- [security.md](./security.md)
  Current anti-spam baseline, environment knobs, and practical hardening roadmap.
- [cloudflare-access.md](./cloudflare-access.md)
  Practical setup to lock `app` and `api` behind Cloudflare Access login policies.

## Current Runtime Defaults

- Backend framework: FastAPI
- Frontend framework: Next.js App Router
- Database: SQLite
- Canonical database path: `backend/screening.db`
- Default AI provider: `openai`
- Default model: `qwen2.5:7b`
- Gateway mode: OpenAI-compatible endpoint configured via environment variables

## Public Repo Note

The documentation in this folder intentionally uses placeholders and generic examples for deploy-specific values such as:

- AI gateway hostnames
- public frontend domains
- tokens and API keys

Keep real infrastructure values in local `.env` files or deployment configuration rather than committing them into docs.

## Suggested Reading Order

1. Start with [build-phases.md](./build-phases.md) if your goal is to learn how to build this project step by step
2. Continue to [architecture.md](./architecture.md) to understand the final target state
3. Read [system-flows.md](./system-flows.md) to connect product behavior with API flow
4. Use [database.md](./database.md) and [api-reference.md](./api-reference.md) during implementation
5. Read [ai-integration.md](./ai-integration.md) before changing provider or model behavior
6. Read [repository-notes.md](./repository-notes.md) before pushing Git changes involving `frontend/`
7. Review [code-audit.md](./code-audit.md) before cleanup/refactor batches
8. Review [security.md](./security.md) before exposing public routes to the internet
9. Follow [cloudflare-access.md](./cloudflare-access.md) to gate public website access
