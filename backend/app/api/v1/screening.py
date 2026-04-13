import uuid
import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Screening, Candidate, JobDescription
from app.schemas import ScreeningCreate, ScreeningResponse, ScreeningDetailResponse, CompareRequest
from app.services.ai_service import ai_service

router = APIRouter(prefix="/screening", tags=["Screening"])


def _screening_failed(screening: Screening) -> bool:
    ai_analysis = screening.ai_analysis or {}
    summary = ""
    if isinstance(ai_analysis, dict):
        summary = str(ai_analysis.get("summary", "")).lower()

    weaknesses = screening.weaknesses or []
    weakness_text = " ".join(str(item).lower() for item in weaknesses)

    return (
        screening.overall_score <= 0
        and (
            "ai screening failed" in summary
            or "ai error" in weakness_text
            or "ai provider error" in weakness_text
            or "quota exceeded" in weakness_text
            or "429" in weakness_text
        )
    )


def _screening_provider_mismatch(screening: Screening) -> bool:
    ai_analysis = screening.ai_analysis or {}
    if not isinstance(ai_analysis, dict):
        return False

    meta = ai_analysis.get("_meta")
    if not isinstance(meta, dict):
        return False

    current = ai_service.provider_metadata()
    return (
        meta.get("provider") != current.get("provider")
        or meta.get("model") != current.get("model")
    )


def _apply_screening_result(screening: Screening, ai_result: dict, weights: dict) -> Screening:
    skills_w = weights.get("skills", 0.35)
    exp_w = weights.get("experience", 0.25)
    edu_w = weights.get("education", 0.20)
    cert_w = weights.get("certifications", 0.10)
    fit_w = weights.get("overall_fit", 0.10)

    overall_score = (
        ai_result.get("skills_score", 0) * skills_w
        + ai_result.get("experience_score", 0) * exp_w
        + ai_result.get("education_score", 0) * edu_w
        + ai_result.get("certification_score", 0) * cert_w
        + ai_result.get("overall_fit_score", 0) * fit_w
    )

    screening.overall_score = round(overall_score, 1)
    screening.skills_score = ai_result.get("skills_score", 0)
    screening.experience_score = ai_result.get("experience_score", 0)
    screening.education_score = ai_result.get("education_score", 0)
    screening.certification_score = ai_result.get("certification_score", 0)
    screening.ai_analysis = ai_result
    screening.strengths = ai_result.get("strengths", [])
    screening.weaknesses = ai_result.get("weaknesses", [])
    screening.red_flags = ai_result.get("red_flags", [])
    screening.matched_skills = ai_result.get("matched_skills", [])
    screening.missing_skills = ai_result.get("missing_skills", [])
    screening.screening_date = datetime.utcnow()
    return screening


@router.post("", response_model=list[ScreeningResponse], status_code=201)
def create_screening(data: ScreeningCreate, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == data.job_description_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    results = []
    processed_count = 0
    jd_data = {
        "title": jd.title,
        "department": jd.department,
        "description": jd.description,
        "required_skills": jd.required_skills or [],
        "experience_level": jd.experience_level,
        "min_experience_years": jd.min_experience_years,
        "education_requirements": jd.education_requirements or [],
        "certifications": jd.certifications or [],
        "criteria_weights": jd.criteria_weights or {},
    }

    for candidate_id in data.candidate_ids:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail=f"Candidate not found: {candidate_id}")

        existing = (
            db.query(Screening)
            .filter(Screening.candidate_id == candidate_id, Screening.job_description_id == data.job_description_id)
            .first()
        )
        should_refresh_existing = bool(existing) and (
            _screening_failed(existing) or _screening_provider_mismatch(existing)
        )

        if existing and not should_refresh_existing:
            results.append(existing)
            continue

        try:
            if processed_count > 0 and settings.AI_SCREENING_DELAY_SECONDS > 0:
                time.sleep(settings.AI_SCREENING_DELAY_SECONDS)
            ai_result = ai_service.screen_cv(candidate.parsed_data or {}, jd_data)
            processed_count += 1
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI screening failed for {candidate.name}: {str(e)}")

        weights = jd_data.get("criteria_weights", {})
        if existing:
            screening = _apply_screening_result(existing, ai_result, weights)
            for question in list(screening.interview_questions):
                db.delete(question)
        else:
            screening = Screening(
                id=str(uuid.uuid4()),
                candidate_id=candidate_id,
                job_description_id=data.job_description_id,
            )
            _apply_screening_result(screening, ai_result, weights)
            db.add(screening)
        results.append(screening)

    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.get("/{jd_id}", response_model=list[ScreeningResponse])
def get_screenings_for_jd(jd_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Screening)
        .filter(Screening.job_description_id == jd_id)
        .order_by(Screening.overall_score.desc())
        .all()
    )


@router.get("/result/{screening_id}", response_model=ScreeningDetailResponse)
def get_screening_result(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    return screening


@router.post("/compare", response_model=list[ScreeningDetailResponse])
def compare_screenings(data: CompareRequest, db: Session = Depends(get_db)):
    screenings = db.query(Screening).filter(Screening.id.in_(data.screening_ids)).all()
    if len(screenings) != len(data.screening_ids):
        raise HTTPException(status_code=404, detail="One or more screenings not found")
    return screenings
