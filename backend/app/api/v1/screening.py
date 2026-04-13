import uuid
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Screening, Candidate, JobDescription
from app.schemas import ScreeningCreate, ScreeningResponse, ScreeningDetailResponse, CompareRequest
from app.services.ai_service import ai_service

router = APIRouter(prefix="/screening", tags=["Screening"])


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
        if existing:
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

        screening = Screening(
            id=str(uuid.uuid4()),
            candidate_id=candidate_id,
            job_description_id=data.job_description_id,
            overall_score=round(overall_score, 1),
            skills_score=ai_result.get("skills_score", 0),
            experience_score=ai_result.get("experience_score", 0),
            education_score=ai_result.get("education_score", 0),
            certification_score=ai_result.get("certification_score", 0),
            ai_analysis=ai_result,
            strengths=ai_result.get("strengths", []),
            weaknesses=ai_result.get("weaknesses", []),
            red_flags=ai_result.get("red_flags", []),
            matched_skills=ai_result.get("matched_skills", []),
            missing_skills=ai_result.get("missing_skills", []),
        )
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
