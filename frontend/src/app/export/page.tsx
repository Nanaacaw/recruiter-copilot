"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { Download, FileText, FileSpreadsheet, Loader2, CloudDownload, Sparkles } from "lucide-react";
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

  return (
    <div className="page-shell space-y-6 sm:space-y-8">
      <section className="hero-mesh soft-panel overflow-hidden rounded-[1.5rem] border-0 sm:rounded-[2rem]">
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Export center
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl md:text-4xl">
                Download recruiter-ready reports without digging through screening history one by one.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                Pick a role, export the full shortlist in Excel, or download individual PDF reports for candidate-by-candidate review.
              </p>
            </div>
            <div className="max-w-xl space-y-2">
              <p className="text-sm font-medium text-slate-600">Select job description</p>
              <Select value={selectedJd} onValueChange={(v) => v && setSelectedJd(v)}>
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
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Export volume</p>
                    <p className="mt-2 text-4xl font-semibold text-slate-900">{selectedJd ? screenings.length : 0}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 shadow-lg shadow-sky-200">
                    <CloudDownload className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {selectedJob ? `Stored results available for ${selectedJob.title}.` : "Pick a role to unlock export actions."}
                </p>
              </CardContent>
            </Card>

            <Card className="soft-panel rounded-[1.75rem] border-0">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-semibold text-slate-900">Export options</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Excel batch</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Best for recruiter handoff and shortlist review</p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Candidate PDF</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Best for one-candidate review packets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {selectedJd && screenings.length > 0 ? (
        <Card className="soft-panel border-0 overflow-hidden">
          <div className="h-1 gradient-green" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Batch export</h3>
                  <p className="text-sm text-slate-400">{screenings.length} candidates</p>
                </div>
              </div>
              <Button onClick={handleExportBatch} disabled={exporting === "batch"} className="h-11 w-full gap-2 rounded-2xl gradient-green border-0 text-white shadow-lg shadow-emerald-200 sm:w-auto">
                {exporting === "batch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedJd && screenings.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No screening results for this position yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {screenings.sort((a, b) => b.overall_score - a.overall_score).map((s, idx) => {
            const scoreColor = s.overall_score >= 75 ? "text-emerald-600" : s.overall_score >= 50 ? "text-amber-600" : "text-red-600";
            return (
              <Card key={s.id} className="soft-panel border-0 transition-all hover:shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-xs font-bold text-white">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{s.candidate?.name}</p>
                        <p className="truncate text-sm text-slate-400">{s.candidate?.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Badge className={`rounded-full border-0 bg-white px-3 py-1.5 ${scoreColor}`}>
                        Score {s.overall_score.toFixed(0)}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleExportPdf(s.id)} disabled={exporting === "pdf-" + s.id} className="h-10 w-full gap-2 rounded-xl border-sky-100 bg-white/88 sm:w-auto">
                        {exporting === "pdf-" + s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
