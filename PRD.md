# AI Screening Copilot - Product Requirements Document (PRD)

## 1. Overview

**Product Name:** AI Screening Copilot  
**Tagline:** AI-powered CV screening that helps HR find the best candidates faster  
**Target User:** Individual HR professionals / Solo recruiters  
**Version:** 1.0.0 MVP

---

## 2. Problem Statement

HR professionals spend 40-60% of their recruitment time manually screening CVs. This process is:
- **Slow**: Reading hundreds of CVs for a single position
- **Inconsistent**: Subjective judgments lead to bias and missed talent
- **Unscalable**: Cannot handle high-volume hiring campaigns efficiently
- **Error-prone**: Important details get overlooked in repetitive tasks

## 3. Product Vision

An AI copilot that automates CV screening by intelligently matching candidate profiles against job descriptions, providing objective scoring, ranking, and actionable insights — so HR can focus on the human side of hiring.

## 4. Core Features

### F1. CV Upload & Parsing
- Upload CV files in PDF and DOCX format
- Auto-extract structured data: name, email, phone, education, work experience, skills, certifications, languages
- Support batch upload (multiple CVs at once)
- Store parsed CV data in structured format
- Show parsing preview before confirming

### F2. Job Description Management
- Create, edit, delete job descriptions
- Define required skills, experience level, education requirements, certifications
- Set weight/priority for each criteria (Must-have vs Nice-to-have)
- Template library for common roles
- Clone existing JDs for similar positions

### F3. AI Screening & Scoring
- Match CV against JD using the configured AI provider (OpenAI-compatible Ollama by default)
- Score candidates on each criteria (0-100 scale)
- Overall match score with weighted calculation
- AI-generated strengths and weaknesses summary
- Highlight matching and missing skills
- Red flags detection (employment gaps, skill mismatches, etc.)

### F4. Ranking & Comparison
- Rank all candidates for a position by overall score
- Side-by-side comparison of 2-4 candidates
- Filter by score threshold, specific skills, education
- Sort by different criteria (overall score, experience, education, etc.)
- Visual score breakdown charts (radar/spider chart)

### F5. Export & Reporting
- Export screening results to PDF report
- Export candidate list to Excel/CSV
- Individual candidate report with score breakdown
- Batch report for all candidates per position
- Include AI analysis, scores, and recommended questions

---

## 5. User Flows

### Flow 1: Create Job Description
1. Navigate to Job Descriptions page
2. Click "Create New JD"
3. Fill in: Title, Department, Description, Required Skills, Experience Level, Education, Certifications
4. Set criteria weights (Must-have / Nice-to-have)
5. Save JD

### Flow 2: Screen Candidates
1. Navigate to Screening page
2. Select a Job Description
3. Upload CV(s) or select from existing candidates
4. Click "Start Screening"
5. AI processes each CV against JD
6. View results: scores, analysis, ranking
7. Drill down into individual candidate details

### Flow 3: Compare & Decide
1. From ranking view, select 2-4 candidates
2. Click "Compare"
3. View side-by-side score breakdown
4. Export final report

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                     │
│              Next.js 14 (App Router)          │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Dashboard│ │  JD Mgmt │ │   Screening  │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Ranking  │ │Compare │ │   Export     │ │
│  │   View   │ │Results │ │   Reports    │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│                 Backend                       │
│             Python FastAPI                    │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ │
│  │ CV Parser│ │AI Service │ │  Export     │ │
│  │(PDF/DOCX)│ │AI Provider│ │  Service    │ │
│  └──────────┘ └───────────┘ └────────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ │
│  │JD Service│ │Screening  │ │  Compare  │ │
│  │          │ │ Service   │ │  Service    │ │
│  └──────────┘ └───────────┘ └────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              Database (SQLite)                │
│   candidates │ job_descriptions │ screenings │
└──────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pydantic |
| AI Engine | **Multi-Provider**: Google Gemini, OpenAI GPT-4, Anthropic Claude, Local Ollama |
| Database | SQLite (MVP), PostgreSQL-ready |
| CV Parsing | PyMuPDF (PDF), python-docx (DOCX) |
| Export | ReportLab (PDF), openpyxl (Excel) |
| File Storage | Local filesystem (MVP) |

---

## 7. Data Models

