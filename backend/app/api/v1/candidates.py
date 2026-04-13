import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Candidate
from app.schemas import CandidateResponse
from app.services.cv_parser import cv_parser_service

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("", response_model=list[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).order_by(Candidate.uploaded_at.desc()).all()


@router.post("/upload", response_model=list[CandidateResponse], status_code=201)
async def upload_cvs(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    candidates = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")

        file_id = str(uuid.uuid4())
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")

        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File too large: {file.filename}")

        with open(file_path, "wb") as f:
            f.write(content)

        try:
            parsed_data = cv_parser_service.parse(file_path)
        except Exception as e:
            os.remove(file_path)
            raise HTTPException(status_code=422, detail=f"Failed to parse CV: {str(e)}")

        candidate = Candidate(
            id=str(uuid.uuid4()),
            name=parsed_data.get("name", file.filename),
            email=parsed_data.get("email", ""),
            phone=parsed_data.get("phone", ""),
            raw_cv_path=file_path,
            parsed_data=parsed_data,
        )
        db.add(candidate)
        candidates.append(candidate)

    db.commit()
    for c in candidates:
        db.refresh(c)
    return candidates


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.delete("/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if candidate.raw_cv_path and os.path.exists(candidate.raw_cv_path):
        os.remove(candidate.raw_cv_path)
    db.delete(candidate)
    db.commit()
