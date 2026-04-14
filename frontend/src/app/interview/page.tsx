"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { InterviewLanguage, InterviewQuestion, Screening } from "@/types";
import {
  Brain,
  Languages,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

export default function InterviewPage() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedScreening, setSelectedScreening] = useState("");
  const [questionLanguage, setQuestionLanguage] = useState<InterviewLanguage>("en");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadScreenings() {
      try {
        const jds = await api.getJobDescriptions();
        const screeningGroups = await Promise.all(
          jds.map((jd) => api.getScreeningsForJd(jd.id).catch(() => []))
        );

        if (ignore) return;

        setScreenings(
          screeningGroups
            .flat()
            .sort((a, b) => b.overall_score - a.overall_score)
        );
      } catch {
        if (!ignore) setScreenings([]);
      }
    }

    loadScreenings();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      if (!selectedScreening) {
        setQuestions([]);
        return;
      }

      setLoading(true);
      try {
        const data = await api.getQuestions(selectedScreening, questionLanguage);
        if (!ignore) setQuestions(data);
      } catch {
        if (!ignore) setQuestions([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadQuestions();

    return () => {
      ignore = true;
    };
  }, [selectedScreening, questionLanguage]);

  const handleGenerate = async () => {
    if (!selectedScreening) return;
    setGenerating(true);
    try {
      const generatedQuestions = await api.generateQuestions(selectedScreening, {
        language: questionLanguage,
      });
      setQuestions(generatedQuestions);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technical":
        return <Brain className="h-3.5 w-3.5" />;
      case "behavioral":
        return <Users className="h-3.5 w-3.5" />;
      case "situational":
        return <Lightbulb className="h-3.5 w-3.5" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "behavioral":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "situational":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-50 text-emerald-700";
      case "medium":
        return "bg-amber-50 text-amber-700";
      case "hard":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const technicalQuestions = questions.filter((question) => question.category === "technical");
  const behavioralQuestions = questions.filter((question) => question.category === "behavioral");
  const situationalQuestions = questions.filter((question) => question.category === "situational");
  const selectedScreeningData = screenings.find((screening) => screening.id === selectedScreening);

  return (
    <div className="page-shell">
      <section className="hero-mesh soft-panel overflow-hidden rounded-[2rem] border-0">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Interview preparation
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Generate interview questions in English or Bahasa Indonesia from real screening gaps.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                Questions are now stored per language, so you can keep one English set and one Indonesian set for
                the same screening result without mixing them together.
              </p>
            </div>
          </div>

          <Card className="border-0 bg-slate-950/92 text-white shadow-2xl shadow-slate-300/30">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">How it works</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-sm font-semibold text-white">Pick one screening result</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    The questions stay anchored to that candidate, role, and gap profile.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-sm font-semibold text-white">Choose a language</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Use English for cross-team review or Bahasa Indonesia for recruiter interviews.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-sm font-semibold text-white">Reuse cached sets</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Existing questions load automatically for the currently selected language.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.55fr_0.55fr]">
        <div className="space-y-2">
          <Label>Select screening result</Label>
          <Select value={selectedScreening} onValueChange={(value) => value && setSelectedScreening(value)}>
            <SelectTrigger className="h-12 rounded-2xl bg-white/90">
              <SelectValue placeholder="Choose a screening result..." />
            </SelectTrigger>
            <SelectContent>
              {screenings.map((screening) => (
                <SelectItem key={screening.id} value={screening.id}>
                  {screening.candidate?.name || "Candidate"} - Score {screening.overall_score?.toFixed(0)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Question language</Label>
          <Select value={questionLanguage} onValueChange={(value) => setQuestionLanguage(value as InterviewLanguage)}>
            <SelectTrigger className="h-12 rounded-2xl bg-white/90">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleGenerate}
            disabled={!selectedScreening || generating}
            className="h-12 w-full rounded-2xl border-0 gradient-blue text-white shadow-lg shadow-blue-200"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate questions
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-slate-700">
          <Languages className="mr-1.5 h-3.5 w-3.5" />
          {questionLanguage === "id" ? "Bahasa Indonesia" : "English"}
        </Badge>
        <Badge className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-slate-700">
          Questions are cached per language
        </Badge>
      </div>

      {selectedScreeningData ? (
        <Card className="mt-6 soft-panel border-0">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-sm font-bold text-white">
                  {selectedScreeningData.candidate?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedScreeningData.candidate?.name || "Candidate"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedScreeningData.job_description?.title || "Stored screening result"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full border-0 bg-indigo-100 text-indigo-700">
                  Score {selectedScreeningData.overall_score?.toFixed(0)}
                </Badge>
                {selectedScreeningData.missing_skills?.slice(0, 3).map((skill, index) => (
                  <Badge key={`${skill}-${index}`} className="rounded-full border-0 bg-slate-100 text-slate-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <Card className="mt-6 border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <MessageSquare className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">
              {selectedScreening
                ? questionLanguage === "id"
                  ? "Belum ada pertanyaan interview Bahasa Indonesia untuk screening ini."
                  : "No English interview questions for this screening yet."
                : "Pick a screening result first, then generate the question set you need."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          <Tabs defaultValue="all">
            <TabsList className="rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="all" className="rounded-lg">
                All ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="technical" className="rounded-lg">
                Technical ({technicalQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="behavioral" className="rounded-lg">
                Behavioral ({behavioralQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="situational" className="rounded-lg">
                Situational ({situationalQuestions.length})
              </TabsTrigger>
            </TabsList>

            {["all", "technical", "behavioral", "situational"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                {(tab === "all" ? questions : questions.filter((question) => question.category === tab)).map(
                  (question, index) => (
                    <Card key={question.id} className="border-0 shadow-sm transition-all hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <p className="font-medium leading-7 text-slate-900">{question.question}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={`${getCategoryColor(question.category)} gap-1 border`} variant="outline">
                                {getCategoryIcon(question.category)}
                                <span className="ml-0.5 capitalize">{question.category}</span>
                              </Badge>
                              <Badge className={`${getDifficultyColor(question.difficulty)} border-0`}>
                                {question.difficulty}
                              </Badge>
                              <Badge className="rounded-full border-0 bg-slate-100 text-slate-700">
                                {question.language === "id" ? "Bahasa Indonesia" : "English"}
                              </Badge>
                              {question.focus_area ? (
                                <Badge variant="outline" className="border-slate-200 text-xs">
                                  {question.focus_area}
                                </Badge>
                              ) : null}
                            </div>
                            {question.evaluation_criteria ? (
                              <div className="rounded-xl bg-slate-50 p-3">
                                <p className="mb-1 text-xs font-semibold text-slate-500">Evaluation criteria</p>
                                <p className="text-sm leading-6 text-slate-600">{question.evaluation_criteria}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
