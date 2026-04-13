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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { MessageSquare, Loader2, RefreshCw, Brain, Users, Lightbulb, Sparkles } from "lucide-react";
import type { Screening, InterviewQuestion } from "@/types";

export default function InterviewPage() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [selectedScreening, setSelectedScreening] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getJobDescriptions().then(async (jds) => {
      const allScreenings: any[] = [];
      for (const jd of jds) {
        try { const s = await api.getScreeningsForJd(jd.id); allScreenings.push(...s); } catch {}
      }
      setScreenings(allScreenings);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedScreening) {
      setLoading(true);
      api.getQuestions(selectedScreening).then(setQuestions).catch(() => setQuestions([])).finally(() => setLoading(false));
    }
  }, [selectedScreening]);

  const handleGenerate = async () => {
    if (!selectedScreening) return;
    setGenerating(true);
    try { const qs = await api.generateQuestions(selectedScreening); setQuestions(qs); } catch (err: any) { alert(err.message); } finally { setGenerating(false); }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technical": return <Brain className="h-3.5 w-3.5" />;
      case "behavioral": return <Users className="h-3.5 w-3.5" />;
      case "situational": return <Lightbulb className="h-3.5 w-3.5" />;
      default: return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical": return "bg-blue-50 text-blue-700 border-blue-200";
      case "behavioral": return "bg-purple-50 text-purple-700 border-purple-200";
      case "situational": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-emerald-50 text-emerald-700";
      case "medium": return "bg-amber-50 text-amber-700";
      case "hard": return "bg-red-50 text-red-700";
      default: return "";
    }
  };

  const technicalQs = questions.filter((q) => q.category === "technical");
  const behavioralQs = questions.filter((q) => q.category === "behavioral");
  const situationalQs = questions.filter((q) => q.category === "situational");
  const selectedScreeningData = screenings.find((s) => s.id === selectedScreening);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-purple">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview Prep</h1>
          <p className="text-slate-500 text-sm">Generate AI-powered interview questions based on screening gaps</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-slate-600 mb-1.5">Select Screening Result</p>
          <Select value={selectedScreening} onValueChange={(v) => v && setSelectedScreening(v)}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Choose a screening result..." /></SelectTrigger>
            <SelectContent>
              {screenings.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.candidate?.name || "Candidate"} — Score: {s.overall_score?.toFixed(0)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleGenerate} disabled={!selectedScreening || generating} className="gap-2 w-full h-11 gradient-blue border-0 text-white shadow-lg shadow-indigo-200 rounded-xl">
            {generating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>) : (<><RefreshCw className="h-4 w-4" /> Generate Questions</>)}
          </Button>
        </div>
      </div>

      {selectedScreeningData && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50/50 to-cyan-50/50 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-white text-xs font-bold">
                {selectedScreeningData.candidate?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="font-semibold text-slate-900">{selectedScreeningData.candidate?.name}</span>
              <Badge className="bg-indigo-100 text-indigo-700 border-0">Score: {selectedScreeningData.overall_score?.toFixed(0)}</Badge>
              {(selectedScreeningData.missing_skills || []).length > 0 && (
                <span className="text-slate-500 text-sm">
                  Missing: {selectedScreeningData.missing_skills?.slice(0, 4).join(", ")}
                  {selectedScreeningData.missing_skills?.length > 4 && "..."}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />Loading questions...</div>
      ) : questions.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
              <MessageSquare className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No interview questions yet. Generate some based on screening results.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg">All ({questions.length})</TabsTrigger>
            <TabsTrigger value="technical" className="rounded-lg">Technical ({technicalQs.length})</TabsTrigger>
            <TabsTrigger value="behavioral" className="rounded-lg">Behavioral ({behavioralQs.length})</TabsTrigger>
            <TabsTrigger value="situational" className="rounded-lg">Situational ({situationalQs.length})</TabsTrigger>
          </TabsList>
          {["all", "technical", "behavioral", "situational"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {(tab === "all" ? questions : questions.filter((q) => q.category === tab)).map((q, idx) => (
                <Card key={q.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="py-4">
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <p className="font-medium text-slate-900 leading-relaxed">{q.question}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${getCategoryColor(q.category)} border gap-1`} variant="outline">
                            {getCategoryIcon(q.category)}<span className="ml-0.5 capitalize">{q.category}</span>
                          </Badge>
                          <Badge className={`${getDifficultyColor(q.difficulty)} border-0`}>{q.difficulty}</Badge>
                          {q.focus_area && <Badge variant="outline" className="text-xs border-slate-200">{q.focus_area}</Badge>}
                        </div>
                        {q.evaluation_criteria && (
                          <div className="bg-slate-50 rounded-xl p-3 mt-1">
                            <p className="text-xs text-slate-500 font-semibold mb-1">Evaluation Criteria</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{q.evaluation_criteria}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
