import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.models import JobDescription
from app.schemas import (
    JobDescriptionCreate,
    JobDescriptionUpdate,
    JobDescriptionResponse,
)

router = APIRouter(prefix="/jd", tags=["Job Descriptions"])


@router.get("", response_model=list[JobDescriptionResponse])
def list_job_descriptions(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(JobDescription)
    if search:
        query = query.filter(JobDescription.title.ilike(f"%{search}%"))
    return query.order_by(JobDescription.created_at.desc()).all()


@router.post("", response_model=JobDescriptionResponse, status_code=201)
def create_job_description(data: JobDescriptionCreate, db: Session = Depends(get_db)):
    jd = JobDescription(
        id=str(uuid.uuid4()),
        title=data.title,
        department=data.department,
        description=data.description,
        required_skills=[s.model_dump() for s in data.required_skills],
        experience_level=data.experience_level,
        min_experience_years=data.min_experience_years,
        education_requirements=[e.model_dump() for e in data.education_requirements],
        certifications=[c.model_dump() for c in data.certifications],
        criteria_weights=data.criteria_weights.model_dump(),
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


@router.get("/{jd_id}", response_model=JobDescriptionResponse)
def get_job_description(jd_id: str, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return jd


@router.put("/{jd_id}", response_model=JobDescriptionResponse)
def update_job_description(jd_id: str, data: JobDescriptionUpdate, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    update_data = data.model_dump(exclude_unset=True)
    if "required_skills" in update_data and update_data["required_skills"] is not None:
        update_data["required_skills"] = [s.model_dump() if hasattr(s, "model_dump") else s for s in update_data["required_skills"]]
    if "education_requirements" in update_data and update_data["education_requirements"] is not None:
        update_data["education_requirements"] = [e.model_dump() if hasattr(e, "model_dump") else e for e in update_data["education_requirements"]]
    if "certifications" in update_data and update_data["certifications"] is not None:
        update_data["certifications"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in update_data["certifications"]]
    if "criteria_weights" in update_data and update_data["criteria_weights"] is not None:
        update_data["criteria_weights"] = update_data["criteria_weights"].model_dump() if hasattr(update_data["criteria_weights"], "model_dump") else update_data["criteria_weights"]

    for key, value in update_data.items():
        if value is not None:
            setattr(jd, key, value)

    db.commit()
    db.refresh(jd)
    return jd


@router.delete("/{jd_id}", status_code=204)
def delete_job_description(jd_id: str, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    db.delete(jd)
    db.commit()
