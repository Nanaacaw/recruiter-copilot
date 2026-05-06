import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import uuid
import time
from datetime import datetime

from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.models.models import Screening, Candidate, JobDescription
from app.schemas import ScreeningCreate, ScreeningResponse, ScreeningDetailResponse, CompareRequest
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/screening", tags=["Screening"])


def _screening_failed(screening: Screening) -> bool:
    """Return True if the screening result is unusable and should be re-run."""
    if screening.status == "failed":
        return True

    all_zero = (
        screening.overall_score <= 0
        and screening.skills_score <= 0
        and screening.experience_score <= 0
        and screening.education_score <= 0
    )
    if all_zero:
        return True

    ai_analysis = screening.ai_analysis or {}
    summary = str(ai_analysis.get("summary", "")).lower() if isinstance(ai_analysis, dict) else ""
    weaknesses = screening.weaknesses or []
    weakness_text = " ".join(str(item).lower() for item in weaknesses)

    error_keywords = (
        "ai screening failed",
        "ai error",
        "ai provider error",
        "quota exceeded",
        "429",
        "invalid json",
        "no choices returned",
        "no response",
        "empty model response",
    )
    return any(kw in summary or kw in weakness_text for kw in error_keywords)


def _screening_provider_mismatch(screening: Screening) -> bool:
    ai_analysis = screening.ai_analysis or {}
    if not isinstance(ai_analysis, dict):
        return False
    meta = ai_analysis.get("_meta")
    if not isinstance(meta, dict):
        return False
    current = ai_service.provider_metadata()
    return meta.get("provider") != current.get("provider") or meta.get("model") != current.get("model")


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


def _process_screening_bg(screening_ids: list[str], jd_data: dict) -> None:
    """Background task: runs AI for each pending screening, one at a time."""
    logger.info("Background task started for %d screenings", len(screening_ids))
    db = SessionLocal()
    try:
        processed_count = 0
        for screening_id in screening_ids:
            screening = db.query(Screening).filter(Screening.id == screening_id).first()
            if not screening or screening.status != "pending":
                continue

            candidate = screening.candidate
            if not candidate:
                logger.warning("Candidate not found for screening %s", screening_id)
                screening.status = "failed"
                screening.error_message = "Candidate not found in database"
                db.commit()
                continue

            try:
                if processed_count > 0 and settings.AI_SCREENING_DELAY_SECONDS > 0:
                    time.sleep(settings.AI_SCREENING_DELAY_SECONDS)

                logger.info("Screening candidate '%s' (id=%s)", candidate.name, candidate.id)
                t_start = time.monotonic()
                ai_result = ai_service.screen_cv(candidate.parsed_data or {}, jd_data)
                elapsed = round(time.monotonic() - t_start, 1)

                ai_weaknesses = ai_result.get("weaknesses") or []
                error_hint = next(
                    (str(w) for w in ai_weaknesses if str(w).lower().startswith("ai error:")),
                    None,
                )
                if error_hint:
                    raise ValueError(error_hint)

                weights = jd_data.get("criteria_weights", {})
                _apply_screening_result(screening, ai_result, weights)
                screening.status = "completed"
                screening.error_message = None
                screening.processing_time_seconds = elapsed
                processed_count += 1
                logger.info("Screening completed for '%s' — score %.1f in %.1fs", candidate.name, screening.overall_score, elapsed)
            except Exception as exc:
                logger.exception("AI screening failed for candidate '%s': %s", candidate.name, exc)
                screening.status = "failed"
                screening.error_message = f"AI screening failed: {exc}"

            db.commit()
        logger.info("Background task completed. Processed %d screenings", processed_count)
    except Exception as e:
        logger.exception("Background task crashed: %s", e)
    finally:
        db.close()


@router.post("", response_model=list[ScreeningResponse], status_code=201)
def create_screening(data: ScreeningCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == data.job_description_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    candidate_map: dict[str, Candidate] = {
        c.id: c
        for c in db.query(Candidate).filter(Candidate.id.in_(data.candidate_ids)).all()
    }
    missing_ids = [cid for cid in data.candidate_ids if cid not in candidate_map]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Candidates not found: {', '.join(missing_ids)}")

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

    results = []
    pending_ids = []

    for candidate_id in data.candidate_ids:
        candidate = candidate_map[candidate_id]

        existing = (
            db.query(Screening)
            .filter(Screening.candidate_id == candidate_id, Screening.job_description_id == data.job_description_id)
            .first()
        )
        should_refresh = bool(existing) and (
            _screening_failed(existing) or _screening_provider_mismatch(existing)
        )

        if existing and not should_refresh:
            results.append(existing)
            continue

        cv_data = candidate.parsed_data or {}
        raw_text = cv_data.get("raw_text", "") if isinstance(cv_data, dict) else ""
        if not raw_text or not raw_text.strip():
            raise HTTPException(
                status_code=422,
                detail=f"CV for '{candidate.name}' has no extractable text. Please re-upload a text-based PDF or DOCX.",
            )

        if existing:
            existing.status = "pending"
            existing.error_message = None
            screening = existing
        else:
            screening = Screening(
                id=str(uuid.uuid4()),
                candidate_id=candidate_id,
                job_description_id=data.job_description_id,
                status="pending",
            )
            db.add(screening)

        results.append(screening)
        pending_ids.append(screening.id)

    db.commit()
    for r in results:
        db.refresh(r)

    if pending_ids:
        background_tasks.add_task(_process_screening_bg, pending_ids, jd_data)

    return results


@router.get("/{jd_id}", response_model=list[ScreeningResponse])
def get_screenings_for_jd(jd_id: str, db: Session = Depends(get_db)):
    # Auto-reset screenings stuck in "pending" for more than 5 minutes
    from datetime import datetime, timedelta, timezone
    stale_threshold = datetime.now(timezone.utc) - timedelta(minutes=30)
    stale_pending = (
        db.query(Screening)
        .filter(
            Screening.job_description_id == jd_id,
            Screening.status == "pending",
            Screening.screening_date < stale_threshold,
        )
        .all()
    )
    if stale_pending:
        for s in stale_pending:
            s.status = "failed"
            s.error_message = "Processing timed out — please try again"
        db.commit()

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
