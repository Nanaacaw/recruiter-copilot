import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import InterviewQuestion, Screening
from app.schemas import InterviewQuestionGenerate, InterviewQuestionResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/interview", tags=["Interview Questions"])


@router.post("/generate", response_model=list[InterviewQuestionResponse], status_code=201)
def generate_questions(data: InterviewQuestionGenerate, db: Session = Depends(get_db)):
    screening = db.query(Screening).filter(Screening.id == data.screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    existing = db.query(InterviewQuestion).filter(InterviewQuestion.screening_id == data.screening_id).all()
    if existing:
        return existing

    try:
        questions = ai_service.generate_interview_questions(
            cv_data=screening.candidate.parsed_data or {},
            jd_data={
                "title": screening.job_description.title,
                "department": screening.job_description.department,
            },
            screening_data={
                "skills_score": screening.skills_score,
                "experience_score": screening.experience_score,
                "education_score": screening.education_score,
                "weaknesses": screening.weaknesses or [],
                "missing_skills": screening.missing_skills or [],
                "red_flags": screening.red_flags or [],
            },
            count=data.count,
            difficulty=data.difficulty,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

    created = []
    if isinstance(questions, list):
        for q in questions:
            question = InterviewQuestion(
                id=str(uuid.uuid4()),
                screening_id=data.screening_id,
                question=q.get("question", ""),
                category=q.get("category", "technical"),
                difficulty=q.get("difficulty", data.difficulty),
                focus_area=q.get("focus_area", ""),
                evaluation_criteria=q.get("evaluation_criteria", ""),
            )
            db.add(question)
            created.append(question)

    db.commit()
    for c in created:
        db.refresh(c)
    return created


@router.get("/{screening_id}", response_model=list[InterviewQuestionResponse])
def get_questions(screening_id: str, db: Session = Depends(get_db)):
    return db.query(InterviewQuestion).filter(InterviewQuestion.screening_id == screening_id).all()
