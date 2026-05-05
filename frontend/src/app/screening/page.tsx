"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
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
  Warning,
  Robot,
  CheckCircle,
  Clock,
  SpinnerGap,
  Target,
  Sparkle,
  Users,
  XCircle,
} from "@phosphor-icons/react";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Screening request failed. Please try again.";
}

function ScoreCircle({ score }: { score: number }) {
  const colorClass =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-rose-500";
  const textColor =
    score >= 75 ? "text-emerald-700" : score >= 50 ? "text-amber-700" : "text-rose-700";

  return (
    <div className={`h-16 w-16 rounded-full ${colorClass} p-1 shadow-sm`}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/90">
        <span className={`text-xl font-bold ${textColor}`}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
}

function scoreTone(score: number) {
  if (score >= 75) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 50) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function ScoreSummaryPill({ score }: { score: number }) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 shadow-sm ${scoreTone(score)}`}
      aria-label={`Overall score ${score.toFixed(0)}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">Score</span>
      <span className="text-xl font-bold leading-none">{score.toFixed(0)}</span>
    </div>
  );
}

function InsightTag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "emerald" | "amber" | "rose" | "cyan" | "slate";
}) {
  const toneClass = {
    emerald: "bg-emerald-50/80 border border-emerald-200 text-emerald-700 shadow-sm",
    amber: "bg-amber-50/80 border border-amber-200 text-amber-700 shadow-sm",
    rose: "bg-rose-50/80 border border-rose-200 text-rose-700 shadow-sm",
    cyan: "bg-cyan-50/80 border border-cyan-200 text-cyan-700 shadow-sm",
    slate: "bg-slate-50/80 border border-slate-200 text-slate-700 shadow-sm",
  }[tone];

  return (
    <Badge
      className={`h-auto max-w-full shrink overflow-visible whitespace-normal break-words rounded-xl px-3 py-1.5 text-left leading-5 ${toneClass} font-mono text-[10px] uppercase`}
    >
      {children}
    </Badge>
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
  const selectedJobLabel = selectedJob
    ? `${selectedJob.title}${selectedJob.department ? ` - ${selectedJob.department}` : ""}`
    : undefined;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="page-shell space-y-12 sm:space-y-16">
      <motion.section variants={itemVariants} className="glass-panel overflow-hidden relative">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:p-4">
          <div className="flex flex-col gap-10 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                <Target className="h-3.5 w-3.5 text-foreground" />
                Screening workspace
              </div>

              <div>
                <h1 className="max-w-4xl font-heading text-4xl tracking-tighter text-foreground sm:text-5xl md:text-6xl leading-[1.1]">
                  Keep screening simple: pick one role, pick the candidate batch, then review the shortlist.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                  The layout is now more linear so HR can move in a 1-2-3 flow without jumping across too many cards.
                  Stored results still load automatically when you switch job descriptions.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="badge-pale-blue rounded-md border-0 px-3 py-1.5 text-[11px] uppercase tracking-widest font-mono">
                  <Robot className="mr-1.5 h-3.5 w-3.5" weight="fill" />
                  {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
                </Badge>
                <Badge className="badge-pale-green rounded-md border-0 px-3 py-1.5 text-[11px] uppercase tracking-widest font-mono">
                  <Users className="mr-1.5 h-3.5 w-3.5" weight="fill" />
                  {selectedCandidates.length} candidate{selectedCandidates.length === 1 ? "" : "s"} selected
                </Badge>
                <Badge className="badge-pale-yellow rounded-md border-0 px-3 py-1.5 text-[11px] uppercase tracking-widest font-mono">
                  {sortedResults.length} stored result{sortedResults.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3 xl:w-[500px]">
              <div className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono font-semibold">Step 1</p>
                <p className="mt-3 text-base font-bold text-slate-900 leading-tight">
                  {selectedJob ? selectedJob.title : "Pick a role"}
                </p>
              </div>
              <div className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono font-semibold">Step 2</p>
                <p className="mt-3 text-base font-bold text-slate-900 leading-tight">
                  {selectedCandidates.length} candidate{selectedCandidates.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono font-semibold">Provider</p>
                <p className="mt-3 text-base font-bold text-slate-900 leading-tight">
                  {health?.status === "healthy" ? "Ready" : "Checking"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {errorMessage ? (
        <Alert className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md">
          <Warning className="h-4 w-4" />
          <AlertTitle className="font-heading">Screening request failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {screening ? (
        <motion.div variants={itemVariants} className="glass-panel bg-primary/5 border-primary/20">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-heading text-xl font-semibold text-foreground">AI screening in progress</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Requests run sequentially with retry and backoff to reduce rate-limit pressure.
              </p>
            </div>
            <Badge className="badge-pale-blue rounded-md border-0 font-mono">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Processing batch
            </Badge>
          </div>
          <div className="mt-8">
            <Progress value={68} className="bg-white/50 h-2 [&>div]:bg-primary" />
          </div>
        </motion.div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
        <div className="min-w-0 space-y-8">
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-sm font-mono">
                1
              </span>
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">Pick the job description</h2>
                <p className="text-sm text-muted-foreground mt-1">Use one role per batch so the ranking stays clear.</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Select value={selectedJd} onValueChange={(value) => value && setSelectedJd(value)}>
                <SelectTrigger className="h-14 w-full rounded-xl border-white/50 bg-white/50 shadow-sm">
                  <SelectValue placeholder="Choose a job description..." className="min-w-0 truncate text-base">
                    {selectedJobLabel}
                  </SelectValue>
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
                <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-xl font-semibold text-foreground">{selectedJob.title}</p>
                    <p className="truncate text-sm text-muted-foreground mt-1">
                      {selectedJob.department || "No department set"}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="badge-pale-blue rounded-md border-0 font-mono text-[10px] uppercase">
                      {selectedJob.experience_level} level
                    </Badge>
                    <Badge className="badge-pale-green rounded-md border-0 font-mono text-[10px] uppercase">
                      {selectedJob.required_skills.length} skill{selectedJob.required_skills.length === 1 ? "" : "s"}
                    </Badge>
                    <Badge className="badge-pale-yellow rounded-md border-0 font-mono text-[10px] uppercase">
                      {selectedJob.min_experience_years}+ year{selectedJob.min_experience_years === 1 ? "" : "s"} min
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-3xl">
                    {selectedJob.description || "No detailed description entered yet."}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-white/30 p-6 text-sm text-muted-foreground text-center">
                  No job description selected yet.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-sm font-mono">
                2
              </span>
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">Choose candidates for this run</h2>
                <p className="text-sm text-muted-foreground mt-1">Keep the list tight first, then expand after the first pass looks right.</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {candidates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-white/30 p-6 text-sm text-muted-foreground text-center">
                  No candidates found. Upload CVs first.
                </div>
              ) : (
                candidates.map((candidate) => {
                  const checked = selectedCandidates.includes(candidate.id);

                  return (
                    <label
                      key={candidate.id}
                      className={`flex cursor-pointer flex-col items-start gap-4 rounded-2xl border px-6 py-5 transition-all sm:flex-row sm:items-center shadow-sm hover:-translate-y-0.5 ${
                        checked
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-white/50 bg-white/40 hover:bg-white/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCandidate(candidate.id)}
                        className="h-5 w-5 rounded-md border-white/50 accent-primary"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm font-mono">
                        {candidate.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-lg font-medium text-foreground">
                          {candidate.name || "Unnamed candidate"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground mt-1">{candidate.email || "No email detected"}</p>
                      </div>
                      <div className="w-full sm:w-auto">
                        {checked ? (
                          <Badge className="badge-pale-green rounded-md border-0 font-mono text-[10px] uppercase">Selected</Badge>
                        ) : null}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {candidates.length > 0 ? (
              <button
                className="mt-6 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() =>
                  setSelectedCandidates(
                    selectedCandidates.length === candidates.length
                      ? []
                      : candidates.map((candidate) => candidate.id)
                  )
                }
              >
                {selectedCandidates.length === candidates.length ? "Clear all" : "Select all candidates"}
              </button>
            ) : null}
          </motion.div>
        </div>

        <div className="w-full min-w-0 space-y-8 xl:sticky xl:top-24 xl:self-start xl:justify-self-end">
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-300 w-full">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-sm font-mono">
                3
              </span>
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">Review and run</h2>
                <p className="text-sm text-muted-foreground mt-1">Make sure the basics are ready, then start the batch.</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
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
                <div key={item.label} className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <Badge
                    className={
                      item.done
                        ? "badge-pale-green rounded-md border-0 font-mono text-[10px] uppercase"
                        : "badge-pale-yellow rounded-md border-0 font-mono text-[10px] uppercase"
                    }
                  >
                    {item.done ? "Ready" : "Waiting"}
                  </Badge>
                </div>
              ))}
            </div>

            <button
              onClick={handleScreen}
              disabled={!selectedJd || selectedCandidates.length === 0 || screening}
              className="premium-button mt-8 h-14 w-full flex items-center justify-center px-4"
            >
              {screening ? (
                <>
                  <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                  Screening in progress...
                </>
              ) : (
                <>
                  <Sparkle className="mr-2 h-4 w-4" weight="fill" />
                  Run AI screening
                </>
              )}
            </button>

            {selectedCandidateCards.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedCandidateCards.slice(0, 6).map((candidate) => (
                  <Badge key={candidate.id} className="badge-pale-blue rounded-md border-0 font-mono text-[10px] uppercase">
                    {candidate.name || "Candidate"}
                  </Badge>
                ))}
                {selectedCandidateCards.length > 6 ? (
                  <Badge className="badge-pale-blue rounded-md border-0 font-mono text-[10px] uppercase">
                    +{selectedCandidateCards.length - 6} more
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-300 w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-heading text-xl font-semibold text-foreground">Stored results for this role</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  A quick view of the shortlist already saved for the selected job description.
                </p>
              </div>
              <Badge className="rounded-md border-0 bg-foreground text-background font-mono px-3 py-1">
                {resultsLoading ? "Loading" : sortedResults.length}
              </Badge>
            </div>

            {resultsLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center">
                <SpinnerGap className="mb-4 h-6 w-6 animate-spin" />
                Fetching screening history...
              </div>
            ) : sortedResults.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-primary/20 bg-white/30 p-8 text-sm text-muted-foreground text-center">
                No screening results for this job description yet.
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {sortedResults.slice(0, 4).map((result, index) => (
                  <div
                    key={result.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/50 bg-white/40 px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between hover:bg-white transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-base font-semibold text-foreground">
                        #{index + 1} {result.candidate?.name || "Candidate"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {result.ai_analysis.summary || "Stored screening result"}
                      </p>
                    </div>
                    <ScoreSummaryPill score={result.overall_score} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <section>
        <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold text-foreground">Screening results</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Results are shown in a simpler reading order: summary first, score breakdown second, follow-up notes last.
            </p>
          </div>
          {loading ? (
            <Badge className="badge-pale-yellow rounded-md border-0 font-mono text-[10px] uppercase">Loading workspace</Badge>
          ) : null}
        </div>

        {sortedResults.length === 0 ? (
          <motion.div variants={itemVariants} className="glass-panel mt-8 py-24 text-center flex flex-col items-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/50 shadow-sm border border-white/60">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Select a job description to review existing results, or run a new screening batch to generate them.
            </p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="mt-8 space-y-8">
            <AnimatePresence>
            {sortedResults.map((result, index) => (
              <motion.div layout layoutId={`result-${result.id}`} variants={itemVariants} key={result.id} className="rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all duration-300">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-4">
                      <Badge className="rounded-md border-0 bg-foreground text-background font-mono px-2 py-1 text-xs">Rank #{index + 1}</Badge>
                      <h3 className="font-heading text-3xl font-semibold text-foreground">
                        {result.candidate?.name || "Candidate"}
                      </h3>
                      <span className="text-sm text-muted-foreground">{result.candidate?.email || "No email detected"}</span>
                    </div>

                    <p className="mt-6 rounded-2xl border border-white/50 bg-white/40 px-6 py-5 text-sm leading-relaxed text-muted-foreground max-w-3xl shadow-inner">
                      {result.ai_analysis.summary || "No AI summary stored for this result."}
                    </p>
                  </div>

                  <div className="flex w-full items-center gap-5 rounded-2xl border border-white/50 bg-white/50 px-6 py-5 shadow-sm sm:w-auto">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Overall score</p>
                      <p className="mt-2 text-sm font-medium text-foreground">Screening fit</p>
                    </div>
                    <ScoreCircle score={result.overall_score} />
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Skills", score: result.skills_score },
                    { label: "Experience", score: result.experience_score },
                    { label: "Education", score: result.education_score },
                    { label: "Certifications", score: result.certification_score },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono font-semibold">{item.label}</p>
                      <p className="mt-4 font-heading text-5xl font-bold text-slate-900">{item.score.toFixed(0)}</p>
                      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/50">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-3">
                  <div className="min-w-0 overflow-hidden rounded-[2rem] border border-emerald-200/50 bg-emerald-50/50 p-8 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
                    <p className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-emerald-800">
                      <CheckCircle className="h-6 w-6" />
                      Strengths
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.strengths.length > 0 ? (
                        result.strengths.slice(0, 4).map((item, itemIndex) => (
                            <InsightTag key={`${result.id}-strength-${itemIndex}`} tone="emerald">
                              {item}
                            </InsightTag>
                          ))
                      ) : (
                        <p className="text-sm text-emerald-800/70 font-medium">No major strengths recorded.</p>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-[2rem] border border-amber-200/50 bg-amber-50/50 p-8 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
                    <p className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-amber-800">
                      <Warning className="h-6 w-6" />
                      Needs follow-up
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.weaknesses.length > 0 ? (
                        result.weaknesses.slice(0, 4).map((item, itemIndex) => (
                            <InsightTag key={`${result.id}-weakness-${itemIndex}`} tone="amber">
                              {item}
                            </InsightTag>
                          ))
                      ) : (
                        <p className="text-sm text-amber-800/70 font-medium">No major weaknesses recorded.</p>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-[2rem] border border-rose-200/50 bg-rose-50/50 p-8 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
                    <p className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-rose-800">
                      <Warning className="h-6 w-6" />
                      Red flags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.red_flags.length > 0 ? (
                        result.red_flags.slice(0, 4).map((item, itemIndex) => (
                            <InsightTag key={`${result.id}-flag-${itemIndex}`} tone="rose">
                              {item}
                            </InsightTag>
                          ))
                      ) : (
                        <p className="text-sm text-rose-800/70 font-medium">No red flags recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-sm">
                    <p className="font-heading text-sm font-semibold text-foreground">Matched skills</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {result.matched_skills.length > 0 ? (
                        result.matched_skills.slice(0, 6).map((item, itemIndex) => (
                          <InsightTag key={`${result.id}-matched-${itemIndex}`} tone="cyan">
                            {item}
                          </InsightTag>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No matched skills stored.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-sm">
                    <p className="font-heading text-sm font-semibold text-foreground">Missing skills</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {result.missing_skills.length > 0 ? (
                        result.missing_skills.slice(0, 6).map((item, itemIndex) => (
                          <InsightTag key={`${result.id}-missing-${itemIndex}`} tone="slate">
                            {item}
                          </InsightTag>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No missing skills stored.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </motion.div>
  );
}
