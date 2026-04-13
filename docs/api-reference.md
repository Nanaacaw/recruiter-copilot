# API Reference

Base prefix: `/api`

## Health

### `GET /api/health`

Returns runtime health and active AI configuration.

Example response:

```json
{
  "status": "healthy",
  "app": "AI Screening Copilot",
  "version": "1.0.0",
  "ai_provider": "openai",
  "ai_model": "qwen2.5:7b"
}
```

## Job Descriptions

### `GET /api/jd`

Query params:

- `search` optional title filter

### `POST /api/jd`

Creates a job description.

Request body:

```json
{
  "title": "Backend Developer",
  "department": "Engineering",
  "description": "Build APIs and services",
  "required_skills": [
    { "name": "Python", "weight": 1.0, "required": true }
  ],
  "experience_level": "mid",
  "min_experience_years": 2,
  "education_requirements": [],
  "certifications": [],
  "criteria_weights": {
    "skills": 0.35,
    "experience": 0.25,
    "education": 0.20,
    "certifications": 0.10,
    "overall_fit": 0.10
  }
}
```

### `GET /api/jd/{jd_id}`

Returns one job description.

### `PUT /api/jd/{jd_id}`

Updates a job description.

### `DELETE /api/jd/{jd_id}`

Deletes a job description.

## Candidates

### `GET /api/candidates`

Returns all candidates ordered by `uploaded_at desc`.

### `POST /api/candidates/upload`

Multipart upload endpoint.

Field name:

- `files`

Accepted formats:

- `.pdf`
- `.docx`

### `GET /api/candidates/{candidate_id}`

Returns one candidate.

### `DELETE /api/candidates/{candidate_id}`

Deletes the candidate and the raw uploaded file if it still exists.

## Screening

### `POST /api/screening`

Runs screening for one JD and one or more candidate IDs.

Request body:

```json
{
  "candidate_ids": [
    "candidate-uuid-1",
    "candidate-uuid-2"
  ],
  "job_description_id": "jd-uuid"
}
```

Behavior notes:

- reuses valid previous screening rows
- refreshes failed or stale AI results
- returns an array of screening responses

### `GET /api/screening/{jd_id}`

Returns all screenings for one job description ordered by `overall_score desc`.

### `GET /api/screening/result/{screening_id}`

Returns full screening detail including job description relation.

### `POST /api/screening/compare`

Request body:

```json
{
  "screening_ids": [
    "screening-uuid-1",
    "screening-uuid-2"
  ]
}
```

Returns the requested screening detail rows.

## Interview Questions

### `POST /api/interview/generate`

Request body:

```json
{
  "screening_id": "screening-uuid",
  "count": 10,
  "difficulty": "medium"
}
```

Behavior notes:

- returns cached questions if they already exist
- generates and stores new questions otherwise

### `GET /api/interview/{screening_id}`

Returns all stored questions for a screening.

## Export

### `GET /api/export/pdf/{screening_id}`

Generates a PDF report for one screening and returns it as a file response.

### `GET /api/export/pdf/batch/{jd_id}`

Generates a batch spreadsheet for all screenings under one JD.

Note:

- despite the path containing `/pdf/batch`, the current implementation returns an Excel `.xlsx` file

### `GET /api/export/excel/{jd_id}`

Alias for batch Excel export.

## Error Conventions

Common status codes:

- `400` invalid upload input
- `404` missing JD, candidate, screening, or export dataset
- `422` CV parsing failure
- `500` unexpected processing failure

AI provider failures are often normalized into valid screening rows with zero scores and explanatory weakness text, rather than always surfacing raw `500` errors to the client.
