# Project Docs

This folder contains the operational and technical documentation for `ai_screening_copilot`.

## Document Map

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

## Current Runtime Defaults

- Backend framework: FastAPI
- Frontend framework: Next.js App Router
- Database: SQLite
- Canonical database path: `backend/screening.db`
- Default AI provider: `openai`
- Default model: `qwen2.5:7b`
- Gateway mode: OpenAI-compatible endpoint at `https://ollama.nayerim.my.id/v1`

## Suggested Reading Order

1. Start with [architecture.md](./architecture.md)
2. Continue to [system-flows.md](./system-flows.md)
3. Use [database.md](./database.md) and [api-reference.md](./api-reference.md) during implementation
4. Read [ai-integration.md](./ai-integration.md) before changing provider or model behavior
5. Read [repository-notes.md](./repository-notes.md) before pushing Git changes involving `frontend/`
