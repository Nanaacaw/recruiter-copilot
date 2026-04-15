# Build Phases

## Why This Document Exists

The current repository already contains the finished MVP. That is useful for using the product, but not always ideal for learning how a project like this should be built.

If we rebuilt `ai_screening_copilot` from zero today, this is the order that would make the project easier to reason about, test, and grow.

This guide is intentionally practical:

- each phase has a clear goal
- each phase explains what to build and what to postpone
- each phase maps to real folders and files in the current codebase
- each phase has an exit criterion so you know when to move on

## Final Product Goal

By the end of the build, the product should support:

1. creating job descriptions
2. uploading and parsing CVs
3. screening candidates against a JD with AI
4. ranking candidates
5. generating interview questions
6. exporting results

The important learning point is that this should not be built all at once. The right move is to create a thin vertical slice first, then layer capabilities in a controlled order.

## Recommended Build Strategy

Think in phases, not pages.

For this project, the best sequence is:

1. establish the backend and data model
2. prove one simple end-to-end workflow
3. add AI only after the non-AI flow is stable
4. add UX polish and export features last

That sequence reduces confusion because every new phase builds on something you already trust.

## Phase 0: Product Framing

### Goal

Decide what problem the MVP solves and what data the system must own.

### Questions to answer first

- Who is the user? Recruiter, HR, hiring manager, or agency operator?
- What is the core decision the app helps with?
- What are the minimum records we must store?
- Which features are essential for MVP, and which are optional?

### Output of this phase

You should define four core concepts:

- job description
- candidate
- screening result
- interview question

### Why this phase matters

Without this framing, it is very easy to build pages first and discover later that the data model is wrong.

### Exit criterion

You can explain the product in one sentence:

`Upload CVs, match them to a job description, score fit, and generate recruiter-ready follow-up actions.`

## Phase 1: Backend Skeleton and Database

### Goal

Create a backend that can start, connect to SQLite, and expose a health route.

### Build in this phase

- FastAPI app bootstrap in `backend/app/main.py`
- settings and environment loading in `backend/app/core/config.py`
- database engine and session setup in `backend/app/core/database.py`
- ORM models in `backend/app/models/models.py`

### Keep it small

At this stage, do not think about AI yet.

Only prove:

- the server boots
- the database file is created in the expected location
- models can be created
- a simple `/health` endpoint returns success

### Why this phase comes early

If configuration, database sessions, and app startup are messy, every later feature becomes harder than it should be.

### Exit criterion

You can run the backend locally and confirm:

- the API starts cleanly
- `backend/screening.db` is created
- `/health` responds successfully

## Phase 2: Job Description CRUD

### Goal

Build the first complete business entity from frontend to database.

### Build in this phase

- job description routes in `backend/app/api/v1/job_descriptions.py`
- request and response schemas in `backend/app/schemas/schemas.py`
- frontend page in `frontend/src/app/job-descriptions/page.tsx`
- API client methods in `frontend/src/lib/api.ts`

### What the user should be able to do

- create a job description
- list existing job descriptions
- inspect the stored structure

### Why this is the right first feature

Job descriptions are the anchor of the whole product. Candidates, screenings, and interview questions all depend on them.

This is also the safest vertical slice because it has:

- no file upload
- no AI dependency
- no complex output formatting

### Exit criterion

A recruiter can create and retrieve a job description from the UI.

## Phase 3: Candidate Upload and CV Parsing

### Goal

Allow users to upload CV files and convert them into usable candidate records.

### Build in this phase

- upload route in `backend/app/api/v1/candidates.py`
- CV parsing service in `backend/app/services/cv_parser.py`
- candidate persistence in `backend/app/models/models.py`
- candidate page in `frontend/src/app/candidates/page.tsx`

### Focus on the right outcome

At first, the parser does not need to be perfect.

The real MVP requirement is:

- store the raw file
- extract text
- capture enough fields to identify the candidate

### Common mistake to avoid

Do not over-engineer CV parsing in the beginning. A simple parser that reliably captures raw text is more valuable than a fragile parser that tries to infer every detail.

### Exit criterion

You can upload a PDF or DOCX and see a candidate row stored with:

- file path
- extracted text
- basic identity information

## Phase 4: Basic Screening Without AI

### Goal

Create the screening workflow before adding the LLM.

### Build in this phase

- screening route shape in `backend/app/api/v1/screening.py`
- screening schema shape in `backend/app/schemas/schemas.py`
- screening page shell in `frontend/src/app/screening/page.tsx`
- ranking read path in `frontend/src/app/ranking/page.tsx`

### What to implement first

Before calling an AI provider, implement a fake or heuristic screening result.

For example:

- if candidate text mentions required skills, increase score
- if years of experience appear, estimate experience score
- store a placeholder summary and strengths/weaknesses

### Why this is such an important phase

This lets you test:

- JD selection
- candidate selection
- screening row creation
- ranking UI

without being blocked by rate limits, quotas, timeout issues, or prompt design.

### Exit criterion

You can screen one or more candidates against one JD and see a stored result in the ranking view, even if the scoring logic is still simple.

## Phase 5: AI Provider Integration

### Goal

Replace the placeholder screening engine with a provider-backed AI service.

### Build in this phase

- provider abstraction in `backend/app/services/ai_service.py`
- provider implementations in `backend/app/services/ai_providers.py`
- environment-driven provider selection in `backend/app/core/config.py`
- failure handling and normalization in `backend/app/api/v1/screening.py`

### Recommended approach

Keep AI behind a narrow interface. The rest of the app should not care whether the provider is Gemini, Ollama, Claude, or OpenAI-compatible chat.

