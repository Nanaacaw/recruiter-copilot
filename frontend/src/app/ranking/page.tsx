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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { Trophy, Download, Eye, BarChart3, CheckCircle2, XCircle, AlertTriangle, Medal } from "lucide-react";
import type { JobDescription, Screening } from "@/types";

function ScoreBadge({ score }: { score: number }) {
  if (score >= 75) return <Badge className="bg-emerald-50 text-emerald-700 border-0">Strong</Badge>;
  if (score >= 50) return <Badge className="bg-amber-50 text-amber-700 border-0">Moderate</Badge>;
  return <Badge className="bg-red-50 text-red-700 border-0">Weak</Badge>;
}

function MiniBar({ score }: { score: number }) {
  const color = score >= 75 ? "from-emerald-400 to-cyan-400" : score >= 50 ? "from-amber-400 to-orange-400" : "from-red-400 to-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold w-7 text-right">{score.toFixed(0)}</span>
    </div>
  );
}

export default function RankingPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedJd, setSelectedJd] = useState("");
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getJobDescriptions().then(setJds).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (selectedJd) { api.getScreeningsForJd(selectedJd).then(setScreenings).catch(() => {}); } else { setScreenings([]); }
  }, [selectedJd]);

  const getScoreColor = (score: number) => score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";

  const getMedalColor = (idx: number) => {
    if (idx === 0) return "from-amber-300 to-yellow-500";
    if (idx === 1) return "from-slate-300 to-slate-400";
    if (idx === 2) return "from-amber-600 to-amber-700";
    return "";
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-amber">
            <Medal className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ranking</h1>
            <p className="text-slate-500 text-sm">Rank and compare candidates by screening score</p>
          </div>
        </div>
        {selectedJd && screenings.length > 0 && (
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => api.exportExcel(selectedJd)}>
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        )}
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

      {!selectedJd ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
              <BarChart3 className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">Select a job description to view candidate rankings</p>
          </CardContent>
        </Card>
      ) : screenings.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No screening results yet. Screen candidates first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {screenings.sort((a, b) => b.overall_score - a.overall_score).slice(0, 3).length > 0 && (
            <div className="grid gap-5 md:grid-cols-3">
              {screenings.sort((a, b) => b.overall_score - a.overall_score).slice(0, 3).map((s, idx) => (
                <Card key={s.id} className={`border-0 shadow-md relative overflow-hidden ${idx === 0 ? "ring-2 ring-amber-300/50" : ""}`}>
                  <div className={`h-1.5 ${idx === 0 ? "bg-gradient-to-r from-amber-300 to-yellow-500" : idx === 1 ? "bg-gradient-to-r from-slate-300 to-slate-400" : "bg-gradient-to-r from-amber-600 to-amber-700"}`} />
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${getMedalColor(idx) || "from-slate-200 to-slate-300"} text-white text-sm font-bold shadow-sm`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.candidate?.name}</p>
                          <p className="text-xs text-slate-400">{s.candidate?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${getScoreColor(s.overall_score)}`}>{s.overall_score.toFixed(0)}</p>
                        <ScoreBadge score={s.overall_score} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Skills", score: s.skills_score },
                        { label: "Experience", score: s.experience_score },
                        { label: "Education", score: s.education_score },
                        { label: "Certs", score: s.certification_score },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-xs w-20 text-slate-400">{item.label}</span>
                          <MiniBar score={item.score} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Full Ranking ({screenings.length} candidates)</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="text-xs font-semibold text-slate-500 w-14">Rank</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Candidate</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Overall</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Skills</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Experience</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Education</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Certs</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screenings.sort((a, b) => b.overall_score - a.overall_score).map((s, idx) => (
                  <TableRow key={s.id} className="hover:bg-indigo-50/30">
                    <TableCell>
                      {idx < 3 ? (
                        <Trophy className={`h-5 w-5 ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-400" : "text-amber-600"}`} />
                      ) : (
                        <span className="text-sm text-slate-400 pl-1.5">{idx + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-white text-[10px] font-bold">
                          {s.candidate?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.candidate?.name}</p>
                          <p className="text-xs text-slate-400">{s.candidate?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className={`text-lg font-bold ${getScoreColor(s.overall_score)}`}>{s.overall_score.toFixed(0)}</span></TableCell>
                    <TableCell><span className={`font-semibold text-sm ${getScoreColor(s.skills_score)}`}>{s.skills_score.toFixed(0)}</span></TableCell>
                    <TableCell><span className={`font-semibold text-sm ${getScoreColor(s.experience_score)}`}>{s.experience_score.toFixed(0)}</span></TableCell>
                    <TableCell><span className={`font-semibold text-sm ${getScoreColor(s.education_score)}`}>{s.education_score.toFixed(0)}</span></TableCell>
                    <TableCell><span className={`font-semibold text-sm ${getScoreColor(s.certification_score)}`}>{s.certification_score.toFixed(0)}</span></TableCell>
                    <TableCell><ScoreBadge score={s.overall_score} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedScreening(s)} className="h-8 w-8 p-0 hover:bg-indigo-100">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => api.exportPdf(s.id)} className="h-8 w-8 p-0 hover:bg-indigo-100">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      <Dialog open={!!selectedScreening} onOpenChange={() => setSelectedScreening(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-white text-sm font-bold">
                {selectedScreening?.candidate?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {selectedScreening?.candidate?.name} — Detailed Analysis
            </DialogTitle>
          </DialogHeader>
          {selectedScreening && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Overall", score: selectedScreening.overall_score },
                  { label: "Skills", score: selectedScreening.skills_score },
                  { label: "Experience", score: selectedScreening.experience_score },
                  { label: "Education", score: selectedScreening.education_score },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-xl bg-slate-50">
                    <p className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score.toFixed(0)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <Separator />
              {selectedScreening.matched_skills?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm text-emerald-600 mb-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Matched Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScreening.matched_skills.map((s, i) => (<Badge key={i} className="bg-emerald-50 text-emerald-700 border-0">{s}</Badge>))}
                  </div>
                </div>
              )}
              {selectedScreening.missing_skills?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-1"><XCircle className="h-4 w-4" /> Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScreening.missing_skills.map((s, i) => (<Badge key={i} className="bg-red-50 text-red-700 border-0">{s}</Badge>))}
                  </div>
                </div>
              )}
              {selectedScreening.strengths?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Strengths</p>
                  <ul className="space-y-1.5">
                    {selectedScreening.strengths.map((s, i) => (<li key={i} className="text-sm flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />{s}</li>))}
                  </ul>
                </div>
              )}
              {selectedScreening.weaknesses?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Weaknesses</p>
                  <ul className="space-y-1.5">
                    {selectedScreening.weaknesses.map((w, i) => (<li key={i} className="text-sm flex gap-2"><XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />{w}</li>))}
                  </ul>
                </div>
              )}
              {selectedScreening.red_flags?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Red Flags</p>
                  <ul className="space-y-1.5">
                    {selectedScreening.red_flags.map((f, i) => (<li key={i} className="text-sm flex gap-2"><AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{f}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
