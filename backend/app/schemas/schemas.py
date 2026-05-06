from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SkillRequirement(BaseModel):
    name: str
    weight: float = 1.0
    required: bool = True


class EducationRequirement(BaseModel):
    level: str
    field: str = ""
    required: bool = True


class CertificationRequirement(BaseModel):
    name: str
    required: bool = False


class CriteriaWeights(BaseModel):
    skills: float = 0.35
    experience: float = 0.25
    education: float = 0.20
    certifications: float = 0.10
    overall_fit: float = 0.10


class AuthLoginRequest(BaseModel):
    username: str
    password: str


class AuthUserResponse(BaseModel):
    username: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class AuthMeResponse(BaseModel):
    authenticated: bool
    user: Optional[AuthUserResponse] = None


class JobDescriptionCreate(BaseModel):
    title: str
    department: str = ""
    description: str = ""
    required_skills: list[SkillRequirement] = []
    experience_level: str = "mid"
    min_experience_years: int = 0
    education_requirements: list[EducationRequirement] = []
    certifications: list[CertificationRequirement] = []
    criteria_weights: CriteriaWeights = CriteriaWeights()


class JobDescriptionUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[list[SkillRequirement]] = None
    experience_level: Optional[str] = None
    min_experience_years: Optional[int] = None
    education_requirements: Optional[list[EducationRequirement]] = None
    certifications: Optional[list[CertificationRequirement]] = None
    criteria_weights: Optional[CriteriaWeights] = None


class JobDescriptionResponse(BaseModel):
    id: str
    title: str
    department: str
    description: str
    required_skills: list
    experience_level: str
    min_experience_years: int
    education_requirements: list
    certifications: list
    criteria_weights: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CandidateResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    raw_cv_path: str
    parsed_data: dict
    uploaded_at: datetime

    class Config:
        from_attributes = True


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class ScreeningCreate(BaseModel):
    candidate_ids: list[str]
    job_description_id: str


class ScreeningResponse(BaseModel):
    id: str
    candidate_id: str
    job_description_id: str
    status: str = "pending"
    error_message: Optional[str] = None
    overall_score: float
    skills_score: float
    experience_score: float
    education_score: float
    certification_score: float
    ai_analysis: dict
    strengths: list
    weaknesses: list
    red_flags: list
    matched_skills: list
    missing_skills: list
    processing_time_seconds: Optional[float] = None
    screening_date: datetime
    candidate: Optional[CandidateResponse] = None

    class Config:
        from_attributes = True


class ScreeningDetailResponse(ScreeningResponse):
    job_description: Optional[JobDescriptionResponse] = None


class CompareRequest(BaseModel):
    screening_ids: list[str]
