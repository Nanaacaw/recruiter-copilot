"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 75
      ? "from-emerald-400 to-cyan-400"
      : score >= 50
        ? "from-amber-400 to-orange-400"
        : "from-rose-400 to-red-500";
  const textColor =
    score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";

  return (
    <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${color} p-[3px]`}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
        <span className={`text-base font-bold ${textColor}`}>{score.toFixed(0)}</span>
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
    setSelectedCandidates((current) =>
      current.includes(id)
        ? current.filter((candidateId) => candidateId !== id)
        : [...current, id]
    );
  };

  const selectedJob = jds.find((jd) => jd.id === selectedJd);
  const selectedCandidateCards = candidates.filter((candidate) => selectedCandidates.includes(candidate.id));
  const sortedResults = [...results].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="page-shell">
      <section className="hero-mesh soft-panel overflow-hidden rounded-[2rem] border-0">
        <div className="flex flex-col gap-6 p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <Radar className="h-3.5 w-3.5 text-indigo-600" />
                Screening workspace
              </div>

              <div>
                <h1 className="max-w-4xl text-3xl font-semibold text-slate-900 md:text-4xl">
                  Keep screening simple: pick one role, pick the candidate batch, then review the shortlist.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  The layout is now more linear so HR can move in a 1-2-3 flow without jumping across too many cards.
                  Stored results still load automatically when you switch job descriptions.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-cyan-700">
                  <Bot className="mr-1.5 h-3.5 w-3.5" />
                  {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
                </Badge>
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  {selectedCandidates.length} candidate{selectedCandidates.length === 1 ? "" : "s"} selected
                </Badge>
                <Badge className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-slate-700">
                  {sortedResults.length} stored result{sortedResults.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[460px]">
              <Card className="border-0 bg-white/80 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Step 1</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedJob ? selectedJob.title : "Pick a role"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Step 2</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedCandidates.length} candidate{selectedCandidates.length === 1 ? "" : "s"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Provider</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {health?.status === "healthy" ? "Ready" : "Checking"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
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
                  Requests run sequentially with retry and backoff to reduce rate-limit pressure.
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <Card className="soft-panel border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  1
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Pick the job description</h2>
                  <p className="text-sm text-slate-500">Use one role per batch so the ranking stays clear.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
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

                {selectedJob ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full border-0 bg-indigo-50 text-indigo-700">
                        {selectedJob.experience_level} level
                      </Badge>
                      <Badge className="rounded-full border-0 bg-cyan-50 text-cyan-700">
                        {selectedJob.required_skills.length} skill{selectedJob.required_skills.length === 1 ? "" : "s"}
                      </Badge>
                      <Badge className="rounded-full border-0 bg-emerald-50 text-emerald-700">
                        {selectedJob.min_experience_years}+ year{selectedJob.min_experience_years === 1 ? "" : "s"} min
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {selectedJob.description || "No detailed description entered yet."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/75 p-5 text-sm text-slate-500">
                    No job description selected yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="soft-panel border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                  2
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Choose candidates for this run</h2>
                  <p className="text-sm text-slate-500">Keep the list tight first, then expand after the first pass looks right.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {candidates.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/75 p-5 text-sm text-slate-500">
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
                            : "border-slate-200/70 bg-white/75 hover:bg-white"
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
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {candidate.name || "Unnamed candidate"}
                          </p>
                          <p className="truncate text-xs text-slate-500">{candidate.email || "No email detected"}</p>
                        </div>
                        {checked ? (
                          <Badge className="rounded-full border-0 bg-indigo-100 text-indigo-700">Selected</Badge>
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
                  className="mt-4 rounded-xl text-xs text-slate-600"
                  onClick={() =>
                    setSelectedCandidates(
                      selectedCandidates.length === candidates.length
                        ? []
                        : candidates.map((candidate) => candidate.id)
                    )
                  }
                >
                  {selectedCandidates.length === candidates.length ? "Clear all" : "Select all candidates"}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="soft-panel border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  3
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Review and run</h2>
                  <p className="text-sm text-slate-500">Make sure the basics are ready, then start the batch.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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
                    label: "AI provider ready",
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
                className="mt-5 h-12 w-full rounded-2xl border-0 gradient-blue text-white shadow-lg shadow-blue-200"
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
                  <h3 className="text-xl font-semibold text-slate-900">Stored results for this role</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    A quick view of the shortlist already saved for the selected job description.
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
                  No screening results for this job description yet.
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
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Screening results</h2>
            <p className="text-sm text-slate-500">
              Results are shown in a simpler reading order: summary first, score breakdown second, follow-up notes last.
            </p>
          </div>
          {loading ? (
            <Badge className="w-fit rounded-full border-0 bg-slate-100 text-slate-700">Loading workspace</Badge>
          ) : null}
        </div>

        {sortedResults.length === 0 ? (
          <Card className="soft-panel border-0">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Radar className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-slate-500">
                Select a job description to review existing results, or run a new screening batch to generate them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedResults.map((result, index) => (
              <Card key={result.id} className="soft-panel border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="rounded-full border-0 bg-slate-900 text-white">Rank #{index + 1}</Badge>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {result.candidate?.name || "Candidate"}
                        </h3>
                        <span className="text-sm text-slate-500">{result.candidate?.email || "No email detected"}</span>
                      </div>

                      <p className="mt-4 rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                        {result.ai_analysis.summary || "No AI summary stored for this result."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white/85 px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Overall score</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">Screening fit</p>
                      </div>
                      <ScoreCircle score={result.overall_score} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: "Skills", score: result.skills_score },
                      { label: "Experience", score: result.experience_score },
                      { label: "Education", score: result.education_score },
                      { label: "Certifications", score: result.certification_score },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{item.score.toFixed(0)}</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              item.score >= 75
                                ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                                : item.score >= 50
                                  ? "bg-gradient-to-r from-amber-400 to-orange-400"
                                  : "bg-gradient-to-r from-rose-400 to-red-500"
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-4">
                      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Strengths
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.strengths.length > 0 ? (
                          result.strengths.slice(0, 4).map((item, itemIndex) => (
                            <Badge key={`${result.id}-strength-${itemIndex}`} className="rounded-full border-0 bg-white text-emerald-700">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-emerald-800/70">No major strengths recorded.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4">
                      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-700">
                        <XCircle className="h-4 w-4" />
                        Needs follow-up
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.weaknesses.length > 0 ? (
                          result.weaknesses.slice(0, 4).map((item, itemIndex) => (
                            <Badge key={`${result.id}-weakness-${itemIndex}`} className="rounded-full border-0 bg-white text-amber-700">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-amber-800/70">No major weaknesses recorded.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/70 p-4">
                      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-700">
                        <AlertTriangle className="h-4 w-4" />
                        Red flags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.red_flags.length > 0 ? (
                          result.red_flags.slice(0, 4).map((item, itemIndex) => (
                            <Badge key={`${result.id}-flag-${itemIndex}`} className="rounded-full border-0 bg-white text-rose-700">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-rose-800/70">No red flags recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                      <p className="text-sm font-semibold text-slate-900">Matched skills</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.matched_skills.length > 0 ? (
                          result.matched_skills.slice(0, 6).map((item, itemIndex) => (
                            <Badge key={`${result.id}-matched-${itemIndex}`} className="rounded-full border-0 bg-cyan-50 text-cyan-700">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No matched skills stored.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                      <p className="text-sm font-semibold text-slate-900">Missing skills</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.missing_skills.length > 0 ? (
                          result.missing_skills.slice(0, 6).map((item, itemIndex) => (
                            <Badge key={`${result.id}-missing-${itemIndex}`} className="rounded-full border-0 bg-slate-100 text-slate-700">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No missing skills stored.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
