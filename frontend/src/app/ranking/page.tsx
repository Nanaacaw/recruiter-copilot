"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Warning,
  ChartBar,
  CheckCircle,
  DownloadSimple,
  Eye,
  Medal,
  Sparkle,
  Trophy,
  XCircle,
} from "@phosphor-icons/react";

function ScoreBadge({ score }: { score: number }) {
  if (score >= 75) {
    return <Badge className="badge-pale-green rounded-md border-0 uppercase font-mono text-[10px] shadow-sm">Strong</Badge>;
  }
  if (score >= 50) {
    return <Badge className="badge-pale-yellow rounded-md border-0 uppercase font-mono text-[10px] shadow-sm">Moderate</Badge>;
  }
  return <Badge className="badge-pale-red rounded-md border-0 uppercase font-mono text-[10px] shadow-sm">Weak</Badge>;
}

function MiniBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3 mt-1">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: "spring" as const, stiffness: 60, damping: 15, delay: 0.2 }}
          className="h-full rounded-full bg-primary shadow-sm"
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-foreground font-mono">{score.toFixed(0)}</span>
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
      <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-10 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
              <Sparkle className="h-3.5 w-3.5 text-foreground" weight="fill" />
              Ranking board
            </div>

            <div>
              <h1 className="max-w-4xl font-heading text-4xl tracking-tighter text-foreground sm:text-5xl md:text-6xl leading-[1.1]">
                A cleaner ranking view for comparing candidates and spotting who should move forward first.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                The page is now arranged more like a decision board: pick the role, see the top performers, then review the full shortlist in cards that are easier to scan than a dense grid.
              </p>
            </div>

            <div className="max-w-xl space-y-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Select job description</p>
              <Select value={selectedJd} onValueChange={(value) => value && setSelectedJd(value)}>
                <SelectTrigger className="h-14 w-full rounded-xl border-white/50 bg-white/50 shadow-sm">
                  <SelectValue placeholder="Choose a position..." className="min-w-0 truncate text-base">
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

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Ranking volume</p>
                  <p className="mt-4 font-heading text-5xl font-semibold text-foreground">{selectedJd ? sortedScreenings.length : 0}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Medal className="h-7 w-7" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {selectedJob
                  ? `Candidates already screened against ${selectedJob.title}.`
                  : "Pick a job description first to activate the ranking board."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-sm">
              <p className="font-heading text-xl font-semibold text-foreground">Decision posture</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/50 bg-white/50 px-5 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Role</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {selectedJob?.title || "No role selected"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/50 bg-white/50 px-5 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Best candidate score</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {sortedScreenings[0] ? sortedScreenings[0].overall_score.toFixed(0) : "No result yet"}
                  </p>
                </div>
                <button
                  disabled={!selectedJd || sortedScreenings.length === 0}
                  className="premium-button w-full flex h-12 items-center justify-center px-4 text-sm font-medium mt-4"
                  onClick={() => api.exportExcel(selectedJd)}
                >
                  <DownloadSimple className="mr-2 h-4 w-4" />
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {!selectedJd ? (
        <motion.div variants={itemVariants} className="glass-panel py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/50 shadow-sm border border-white/60">
            <ChartBar className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Select a job description to activate the ranking board.</p>
        </motion.div>
      ) : sortedScreenings.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-panel py-24 text-center">
          <p className="text-muted-foreground">No screening results yet. Screen candidates first, then return here.</p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-12 sm:space-y-16">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
            <AnimatePresence>
            {/* RANK 1 - THE STAR */}
            {sortedScreenings[0] && (
              <motion.div
                layout
                layoutId={`top-${sortedScreenings[0].id}`}
                variants={itemVariants}
                key={sortedScreenings[0].id}
                className="glass-panel relative flex-1 ring-2 ring-primary/30 bg-primary/5 shadow-xl overflow-hidden group p-8 sm:p-10"
              >
                <motion.div 
                  className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold font-mono shadow-sm bg-primary text-primary-foreground">
                        1
                      </div>
                      <Trophy className="h-8 w-8 text-primary drop-shadow-sm" weight="fill" />
                    </div>

                    <div className="mt-8">
                      <p className="font-heading text-3xl font-semibold text-foreground">{sortedScreenings[0].candidate?.name || "Candidate"}</p>
                      <p className="text-base text-muted-foreground mt-1">{sortedScreenings[0].candidate?.email || "No email detected"}</p>
                    </div>

                    <div className="mt-8 rounded-3xl border border-primary/20 bg-white/60 p-8 flex flex-col items-start gap-3 shadow-sm backdrop-blur-md">
                      <p className="text-[11px] uppercase tracking-widest text-primary font-mono font-bold">Overall AI Match</p>
                      <p className="font-heading text-7xl font-bold text-foreground tracking-tighter">
                        {sortedScreenings[0].overall_score.toFixed(0)}
                      </p>
                      <ScoreBadge score={sortedScreenings[0].overall_score} />
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6">
                    {[
                      { label: "Skills", score: sortedScreenings[0].skills_score },
                      { label: "Experience", score: sortedScreenings[0].experience_score },
                      { label: "Education", score: sortedScreenings[0].education_score },
                      { label: "Certifications", score: sortedScreenings[0].certification_score },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                          <span>{item.label}</span>
                        </div>
                        <MiniBar score={item.score} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* RANK 2 & 3 */}
            {(sortedScreenings[1] || sortedScreenings[2]) && (
              <div className="flex-1 flex flex-col gap-6">
                {[sortedScreenings[1], sortedScreenings[2]].filter(Boolean).map((screening, index) => (
                  <motion.div
                    layout
                    layoutId={`top-${screening.id}`}
                    variants={itemVariants}
                    key={screening.id}
                    className="glass-panel flex-1 flex flex-col sm:flex-row gap-8 sm:items-center p-6 sm:p-8"
                  >
                    <div className="flex flex-col sm:w-[40%] min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold font-mono shadow-sm bg-white/80 text-foreground border border-white/60">
                          {index + 2}
                        </div>
                        <Medal className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-heading text-xl font-semibold text-foreground truncate">{screening.candidate?.name || "Candidate"}</p>
                      <p className="truncate text-xs text-muted-foreground mt-1">{screening.candidate?.email || "No email detected"}</p>
                      
                      <div className="mt-5 flex items-end gap-3">
                        <p className="font-heading text-4xl font-bold text-foreground tracking-tighter leading-none">
                          {screening.overall_score.toFixed(0)}
                        </p>
                        <div className="mb-1"><ScoreBadge score={screening.overall_score} /></div>
                      </div>
                    </div>

                    <div className="sm:w-[60%] grid grid-cols-2 gap-x-6 gap-y-5">
                      {[
                        { label: "Skills", score: screening.skills_score },
                        { label: "Experience", score: screening.experience_score },
                        { label: "Education", score: screening.education_score },
                        { label: "Certs", score: screening.certification_score },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                            <span>{item.label}</span>
                          </div>
                          <MiniBar score={item.score} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            </AnimatePresence>
          </div>

          <motion.div variants={itemVariants}>
            <div className="flex flex-col gap-4 border-b border-white/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-heading text-3xl font-semibold text-foreground">Full shortlist</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Read each candidate card top to bottom: score first, dimension breakdown second, reasons last.
                </p>
              </div>
              <Badge className="badge-pale-blue rounded-md border-0 font-mono">
                {sortedScreenings.length} candidate{sortedScreenings.length === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="mt-8 grid gap-6">
              <AnimatePresence>
              {sortedScreenings.map((screening, index) => (
                <motion.div 
                  layout 
                  layoutId={`list-${screening.id}`} 
                  variants={itemVariants} 
                  key={screening.id} 
                  className="rounded-[2rem] border border-white/60 bg-white/70 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:scale-[1.01] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out flex flex-col gap-8 xl:flex-row xl:items-center justify-between"
                >
                  <div className="flex items-start gap-6 min-w-0 xl:w-[40%]">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-100 font-mono text-2xl font-bold text-foreground shadow-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="truncate font-heading text-2xl font-bold text-foreground tracking-tight">{screening.candidate?.name || "Candidate"}</p>
                      <p className="truncate text-sm text-muted-foreground mt-1">{screening.candidate?.email || "No email detected"}</p>
                      {screening.ai_analysis?.summary && (
                        <p className="mt-4 text-sm leading-relaxed text-slate-500 line-clamp-2">
                          {screening.ai_analysis.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-8 xl:w-[60%] border-t border-slate-100/50 xl:border-t-0 xl:border-l xl:pl-8 pt-6 xl:pt-0">
                    <div className="w-full sm:w-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                      {[
                        { label: "Skills", score: screening.skills_score },
                        { label: "Experience", score: screening.experience_score },
                        { label: "Education", score: screening.education_score },
                        { label: "Certs", score: screening.certification_score },
                      ].map((item) => (
                        <div key={item.label} className="flex flex-col">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mb-2">{item.label}</span>
                          <MiniBar score={item.score} />
                        </div>
                      ))}
                    </div>
                    
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 sm:pl-6 sm:border-l sm:border-slate-100/50">
                      <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                        <p className="font-heading text-5xl font-bold tracking-tighter text-foreground leading-none">{screening.overall_score.toFixed(0)}</p>
                        <ScoreBadge score={screening.overall_score} />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm"
                          onClick={() => setSelectedScreening(screening)}
                          aria-label="View Details"
                        >
                          <Eye className="h-4 w-4" weight="bold" />
                        </button>
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors shadow-sm"
                          onClick={() => api.exportPdf(screening.id)}
                          aria-label="Export PDF"
                        >
                          <DownloadSimple className="h-4 w-4" weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}

      <Dialog open={!!selectedScreening} onOpenChange={() => setSelectedScreening(null)}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[2.5rem] border border-white/80 bg-[#f9fafb] p-0 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] sm:max-h-[90vh] sm:max-w-4xl lg:max-w-5xl">
          <DialogTitle className="sr-only">Candidate Profile Details</DialogTitle>
          {selectedScreening && (
            <div className="flex flex-col">
              {/* HERO SECTION */}
              <div className="relative bg-white border-b border-slate-100 p-8 sm:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-heading text-4xl font-bold border-4 border-white shadow-sm">
                      {selectedScreening.candidate?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                        {selectedScreening.candidate?.name || "Candidate Profile"}
                      </h2>
                      <p className="mt-2 text-base text-slate-500 font-medium">
                        {selectedScreening.candidate?.email || "No contact info available"}
                      </p>
                      <div className="mt-4">
                        <ScoreBadge score={selectedScreening.overall_score} />
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right rounded-3xl bg-slate-50 border border-slate-100 p-6 flex items-center gap-6 shadow-inner">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-mono font-semibold mb-1">AI Match Score</p>
                      <p className="font-heading text-6xl font-bold tracking-tighter text-primary leading-none">
                        {selectedScreening.overall_score.toFixed(0)}<span className="text-3xl text-primary/50">/100</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BENTO GRID */}
              <div className="p-8 sm:p-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Analytics Row */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Skills", score: selectedScreening.skills_score, icon: <Sparkle className="h-5 w-5" /> },
                    { label: "Experience", score: selectedScreening.experience_score, icon: <Medal className="h-5 w-5" /> },
                    { label: "Education", score: selectedScreening.education_score, icon: <CheckCircle className="h-5 w-5" /> },
                    { label: "Certifications", score: selectedScreening.certification_score, icon: <Trophy className="h-5 w-5" /> },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl bg-white border border-slate-200/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 text-slate-400 mb-4">
                        {item.icon}
                        <p className="text-[11px] uppercase tracking-widest font-mono font-medium">{item.label}</p>
                      </div>
                      <p className="font-heading text-4xl font-bold text-slate-900 mb-3">{item.score.toFixed(0)}</p>
                      <MiniBar score={item.score} />
                    </div>
                  ))}
                </div>

                {/* Skills Analysis */}
                <div className="rounded-3xl bg-white border border-slate-200/50 p-8 shadow-sm lg:col-span-2">
                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <ChartBar className="h-5 w-5 text-indigo-500" />
                    Skill Assessment
                  </h3>
                  
                  <div className="space-y-8">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" /> 
                        Verified Matches
                      </p>
                      {selectedScreening.matched_skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedScreening.matched_skills.map((skill, index) => (
                            <div key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {skill}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No verified skills found.</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-rose-500" weight="fill" /> 
                        Missing Requirements
                      </p>
                      {selectedScreening.missing_skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedScreening.missing_skills.map((skill, index) => (
                            <div key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium">
                              <XCircle className="h-3.5 w-3.5" />
                              {skill}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Candidate meets all listed skill requirements.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Qualitative Highlights */}
                <div className="space-y-6 lg:col-span-1 flex flex-col">
                  {selectedScreening.strengths?.length > 0 && (
                    <div className="rounded-3xl bg-indigo-50/50 border border-indigo-100 p-6 flex-1 shadow-sm">
                      <h3 className="font-heading text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Sparkle className="h-5 w-5 text-indigo-500" weight="fill" />
                        Key Strengths
                      </h3>
                      <ul className="space-y-3">
                        {selectedScreening.strengths.map((item, index) => (
                          <li key={index} className="flex gap-3 text-sm leading-relaxed text-indigo-800/80">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedScreening.weaknesses?.length > 0 && (
                    <div className="rounded-3xl bg-amber-50/50 border border-amber-100 p-6 flex-1 shadow-sm">
                      <h3 className="font-heading text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <Warning className="h-5 w-5 text-amber-500" weight="fill" />
                        Areas of Concern
                      </h3>
                      <ul className="space-y-3">
                        {selectedScreening.weaknesses.map((item, index) => (
                          <li key={index} className="flex gap-3 text-sm leading-relaxed text-amber-800/80">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedScreening.red_flags?.length > 0 && (
                    <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 shadow-sm">
                      <h3 className="font-heading text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                        <Warning className="h-5 w-5 text-rose-600" weight="duotone" />
                        Critical Red Flags
                      </h3>
                      <ul className="space-y-3">
                        {selectedScreening.red_flags.map((item, index) => (
                          <li key={index} className="flex gap-3 text-sm font-medium leading-relaxed text-rose-800">
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
