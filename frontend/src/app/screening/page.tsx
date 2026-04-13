"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Candidate, HealthStatus, JobDescription, Screening } from "@/types";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Loader2,
  Radar,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Screening request failed. Please try again.";
}

function ScoreCircle({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const color =
    score >= 75
      ? "from-emerald-400 to-cyan-400"
      : score >= 50
        ? "from-amber-400 to-orange-400"
        : "from-red-400 to-rose-400";
  const textColor =
    score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const dim = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const fontSize = size === "lg" ? "text-xl" : "text-sm";

  return (
    <div className={`${dim} rounded-full bg-gradient-to-br ${color} p-[3px]`}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
        <span className={`${fontSize} font-bold ${textColor}`}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function ScreeningPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [selectedJd, setSelectedJd] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [screening, setScreening] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [results, setResults] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [jdData, candidateData, healthData] = await Promise.all([
          api.getJobDescriptions(),
          api.getCandidates(),
          api.health().catch(() => null),
        ]);

        if (ignore) return;

        setJds(jdData);
        setCandidates(candidateData);
        setHealth(healthData);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadResults() {
      if (!selectedJd) {
        setResults([]);
        return;
      }

      setResultsLoading(true);
      try {
        const data = await api.getScreeningsForJd(selectedJd);
        if (!ignore) setResults(data);
      } catch {
        if (!ignore) setResults([]);
      } finally {
        if (!ignore) setResultsLoading(false);
      }
    }

    loadResults();

    return () => {
      ignore = true;
    };
  }, [selectedJd]);

  const handleScreen = async () => {
    if (!selectedJd || selectedCandidates.length === 0) return;

    setScreening(true);
    setErrorMessage("");

    try {
      const response = await api.createScreening({
        candidate_ids: selectedCandidates,
        job_description_id: selectedJd,
      });
      setResults(response);
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setScreening(false);
    }
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((candidateId) => candidateId !== id) : [...prev, id]
    );
  };

  const selectedJob = jds.find((jd) => jd.id === selectedJd);
  const selectedCandidateCards = candidates.filter((candidate) => selectedCandidates.includes(candidate.id));
  const sortedResults = [...results].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="mx-auto max-w-7xl p-8">
      <section className="hero-mesh soft-panel overflow-hidden rounded-[2rem] border-0">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.25fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Radar className="h-3.5 w-3.5 text-indigo-600" />
              Screening batch workspace
            </div>

            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-900">
                Match one role against the right pile of CVs, then let the AI do the triage.
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                The backend now refreshes stale or failed results automatically, so older Gemini quota errors
                should no longer stick around after you rerun the same job description and candidate pair.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-cyan-700">
                <Bot className="mr-1.5 h-3.5 w-3.5" />
                {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
              </Badge>
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                {selectedCandidates.length} candidate{selectedCandidates.length === 1 ? "" : "s"} selected
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-slate-700">
                Existing results: {sortedResults.length}
              </Badge>
            </div>
          </div>

          <Card className="border-0 bg-slate-950/92 text-white shadow-2xl shadow-slate-300/30">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Batch guidance</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-sm font-semibold text-white">Best quality flow</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Start with a small validation batch, review the tone and fit quality, then expand to a larger candidate set.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-sm font-semibold text-white">Rate-limit safety</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Screening requests are sequenced with retry/backoff so the gateway is less likely to spike into 429s.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-sm font-semibold text-white">Result hygiene</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Failed results or old provider/model combinations are refreshed automatically on rerun.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {errorMessage ? (
        <Alert className="mt-6 border border-amber-200 bg-amber-50/90 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Screening request failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {screening ? (
        <Card className="soft-panel mt-6 border-0">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">AI screening in progress</p>
                <p className="text-sm text-slate-500">
                  Requests are sent sequentially so the provider has room to breathe.
                </p>
              </div>
              <Badge className="rounded-full border-0 bg-indigo-50 text-indigo-700">
                <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                Processing batch
              </Badge>
            </div>
            <div className="mt-4">
              <Progress value={68} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="soft-panel border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Build a screening batch</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Choose one role, then stack candidates into the current screening run.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
                  Select job description
                </div>
                <Select value={selectedJd} onValueChange={(value) => value && setSelectedJd(value)}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/90">
                    <SelectValue placeholder="Choose a job description..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jds.map((jd) => (
                      <SelectItem key={jd.id} value={jd.id}>
                        {jd.title} - {jd.department || "No department"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {jds.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No job descriptions found. Create one first.</p>
                ) : null}
              </div>

              {selectedJob ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border-0 bg-indigo-50 text-indigo-700">
                      {selectedJob.experience_level} level
                    </Badge>
                    <Badge className="rounded-full border-0 bg-cyan-50 text-cyan-700">
                      {selectedJob.required_skills.length} skill{selectedJob.required_skills.length === 1 ? "" : "s"}
                    </Badge>
                    <Badge className="rounded-full border-0 bg-emerald-50 text-emerald-700">
                      min {selectedJob.min_experience_years} year{selectedJob.min_experience_years === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {selectedJob.description || "No detailed description entered yet."}
                  </p>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">2</span>
                  Select candidates
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {candidates.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                      No candidates found. Upload CVs first.
                    </div>
                  ) : (
                    candidates.map((candidate) => {
                      const checked = selectedCandidates.includes(candidate.id);

                      return (
                        <label
                          key={candidate.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-[1.5rem] border px-4 py-3 transition-all ${
                            checked
                              ? "border-indigo-200 bg-indigo-50/70 shadow-sm"
                              : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCandidate(candidate.id)}
                            className="rounded accent-indigo-500"
                          />
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-xs font-bold text-white">
                            {candidate.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{candidate.name || "Unnamed candidate"}</p>
                            <p className="truncate text-xs text-slate-500">{candidate.email || "No email detected"}</p>
                          </div>
                          {checked ? (
                            <Badge className="rounded-full border-0 bg-indigo-100 text-indigo-700">In batch</Badge>
                          ) : null}
                        </label>
                      );
                    })
                  )}
                </div>
                {candidates.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 rounded-xl text-xs text-slate-600"
                    onClick={() =>
                      setSelectedCandidates(
                        selectedCandidates.length === candidates.length ? [] : candidates.map((candidate) => candidate.id)
                      )
                    }
                  >
                    {selectedCandidates.length === candidates.length ? "Clear all" : "Select all candidates"}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="soft-panel border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Selection summary</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    {selectedCandidates.length} candidate{selectedCandidates.length === 1 ? "" : "s"} queued
                  </h3>
                </div>
                <ScoreCircle
                  score={selectedCandidates.length > 0 && selectedJd ? 100 : selectedCandidates.length > 0 || selectedJd ? 50 : 0}
                  size="lg"
                />
              </div>

              <Separator className="my-5" />

              <div className="space-y-3">
                {[
                  {
                    label: "Job description selected",
                    done: Boolean(selectedJd),
                  },
                  {
                    label: "At least one candidate selected",
                    done: selectedCandidates.length > 0,
                  },
                  {
                    label: "Provider ready",
                    done: health?.status === "healthy",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <Badge
                      className={
                        item.done
                          ? "rounded-full border-0 bg-emerald-100 text-emerald-700"
                          : "rounded-full border-0 bg-amber-100 text-amber-700"
                      }
                    >
                      {item.done ? "Ready" : "Waiting"}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleScreen}
                disabled={!selectedJd || selectedCandidates.length === 0 || screening}
                className="mt-5 h-12 w-full rounded-2xl border-0 gradient-blue text-white shadow-lg shadow-indigo-200"
              >
                {screening ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Screening in progress...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run AI screening
                  </>
                )}
              </Button>

              {selectedCandidateCards.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedCandidateCards.slice(0, 6).map((candidate) => (
                    <Badge key={candidate.id} className="rounded-full border-0 bg-slate-100 text-slate-700">
                      {candidate.name || "Candidate"}
                    </Badge>
                  ))}
                  {selectedCandidateCards.length > 6 ? (
                    <Badge className="rounded-full border-0 bg-slate-100 text-slate-700">
                      +{selectedCandidateCards.length - 6} more
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="soft-panel border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">Stored results for this JD</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Existing results load automatically when you change the job description.
                  </p>
                </div>
                <Badge className="rounded-full border-0 bg-slate-900 text-white">
                  {resultsLoading ? "Loading" : sortedResults.length}
                </Badge>
              </div>

              {resultsLoading ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                  Fetching screening history...
                </div>
              ) : sortedResults.length === 0 ? (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/75 p-5 text-sm text-slate-500">
                  No screening results for the current JD yet. Run a batch to populate this panel.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {sortedResults.slice(0, 4).map((result, index) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          #{index + 1} {result.candidate?.name || "Candidate"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {result.ai_analysis.summary || "Stored screening result"}
                        </p>
                      </div>
                      <ScoreCircle score={result.overall_score} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Screening results</h3>
            <p className="text-sm text-slate-500">
              Ranked output with score breakdown, summary, and flags from the active AI model.
            </p>
          </div>
          {loading ? (
            <Badge className="rounded-full border-0 bg-slate-100 text-slate-700">Loading workspace</Badge>
          ) : null}
        </div>

        {sortedResults.length === 0 ? (
          <Card className="soft-panel border-0">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Radar className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-slate-500">
                Select a JD to review existing results, or run a new screening batch to generate them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sortedResults.map((result, index) => (
              <Card key={result.id} className="soft-panel border-0 transition hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{result.candidate?.name || "Candidate"}</p>
                        <p className="text-xs text-slate-500">{result.candidate?.email || "No email detected"}</p>
                      </div>
                    </div>
                    <ScoreCircle score={result.overall_score} />
                  </div>

                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {result.ai_analysis.summary || "No AI summary stored for this result."}
                  </p>

                  <div className="mt-4 space-y-2">
                    {[
                      { label: "Skills", score: result.skills_score },
                      { label: "Experience", score: result.experience_score },
                      { label: "Education", score: result.education_score },
                      { label: "Certifications", score: result.certification_score },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="w-24 text-xs text-slate-500">{item.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              item.score >= 75
                                ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                                : item.score >= 50
                                  ? "bg-gradient-to-r from-amber-400 to-orange-400"
                                  : "bg-gradient-to-r from-red-400 to-rose-400"
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold text-slate-700">
                          {item.score.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {(result.strengths.length > 0 || result.weaknesses.length > 0 || result.red_flags.length > 0) ? (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        {result.strengths.length > 0 ? (
                          <div>
                            <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Strengths
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.strengths.slice(0, 3).map((item, itemIndex) => (
                                <Badge key={`${result.id}-strength-${itemIndex}`} className="border-0 bg-emerald-50 text-emerald-700">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {result.weaknesses.length > 0 ? (
                          <div>
                            <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-amber-600">
                              <XCircle className="h-3 w-3" />
                              Weaknesses
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.weaknesses.slice(0, 3).map((item, itemIndex) => (
                                <Badge key={`${result.id}-weakness-${itemIndex}`} className="border-0 bg-amber-50 text-amber-700">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {result.red_flags.length > 0 ? (
                          <div>
                            <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              Red flags
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.red_flags.slice(0, 3).map((item, itemIndex) => (
                                <Badge key={`${result.id}-flag-${itemIndex}`} className="border-0 bg-red-50 text-red-700">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