### JobDescription
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | string | Job title |
| department | string | Department name |
| description | text | Full job description |
| required_skills | JSON | List of required skills with weights |
| experience_level | string | junior/mid/senior/lead |
| min_experience_years | int | Minimum years of experience |
| education_requirements | JSON | Required education levels |
| certifications | JSON | Required/preferred certifications |
| criteria_weights | JSON | Scoring weights per criteria |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

### Candidate
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Full name |
| email | string | Email address |
| phone | string | Phone number |
| raw_cv_path | string | Path to uploaded CV file |
| parsed_data | JSON | Structured extracted data |
| uploaded_at | datetime | Upload timestamp |

### Screening
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| candidate_id | UUID | FK to Candidate |
| job_description_id | UUID | FK to JobDescription |
| overall_score | float | Weighted overall score (0-100) |
| skills_score | float | Skills match score |
| experience_score | float | Experience match score |
| education_score | float | Education match score |
| certification_score | float | Certification match score |
| ai_analysis | JSON | Full AI analysis result |
| strengths | JSON | List of identified strengths |
| weaknesses | JSON | List of identified weaknesses |
| red_flags | JSON | List of red flags |
| matched_skills | JSON | Skills that match JD |
| missing_skills | JSON | Skills missing from JD |
| screening_date | datetime | When screening was performed |


---

## 8. API Endpoints

### Job Descriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jd | List all job descriptions |
| POST | /api/jd | Create job description |
| GET | /api/jd/{id} | Get JD details |
| PUT | /api/jd/{id} | Update JD |
| DELETE | /api/jd/{id} | Delete JD |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/candidates | List all candidates |
| POST | /api/candidates/upload | Upload CV(s) |
| GET | /api/candidates/{id} | Get candidate details |
| DELETE | /api/candidates/{id} | Delete candidate |

### Screening
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/screening | Screen candidate(s) against JD |
| GET | /api/screening/{jd_id} | Get all screenings for a JD |
| GET | /api/screening/result/{id} | Get screening result detail |
| POST | /api/screening/compare | Compare multiple screenings |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/export/pdf/{screening_id} | Export single screening to PDF |
| GET | /api/export/pdf/batch/{jd_id} | Export all screenings for JD |
| GET | /api/export/excel/{jd_id} | Export candidate list to Excel |

---

## 9. UI/UX Design

### Pages

1. **Dashboard** (`/`)
   - Stats cards: Total JDs, Candidates, Screenings this week
   - Recent screenings with scores
   - Quick actions: Create JD, Upload CV, Start Screening

2. **Job Descriptions** (`/job-descriptions`)
   - List view with search/filter
   - Create/Edit form with structured fields
   - Criteria weight configuration

3. **Candidates** (`/candidates`)
   - Table with search, filter, sort
   - Upload modal (drag & drop)
   - Parsed CV preview

4. **Screening** (`/screening`)
   - Step wizard: Select JD → Upload/Select CVs → Run Screening → View Results
   - Progress indicator during AI processing
   - Results with score cards and AI analysis

5. **Ranking** (`/ranking/{jd_id}`)
   - Ranked list of candidates with visual scores
   - Side-by-side comparison view
   - Filter and sort controls

6. **Export** (`/export`)
   - Export options per JD
   - Download PDF/Excel reports

### Design System
- **Theme**: Clean, professional, modern
- **Colors**: Primary blue (#3B82F6), Success green (#10B981), Warning amber (#F59E0B), Danger red (#EF4444)
- **Typography**: Inter font family
- **Components**: shadcn/ui component library
- **Layout**: Sidebar navigation + main content area

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| CV parsing time | < 3 seconds per file |
| AI screening time | < 10 seconds per CV-JD pair |
| Concurrent uploads | Up to 20 files |
| Max CV file size | 10 MB |
| Supported formats | PDF, DOCX |
| Uptime | Local development, best effort |
| Data retention | All data stored locally |

---

## 11. MVP Scope & Phasing

### Phase 1 (MVP) - Current
- CV Upload & Parsing (PDF + DOCX)
- Job Description CRUD
- AI Screening & Scoring with configurable AI provider
- Candidate Ranking
- Basic UI with all core flows

### Phase 2
- Export to PDF/Excel
- Side-by-side comparison
- JD templates library

### Phase 3
- Batch screening with progress tracking
- Advanced analytics dashboard
- Historical screening data
- Email integration
