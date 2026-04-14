import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    department = Column(String(255), default="")
    description = Column(Text, default="")
    required_skills = Column(JSON, default=list)
    experience_level = Column(String(50), default="mid")
    min_experience_years = Column(Integer, default=0)
    education_requirements = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    criteria_weights = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    screenings = relationship("Screening", back_populates="job_description", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), default="")
    email = Column(String(255), default="")
    phone = Column(String(50), default="")
    raw_cv_path = Column(String(500), nullable=False)
    parsed_data = Column(JSON, default=dict)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    screenings = relationship("Screening", back_populates="candidate", cascade="all, delete-orphan")


class Screening(Base):
    __tablename__ = "screenings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_description_id = Column(String, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Float, default=0.0)
    skills_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    certification_score = Column(Float, default=0.0)
    ai_analysis = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    red_flags = Column(JSON, default=list)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    screening_date = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="screenings")
    job_description = relationship("JobDescription", back_populates="screenings")
    interview_questions = relationship("InterviewQuestion", back_populates="screening", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    screening_id = Column(String, ForeignKey("screenings.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(10), default="en")
    question = Column(Text, nullable=False)
    category = Column(String(50), default="technical")
    difficulty = Column(String(20), default="medium")
    focus_area = Column(String(255), default="")
    evaluation_criteria = Column(Text, default="")

    screening = relationship("Screening", back_populates="interview_questions")
