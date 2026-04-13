import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Screening
from app.services.export_service import export_service

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/pdf/{screening_id}")
def export_screening_pdf(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    tmp_dir = tempfile.mkdtemp()
    output_path = os.path.join(tmp_dir, f"screening_{screening_id}.pdf")

    export_service.generate_screening_pdf(
        screening={
            "overall_score": screening.overall_score,
            "skills_score": screening.skills_score,
            "experience_score": screening.experience_score,
            "education_score": screening.education_score,
            "certification_score": screening.certification_score,
            "strengths": screening.strengths or [],
            "weaknesses": screening.weaknesses or [],
            "red_flags": screening.red_flags or [],
            "matched_skills": screening.matched_skills or [],
            "missing_skills": screening.missing_skills or [],
        },
        candidate={
            "name": screening.candidate.name,
            "email": screening.candidate.email,
        },
        jd={
            "title": screening.job_description.title,
            "department": screening.job_description.department,
        },
        output_path=output_path,
    )

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=f"screening_{screening.candidate.name}.pdf",
    )


@router.get("/pdf/batch/{jd_id}")
def export_batch_pdf(jd_id: str, db: Session = Depends(get_db)):
    screenings = db.query(Screening).filter(Screening.job_description_id == jd_id).all()
    if not screenings:
        raise HTTPException(status_code=404, detail="No screenings found")

    tmp_dir = tempfile.mkdtemp()
    output_path = os.path.join(tmp_dir, f"batch_{jd_id}.xlsx")

    screening_data = []
    for s in screenings:
        screening_data.append({
            "overall_score": s.overall_score,
            "skills_score": s.skills_score,
            "experience_score": s.experience_score,
            "education_score": s.education_score,
            "certification_score": s.certification_score,
            "strengths": s.strengths or [],
            "weaknesses": s.weaknesses or [],
            "candidate": {"name": s.candidate.name, "email": s.candidate.email},
        })

    export_service.generate_excel_report(screening_data, output_path)

    return FileResponse(
        output_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"screening_results_{jd_id}.xlsx",
    )


@router.get("/excel/{jd_id}")
def export_excel(jd_id: str, db: Session = Depends(get_db)):
    return export_batch_pdf(jd_id, db)
