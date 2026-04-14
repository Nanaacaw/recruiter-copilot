export interface SkillRequirement {
  name: string;
  weight: number;
  required: boolean;
}

export interface EducationRequirement {
  level: string;
  field: string;
  required: boolean;
}

export interface CertificationRequirement {
  name: string;
  required: boolean;
}

export interface CriteriaWeights {
  skills: number;
  experience: number;
  education: number;
  certifications: number;
  overall_fit: number;
}

export interface AiAnalysisMeta {
  provider: string;
  model: string;
}

export interface ScreeningAiAnalysis {
  skills_score?: number;
  experience_score?: number;
  education_score?: number;
  certification_score?: number;
  overall_fit_score?: number;
  overall_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  red_flags?: string[];
  matched_skills?: string[];
  missing_skills?: string[];
  summary?: string;
  _meta?: AiAnalysisMeta;
  [key: string]: unknown;
}

export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  ai_provider: string;
  ai_model: string;
}

export type InterviewLanguage = "en" | "id";

export interface JobDescription {
  id: string;
  title: string;
  department: string;
  description: string;
  required_skills: SkillRequirement[];
  experience_level: string;
  min_experience_years: number;
  education_requirements: EducationRequirement[];
  certifications: CertificationRequirement[];
  criteria_weights: CriteriaWeights;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  raw_cv_path: string;
  parsed_data: {
    raw_text?: string;
    name?: string;
    email?: string;
    phone?: string;
    sections?: string[];
  };
  uploaded_at: string;
}

export interface Screening {
  id: string;
  candidate_id: string;
  job_description_id: string;
  overall_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  certification_score: number;
  ai_analysis: ScreeningAiAnalysis;
  strengths: string[];
  weaknesses: string[];
  red_flags: string[];
  matched_skills: string[];
  missing_skills: string[];
  screening_date: string;
  candidate?: Candidate;
  job_description?: JobDescription;
}

export interface InterviewQuestion {
  id: string;
  screening_id: string;
  language: InterviewLanguage;
  question: string;
  category: "technical" | "behavioral" | "situational";
  difficulty: "easy" | "medium" | "hard";
  focus_area: string;
  evaluation_criteria: string;
}
