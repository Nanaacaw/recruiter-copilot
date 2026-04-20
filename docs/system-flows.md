# System Flows

## Core Workflow Summary

The product operates as a recruiter pipeline:

1. create a job description
2. upload candidate CVs
3. run AI screening for selected candidates and one selected JD
4. rank and compare results
5. export reports

## Flow 1: Create Job Description

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as FastAPI /api/jd
    participant DB as SQLite

    User->>FE: Fill JD form
    FE->>API: POST /api/jd
    API->>DB: Insert job_descriptions row
    DB-->>API: Created row
    API-->>FE: JD response
    FE-->>User: Show saved JD
```

## Flow 2: Upload Candidate CVs

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as FastAPI /api/candidates/upload
    participant FS as File storage
    participant Parser as CV parser service
    participant DB as SQLite

    User->>FE: Upload PDF/DOCX files
    FE->>API: multipart/form-data
    API->>FS: Save raw file
    API->>Parser: Parse file text
    Parser-->>API: Structured candidate data
    API->>DB: Insert candidates row
    API-->>FE: Candidate list
    FE-->>User: Show uploaded candidates
```

## Flow 3: Screening Candidates Against a Job Description

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as FastAPI /api/screening
    participant DB as SQLite
    participant AI as AI provider

    User->>FE: Select JD + candidates
    FE->>API: POST /api/screening
    API->>DB: Load JD
    loop For each candidate
        API->>DB: Load candidate
        API->>DB: Check existing screening
        alt Existing valid screening
            API-->>FE: Reuse stored screening row
        else Missing, failed, or stale screening
            API->>AI: Screen CV against JD
            AI-->>API: JSON analysis
            API->>DB: Insert or update screening row
        end
    end
    API-->>FE: Screening response list
    FE-->>User: Show ranked results
```

## Screening Decision Rules

When the backend receives a screening request:

- it looks up the selected JD once
- it loops over selected candidates
- it reuses an existing screening only when the stored result is still valid
- it refreshes old data when:
  - the previous result failed
  - the previous result came from a different provider/model

## Flow 4: Ranking and Comparison

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as FastAPI /api/screening/{jd_id}
    participant DB as SQLite

    User->>FE: Open ranking page
    FE->>API: GET screenings for selected JD
    API->>DB: Query screenings by job_description_id
    DB-->>API: Ordered screenings
    API-->>FE: Screening list
    FE-->>User: Render podium, table, and comparison details
```

## Flow 5: Export

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as FastAPI /api/export/*
    participant DB as SQLite
    participant Export as Export service
    participant TMP as Temp filesystem

    User->>FE: Request PDF or Excel export
    FE->>API: GET export endpoint
    API->>DB: Load screening data
    API->>Export: Build file
    Export->>TMP: Write temp file
    API-->>FE: File download response
    FE-->>User: Browser download starts
```

## Error Handling Summary

### Upload flow

- rejects unsupported file extensions
- rejects oversized files
- rolls back file write if parsing fails

### Screening flow

- retries retryable AI errors including 429-style rate limits
- spaces requests between candidates using configurable delay
- normalizes failures into structured zero-score results

### Export flow

- returns `404` if the screening/JD selection has no underlying data

## Current UX Implication

The backend is intentionally synchronous:

- one screening request handles one selected JD and many candidates in sequence
- the UI should therefore communicate that batch size affects waiting time
- lighter models reduce timeout and rate-limit pressure