Good responsibilities:

- `ai_service.py` decides which provider is active
- `ai_providers.py` knows how to call each provider
- the route layer stores only normalized output

### What to add here

- prompt design for screening
- JSON normalization
- retry and backoff for rate limits
- provider/model metadata on stored results

### Why this phase is intentionally later

AI adds instability:

- 429 limits
- quota failures
- malformed JSON
- slow inference
- provider-specific response formats

By integrating it after the workflow is already working, you isolate the hard part.

### Exit criterion

Real AI screening works for at least one provider, and the result is stored in a stable internal format.

## Phase 6: Ranking and Decision Support UX

### Goal

Turn raw screening records into something a recruiter can actually use.

### Build in this phase

- ranking UI in `frontend/src/app/ranking/page.tsx`
- dashboard and shell improvements in `frontend/src/app/page.tsx`
- layout and status surface in `frontend/src/app/layout.tsx`
- runtime status components in `frontend/src/components/layout/sidebar.tsx`
- runtime top bar in `frontend/src/components/layout/app-topbar.tsx`

### What the UI should communicate clearly

- who is strongest overall
- why a candidate scored well or poorly
- which skills are missing
- whether the result is fresh or cached
- which provider and model are active

### Why this phase matters

A technically correct score is not enough. Recruiters need trust and interpretability.

### Exit criterion

A user can compare multiple candidates without reading raw JSON or digging through database rows.

## Phase 7: Interview Question Generation

### Goal

Generate actionable next-step questions from screening gaps.

### Build in this phase

- interview route in `backend/app/api/v1/interview.py`
- AI question generation in `backend/app/services/ai_providers.py`
- question caching in database tables
- interview page in `frontend/src/app/interview/page.tsx`

### Design principle

Questions should depend on weaknesses, missing skills, red flags, and candidate context from a specific screening result.

This phase belongs after screening because interview generation is a downstream action, not a primary record.

### Exit criterion

From one screening result, the system can generate and display reusable interview questions.

## Phase 8: Export and Reporting

### Goal

Let users take screening results out of the app.

### Build in this phase

- export route in `backend/app/api/v1/export.py`
- export builder in `backend/app/services/export_service.py`
- export page in `frontend/src/app/export/page.tsx`

### Why export is late in the roadmap

Export is useful, but it depends on the rest of the data model being stable. If you build it too early, you end up rewriting report formats every time the screening schema changes.

### Exit criterion

Users can download PDF or Excel reports from existing screening data.

## Phase 9: Hardening and Operations

### Goal

Make the MVP reliable enough for daily use.

### Improve in this phase

- canonical database path handling
- stale screening detection
- retry logic for 429 and transient provider errors
- health endpoint metadata
- `.gitignore` coverage for secrets and local artifacts
- repository cleanup and documentation

### What this phase usually fixes

- bugs caused by environment drift
- confusing cache behavior
- old AI errors being reused forever
- frontend and backend config mismatches
- Git confusion around nested repos

### Exit criterion

The product still feels simple, but it behaves predictably and is easier to maintain.

## Suggested Build Timeline

If you want a realistic learning plan, use this pacing:

1. Day 1: phases 0 to 2
2. Day 2: phase 3
3. Day 3: phase 4
4. Day 4: phase 5
5. Day 5: phases 6 to 7
6. Day 6: phases 8 to 9

This is not about speed. It is about keeping each day focused on one kind of problem.

## Suggested Git Commit Strategy

If you rebuild this project as an exercise, commit by phase.

Example sequence:

1. `chore: bootstrap FastAPI and SQLite`
2. `feat: add job description CRUD`
3. `feat: add candidate upload and CV parsing`
4. `feat: add screening workflow with placeholder scoring`
5. `feat: integrate AI screening provider`
6. `feat: add ranking and dashboard views`
7. `feat: add interview question generation`
8. `feat: add export endpoints and UI`
9. `docs: add architecture and implementation notes`
10. `chore: harden config, caching, and repository structure`

This makes your learning history readable later.

## What To Postpone On Purpose

When rebuilding from scratch, delay these until the core workflow is stable:

- multiple AI providers
- advanced prompt tuning
- perfect CV parsing
- fancy animations
- authentication and roles
- background jobs
- cloud deployment
- PostgreSQL migration

Postponing these is not cutting corners. It is good engineering prioritization.

## How To Study This Existing Repo

If you want to learn from the current codebase without getting overwhelmed, follow this order:

1. read `backend/app/main.py`, `backend/app/core/config.py`, and `backend/app/core/database.py`
2. read `backend/app/models/models.py` and `backend/app/schemas/schemas.py`
3. read `backend/app/api/v1/job_descriptions.py` and `frontend/src/app/job-descriptions/page.tsx`
4. read `backend/app/api/v1/candidates.py` and `backend/app/services/cv_parser.py`
5. read `backend/app/api/v1/screening.py`, `backend/app/services/ai_service.py`, and `backend/app/services/ai_providers.py`
6. read `frontend/src/app/screening/page.tsx` and `frontend/src/app/ranking/page.tsx`
7. read `backend/app/api/v1/interview.py` and `frontend/src/app/interview/page.tsx`
8. read `backend/app/api/v1/export.py` and `backend/app/services/export_service.py`

That order mirrors the build order and makes the repo much easier to absorb.

## Learning Outcome

If you can explain why this project is built in this sequence, you are learning more than just how this repo works.

You are learning:

- how to break a product into phases
- how to reduce implementation risk
- how to keep AI as a replaceable dependency
- how to separate MVP scope from future scope

That is the part that will transfer to your next project too.
