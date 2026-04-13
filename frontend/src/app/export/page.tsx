"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { Download, FileText, FileSpreadsheet, Loader2, CloudDownload } from "lucide-react";
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

  const handleExportPdf = async (screeningId: string, name: string) => {
    setExporting("pdf-" + screeningId);
    try { await api.exportPdf(screeningId); } catch (err: any) { alert(err.message); } finally { setExporting(null); }
  };

  const handleExportBatch = async () => {
    if (!selectedJd) return;
    setExporting("batch");
    try { await api.exportExcel(selectedJd); } catch (err: any) { alert(err.message); } finally { setExporting(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-blue">
          <CloudDownload className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Export Reports</h1>
          <p className="text-slate-500 text-sm">Download screening results as PDF or Excel</p>
        </div>
      </div>

      <div className="max-w-md mb-8">
        <p className="text-sm font-medium text-slate-600 mb-1.5">Select Job Description</p>
        <Select value={selectedJd} onValueChange={(v) => v && setSelectedJd(v)}>
          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Choose a position..." /></SelectTrigger>
          <SelectContent>
            {jds.map((jd) => (<SelectItem key={jd.id} value={jd.id}>{jd.title}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {selectedJd && screenings.length > 0 && (
        <Card className="border-0 shadow-md mb-6 overflow-hidden">
          <div className="h-1 gradient-green" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Batch Export</h3>
                  <p className="text-sm text-slate-400">{screenings.length} candidates</p>
                </div>
              </div>
              <Button onClick={handleExportBatch} disabled={exporting === "batch"} className="gap-2 gradient-green border-0 text-white shadow-lg shadow-emerald-200 rounded-xl">
                {exporting === "batch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedJd && screenings.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
              <FileText className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No screening results for this position yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {screenings.sort((a, b) => b.overall_score - a.overall_score).map((s, idx) => {
            const scoreColor = s.overall_score >= 75 ? "text-emerald-600" : s.overall_score >= 50 ? "text-amber-600" : "text-red-600";
            return (
              <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-white text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{s.candidate?.name}</p>
                        <p className="text-sm text-slate-400">{s.candidate?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-bold ${scoreColor}`}>{s.overall_score.toFixed(0)}</span>
                      <Button variant="outline" size="sm" onClick={() => handleExportPdf(s.id, s.candidate?.name || "")} disabled={exporting === "pdf-" + s.id} className="gap-2 rounded-xl">
                        {exporting === "pdf-" + s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        PDF
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
