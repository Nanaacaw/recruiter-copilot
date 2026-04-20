"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { JobDescription, Screening } from "@/types";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  Medal,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
  if (score >= 75) {
    return <Badge className="rounded-full border-0 bg-emerald-100 text-emerald-700">Strong</Badge>;
  }
  if (score >= 50) {
    return <Badge className="rounded-full border-0 bg-amber-100 text-amber-700">Moderate</Badge>;
  }
  return <Badge className="rounded-full border-0 bg-rose-100 text-rose-700">Weak</Badge>;
}

function MiniBar({ score }: { score: number }) {
  const color =
    score >= 75
      ? "from-emerald-400 to-cyan-400"
      : score >= 50
        ? "from-amber-400 to-orange-400"
        : "from-rose-400 to-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-slate-700">{score.toFixed(0)}</span>
    </div>
  );
}

export default function RankingPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedJd, setSelectedJd] = useState("");
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);

  useEffect(() => {
    api
      .getJobDescriptions()
      .then(setJds)
      .catch(() => setJds([]));
  }, []);

  useEffect(() => {
    if (!selectedJd) {
      return;
    }

    let ignore = false;

    api
      .getScreeningsForJd(selectedJd)
      .then((data) => {
        if (!ignore) setScreenings(data);
      })
      .catch(() => {
        if (!ignore) setScreenings([]);
      });

    return () => {
      ignore = true;
    };
  }, [selectedJd]);

  const sortedScreenings = [...screenings].sort((a, b) => b.overall_score - a.overall_score);
  const selectedJob = jds.find((jd) => jd.id === selectedJd);
  const selectedJobLabel = selectedJob
    ? `${selectedJob.title}${selectedJob.department ? ` - ${selectedJob.department}` : ""}`
    : undefined;

  const getScoreColor = (score: number) =>
    score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";

  const getMedalGradient = (index: number) => {
    if (index === 0) return "from-amber-300 to-yellow-500";
    if (index === 1) return "from-slate-300 to-slate-500";
    if (index === 2) return "from-amber-500 to-orange-600";
    return "from-sky-300 to-blue-500";
  };

  return (
    <div className="page-shell space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-sky-100/90 bg-white/90 shadow-[0_18px_52px_rgba(96,165,250,0.14)] sm:rounded-[2.25rem]">
        <div className="absolute inset-0 hero-mesh" />
        <div className="absolute inset-0 blueprint-grid opacity-50" />
        <div className="relative grid gap-6 p-4 sm:p-6 xl:grid-cols-[1.12fr_0.88fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Ranking board
            </div>

            <div>
              <h1 className="max-w-4xl text-2xl font-semibold text-slate-900 sm:text-3xl md:text-4xl">
                A cleaner ranking view for comparing candidates and spotting who should move forward first.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                The page is now arranged more like a decision board: pick the role, see the top performers, then review the full shortlist in cards that are easier to scan than a dense grid.
              </p>
            </div>

            <div className="max-w-xl space-y-2">
              <p className="text-sm font-medium text-slate-600">Select job description</p>
              <Select value={selectedJd} onValueChange={(value) => value && setSelectedJd(value)}>
                <SelectTrigger className="h-12 w-full rounded-2xl border-sky-100 bg-white/90">
                  <SelectValue placeholder="Choose a position..." className="min-w-0 truncate">
                    {selectedJobLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {jds.map((jd) => (
                    <SelectItem key={jd.id} value={jd.id}>
                      {jd.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="sky-card rounded-[1.75rem] border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Ranking volume</p>
                    <p className="mt-2 text-4xl font-semibold text-slate-900">{selectedJd ? sortedScreenings.length : 0}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 shadow-lg shadow-sky-200">
                    <Medal className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {selectedJob
                    ? `Candidates already screened against ${selectedJob.title}.`
                    : "Pick a job description first to activate the ranking board."}
                </p>
              </CardContent>
            </Card>

            <Card className="soft-panel rounded-[1.75rem] border-0">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-semibold text-slate-900">Decision posture</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedJob?.title || "No role selected"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Best candidate score</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {sortedScreenings[0] ? sortedScreenings[0].overall_score.toFixed(0) : "No result yet"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!selectedJd || sortedScreenings.length === 0}
                    className="h-12 w-full rounded-2xl border-sky-100 bg-white/88"
                    onClick={() => api.exportExcel(selectedJd)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {!selectedJd ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <BarChart3 className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">Select a job description to activate the ranking board.</p>
          </CardContent>
        </Card>
      ) : sortedScreenings.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No screening results yet. Screen candidates first, then return here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            {sortedScreenings.slice(0, 3).map((screening, index) => (
              <Card
                key={screening.id}
                className={`sky-card rounded-[1.85rem] border-0 ${index === 0 ? "shadow-[0_18px_48px_rgba(250,204,21,0.24)]" : ""}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${getMedalGradient(index)} text-sm font-bold text-white shadow-lg`}>
                      {index + 1}
                    </div>
                    <Trophy className={`h-5 w-5 ${index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : "text-orange-500"}`} />
                  </div>

                  <div className="mt-5">
                    <p className="text-lg font-semibold text-slate-900">{screening.candidate?.name || "Candidate"}</p>
                    <p className="truncate text-sm text-slate-500">{screening.candidate?.email || "No email detected"}</p>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-sky-100 bg-white/88 p-4">
                    <p className={`text-4xl font-semibold ${getScoreColor(screening.overall_score)}`}>
                      {screening.overall_score.toFixed(0)}
                    </p>
                    <div className="mt-2">
                      <ScoreBadge score={screening.overall_score} />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      { label: "Skills", score: screening.skills_score },
                      { label: "Experience", score: screening.experience_score },
                      { label: "Education", score: screening.education_score },
                      { label: "Certifications", score: screening.certification_score },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{item.label}</span>
                          <span>{item.score.toFixed(0)}</span>
                        </div>
                        <MiniBar score={item.score} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Full shortlist</h2>
                <p className="text-sm text-slate-500">
                  Read each candidate card top to bottom: score first, dimension breakdown second, reasons last.
                </p>
              </div>
              <Badge className="rounded-full border-0 bg-sky-50 px-3 py-1.5 text-sky-700">
                {sortedScreenings.length} candidate{sortedScreenings.length === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="space-y-4">
              {sortedScreenings.map((screening, index) => (
                <Card key={screening.id} className="soft-panel rounded-[1.85rem] border-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="rounded-full border-0 bg-slate-900 text-white">Rank #{index + 1}</Badge>
                          <p className="text-xl font-semibold text-slate-900">
                            {screening.candidate?.name || "Candidate"}
                          </p>
                          <p className="text-sm text-slate-500">{screening.candidate?.email || "No email detected"}</p>
                        </div>

                        <p className="mt-4 rounded-[1.5rem] border border-sky-100 bg-white/88 px-4 py-4 text-sm leading-7 text-slate-600">
                          {screening.ai_analysis.summary || "No summary stored for this result."}
                        </p>
                      </div>

                      <div className="w-full rounded-[1.5rem] border border-sky-100 bg-white/90 px-5 py-4 shadow-sm sm:w-auto">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Overall score</p>
                        <p className={`mt-2 text-4xl font-semibold ${getScoreColor(screening.overall_score)}`}>
                          {screening.overall_score.toFixed(0)}
                        </p>
                        <div className="mt-2">
                          <ScoreBadge score={screening.overall_score} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: "Skills", score: screening.skills_score },
                        { label: "Experience", score: screening.experience_score },
                        { label: "Education", score: screening.education_score },
                        { label: "Certifications", score: screening.certification_score },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[1.4rem] border border-sky-100 bg-white/88 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                          <p className={`mt-2 text-2xl font-semibold ${getScoreColor(item.score)}`}>
                            {item.score.toFixed(0)}
                          </p>
                          <div className="mt-3">
                            <MiniBar score={item.score} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
                      <div className="rounded-[1.5rem] border border-sky-100 bg-white/88 p-4">
                        <p className="text-sm font-semibold text-slate-900">Matched skills</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {screening.matched_skills?.length > 0 ? (
                            screening.matched_skills.slice(0, 5).map((skill, skillIndex) => (
                              <Badge key={`${screening.id}-matched-${skillIndex}`} className="rounded-full border-0 bg-emerald-50 text-emerald-700">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No matched skills stored.</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-sky-100 bg-white/88 p-4">
                        <p className="text-sm font-semibold text-slate-900">Missing skills</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {screening.missing_skills?.length > 0 ? (
                            screening.missing_skills.slice(0, 5).map((skill, skillIndex) => (
                              <Badge key={`${screening.id}-missing-${skillIndex}`} className="rounded-full border-0 bg-slate-100 text-slate-700">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No missing skills stored.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:justify-start">
                        <Button
                          variant="outline"
                          className="h-11 rounded-2xl border-sky-100 bg-white/88"
                          onClick={() => setSelectedScreening(screening)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 rounded-2xl border-sky-100 bg-white/88"
                          onClick={() => api.exportPdf(screening.id)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <Dialog open={!!selectedScreening} onOpenChange={() => setSelectedScreening(null)}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[1.75rem] border border-sky-100 bg-white p-0 sm:max-h-[88vh] sm:max-w-3xl">
          <DialogHeader className="border-b border-sky-100 bg-sky-50/60 px-4 py-4 sm:px-6 sm:py-5">
            <DialogTitle className="flex items-center gap-3 text-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 text-sm font-bold text-white">
                {selectedScreening?.candidate?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {selectedScreening?.candidate?.name || "Candidate analysis"}
            </DialogTitle>
          </DialogHeader>

          {selectedScreening ? (
            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { label: "Overall", score: selectedScreening.overall_score },
                  { label: "Skills", score: selectedScreening.skills_score },
                  { label: "Experience", score: selectedScreening.experience_score },
                  { label: "Education", score: selectedScreening.education_score },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-sky-100 bg-sky-50/70 p-4 text-center">
                    <p className={`text-2xl font-semibold ${getScoreColor(item.score)}`}>{item.score.toFixed(0)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {selectedScreening.matched_skills?.length > 0 ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Matched skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScreening.matched_skills.map((skill, index) => (
                      <Badge key={`${skill}-${index}`} className="rounded-full border-0 bg-emerald-50 text-emerald-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedScreening.missing_skills?.length > 0 ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                    <XCircle className="h-4 w-4" />
                    Missing skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScreening.missing_skills.map((skill, index) => (
                      <Badge key={`${skill}-${index}`} className="rounded-full border-0 bg-rose-50 text-rose-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedScreening.strengths?.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-900">Strengths</p>
                  <ul className="space-y-2">
                    {selectedScreening.strengths.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedScreening.weaknesses?.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-900">Weaknesses</p>
                  <ul className="space-y-2">
                    {selectedScreening.weaknesses.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-600">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedScreening.red_flags?.length > 0 ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                    Red flags
                  </p>
                  <ul className="space-y-2">
                    {selectedScreening.red_flags.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-600">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
