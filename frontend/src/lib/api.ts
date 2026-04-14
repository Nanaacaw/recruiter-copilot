import type {
  Candidate,
  HealthStatus,
  InterviewLanguage,
  InterviewQuestion,
  JobDescription,
  Screening,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/backend-api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || "API request failed");
      }

      if (res.status === 204) return undefined as T;
      return res.json();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        throw new Error(`Cannot connect to backend server. Check the API endpoint configuration: ${this.baseUrl}`);
      }
      throw err;
    }
  }

  async uploadFiles(endpoint: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || "Upload failed");
      }
      return res.json();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        throw new Error(`Cannot connect to backend server. Check the API endpoint configuration: ${this.baseUrl}`);
      }
      throw err;
    }
  }

  async downloadFile(endpoint: string, filename: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${endpoint}`);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Job Descriptions
  getJobDescriptions = (search?: string) =>
    this.request<JobDescription[]>(`/jd${search ? `?search=${search}` : ""}`);
  getJobDescription = (id: string) => this.request<JobDescription>(`/jd/${id}`);
  createJobDescription = (data: unknown) =>
    this.request<JobDescription>("/jd", { method: "POST", body: JSON.stringify(data) });
  updateJobDescription = (id: string, data: unknown) =>
    this.request<JobDescription>(`/jd/${id}`, { method: "PUT", body: JSON.stringify(data) });
  deleteJobDescription = (id: string) =>
    this.request<void>(`/jd/${id}`, { method: "DELETE" });

  // Candidates
  getCandidates = () => this.request<Candidate[]>("/candidates");
  getCandidate = (id: string) => this.request<Candidate>(`/candidates/${id}`);
  uploadCVs = (files: File[]) => this.uploadFiles("/candidates/upload", files);
  deleteCandidate = (id: string) =>
    this.request<void>(`/candidates/${id}`, { method: "DELETE" });

  // Screening
  createScreening = (data: { candidate_ids: string[]; job_description_id: string }) =>
    this.request<Screening[]>("/screening", { method: "POST", body: JSON.stringify(data) });
  getScreeningsForJd = (jdId: string) => this.request<Screening[]>(`/screening/${jdId}`);
  getScreeningResult = (id: string) => this.request<Screening>(`/screening/result/${id}`);
  compareScreenings = (screeningIds: string[]) =>
    this.request<Screening[]>("/screening/compare", {
      method: "POST",
      body: JSON.stringify({ screening_ids: screeningIds }),
    });

  // Interview Questions
  generateQuestions = (
    screeningId: string,
    options?: { count?: number; difficulty?: string; language?: InterviewLanguage }
  ) =>
    this.request<InterviewQuestion[]>("/interview/generate", {
      method: "POST",
      body: JSON.stringify({
        screening_id: screeningId,
        count: options?.count ?? 10,
        difficulty: options?.difficulty ?? "medium",
        language: options?.language ?? "en",
      }),
    });
  getQuestions = (screeningId: string, language: InterviewLanguage = "en") =>
    this.request<InterviewQuestion[]>(`/interview/${screeningId}?language=${language}`);

  // Export
  exportPdf = (screeningId: string) =>
    this.downloadFile(`/export/pdf/${screeningId}`, `screening_report.pdf`);
  exportBatchPdf = (jdId: string) =>
    this.downloadFile(`/export/pdf/batch/${jdId}`, `screening_results.xlsx`);
  exportExcel = (jdId: string) =>
    this.downloadFile(`/export/excel/${jdId}`, `screening_results.xlsx`);

  // Health
  health = () => this.request<HealthStatus>("/health");
}

export const api = new ApiClient(API_BASE);
