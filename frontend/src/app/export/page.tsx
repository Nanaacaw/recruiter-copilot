"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { DownloadSimple, FileText, FileXls, SpinnerGap, CloudArrowDown, Sparkle } from "@phosphor-icons/react";
import type { JobDescription, Screening } from "@/types";

export default function ExportPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedJd, setSelectedJd] = useState("");
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => { api.getJobDescriptions().then(setJds).catch(() => {}); }, []);
  useEffect(() => {
    if (selectedJd) { api.getScreeningsForJd(selectedJd).then(setScreenings).catch(() => {}); } else { setScreenings([]); }
  }, [selectedJd]);

  const selectedJob = jds.find((jd) => jd.id === selectedJd);
  const selectedJobLabel = selectedJob
    ? `${selectedJob.title}${selectedJob.department ? ` - ${selectedJob.department}` : ""}`
    : undefined;

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const handleExportPdf = async (screeningId: string) => {
    setExporting("pdf-" + screeningId);
    try { await api.exportPdf(screeningId); } catch (err: unknown) { alert(getErrorMessage(err, "Export PDF failed")); } finally { setExporting(null); }
  };

  const handleExportBatch = async () => {
    if (!selectedJd) return;
    setExporting("batch");
    try { await api.exportExcel(selectedJd); } catch (err: unknown) { alert(getErrorMessage(err, "Export Excel failed")); } finally { setExporting(null); }
  };

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
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
              <Sparkle className="h-3.5 w-3.5 text-foreground" weight="fill" />
              Export center
            </div>
            <div>
              <h1 className="font-heading text-4xl tracking-tighter text-foreground sm:text-5xl md:text-6xl leading-[1.1]">
                Download recruiter-ready reports without digging through screening history one by one.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Pick a role, export the full shortlist in Excel, or download individual PDF reports for candidate-by-candidate review.
              </p>
            </div>
            <div className="max-w-xl space-y-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Select job description</p>
              <Select value={selectedJd} onValueChange={(v) => v && setSelectedJd(v)}>
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
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Export volume</p>
                  <p className="mt-4 font-heading text-5xl font-semibold text-foreground">{selectedJd ? screenings.length : 0}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <CloudArrowDown className="h-7 w-7" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {selectedJob ? `Stored results available for ${selectedJob.title}.` : "Pick a role to unlock export actions."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-sm">
              <p className="font-heading text-xl font-semibold text-foreground">Export options</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/50 bg-white/50 px-5 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Excel batch</p>
                  <p className="mt-2 text-sm font-medium text-foreground">Best for recruiter handoff and shortlist review</p>
                </div>
                <div className="rounded-xl border border-white/50 bg-white/50 px-5 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Candidate PDF</p>
                  <p className="mt-2 text-sm font-medium text-foreground">Best for one-candidate review packets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {selectedJd && screenings.length > 0 ? (
        <motion.div variants={itemVariants} className="glass-panel border-primary/30 ring-2 ring-primary/20 bg-primary/5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <FileXls className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-semibold text-foreground">Batch export</h3>
                <p className="mt-1 text-sm text-muted-foreground">{screenings.length} candidates</p>
              </div>
            </div>
            <button 
              onClick={handleExportBatch} 
              disabled={exporting === "batch"} 
              className="premium-button h-12 w-full flex items-center justify-center gap-2 px-6 sm:w-auto"
            >
              {exporting === "batch" ? <SpinnerGap className="h-4 w-4 animate-spin" /> : <FileXls className="h-4 w-4" />}
              Export Excel
            </button>
          </div>
        </motion.div>
      ) : null}

      {selectedJd && screenings.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-panel py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/50 shadow-sm border border-white/60">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No screening results for this position yet.</p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          <AnimatePresence>
          {screenings.sort((a, b) => b.overall_score - a.overall_score).map((s, idx) => {
            return (
              <motion.div layout layoutId={`export-${s.id}`} variants={itemVariants} key={s.id} className="glass-panel group">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/50 border border-white/60 font-mono text-lg font-bold text-foreground shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-xl font-semibold text-foreground">{s.candidate?.name}</p>
                      <p className="truncate text-sm text-muted-foreground mt-1">{s.candidate?.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Badge className="badge-pale-blue rounded-md border-0 px-3 py-1.5 font-mono text-[10px] uppercase shadow-sm">
                      Score {s.overall_score.toFixed(0)}
                    </Badge>
                    <button 
                      onClick={() => handleExportPdf(s.id)} 
                      disabled={exporting === "pdf-" + s.id} 
                      className="minimal-button h-12 w-full flex items-center justify-center gap-2 px-6 sm:w-auto"
                    >
                      {exporting === "pdf-" + s.id ? <SpinnerGap className="h-4 w-4 animate-spin" /> : <DownloadSimple className="h-4 w-4" />}
                      Export PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
