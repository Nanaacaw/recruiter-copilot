"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Candidate, HealthStatus, JobDescription, Screening } from "@/types";
import {
  ArrowRight,
  Bot,
  Brain,
  BriefcaseBusiness,
  FileText,
  Layers3,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <Card className="soft-panel border-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{helper}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [jdData, candidateData, healthData] = await Promise.all([
          api.getJobDescriptions(),
          api.getCandidates(),
          api.health().catch(() => null),
        ]);

        const screeningResponses = await Promise.all(
          jdData.map((jd) => api.getScreeningsForJd(jd.id).catch(() => []))
        );

        if (ignore) return;

        setJds(jdData);
        setCandidates(candidateData);
        setHealth(healthData);
        setScreenings(screeningResponses.flat());
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const readinessChecks = [
    { label: "Job descriptions ready", done: jds.length > 0 },
    { label: "Candidate CVs uploaded", done: candidates.length > 0 },
    { label: "At least one screening completed", done: screenings.length > 0 },
  ];
  const readinessScore = readinessChecks.filter((item) => item.done).length;

  const topScreenings = [...screenings]
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 4);
  const recentJds = jds.slice(0, 4);
  const recentCandidates = candidates.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl p-8">
      <section className="hero-mesh soft-panel overflow-hidden rounded-[2rem] border-0">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Recruiter command center
            </div>

            <div className="space-y-3">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900">
                Keep the hiring pipeline moving without losing the signal in the noise.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                This workspace ties together job criteria, CV intake, AI screening, ranking, interview prep,
                and exports so recruiters can move from intake to shortlist with less manual bookkeeping.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-slate-700">
                <Bot className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
              </Badge>
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <Radar className="mr-1.5 h-3.5 w-3.5" />
                {health?.status === "healthy" ? "Backend connected" : "Backend not confirmed"}
              </Badge>
              <Badge className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-indigo-700">
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                {screenings.length} screening result{screenings.length === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/screening">
                <Button className="h-11 rounded-2xl gradient-blue border-0 px-5 text-white shadow-lg shadow-blue-200">
                  Start screening
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/candidates">
                <Button variant="outline" className="h-11 rounded-2xl border-slate-200 bg-white/80 px-5">
                  Upload more CVs
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-0 bg-slate-950/92 text-white shadow-2xl shadow-slate-300/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pipeline readiness</p>
                  <p className="mt-2 text-4xl font-semibold">{readinessScore}/3</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Target className="h-5 w-5 text-cyan-300" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {readinessChecks.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                  >
                    <span className="text-sm text-slate-200">{item.label}</span>
                    <Badge
                      className={
                        item.done
                          ? "rounded-full border-0 bg-emerald-400/15 text-emerald-300"
                          : "rounded-full border-0 bg-amber-400/15 text-amber-300"
                      }
                    >
                      {item.done ? "Ready" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-300">
                The strongest next move is to keep one JD, a clean candidate pool, and the current AI model visible
                before running bigger screening batches.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Job Descriptions"
          value={loading ? 0 : jds.length}
          helper="Roles with structured criteria ready for screening."
          icon={BriefcaseBusiness}
          tone="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          label="Candidates"
          value={loading ? 0 : candidates.length}
          helper="Profiles already parsed and available for matching."
          icon={Users}
          tone="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Completed Screenings"
          value={loading ? 0 : screenings.length}
          helper="Stored results that can feed ranking, export, and interview prep."
          icon={Brain}
          tone="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="soft-panel border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Suggested operating flow</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              The shortest path from intake to shortlist is still the smoothest path in the app.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "1. Shape the role",
                  desc: "Capture must-have skills, minimum experience, and scoring weights before touching AI.",
                  href: "/job-descriptions",
                  label: "Open job descriptions",
                },
                {
                  title: "2. Load candidate supply",
                  desc: "Upload CVs first so the screening page can focus on selection and matching.",
                  href: "/candidates",
                  label: "Open candidates",
                },
                {
                  title: "3. Run screening batches",
                  desc: "Screen a small batch first, validate the output quality, then scale to more candidates.",
                  href: "/screening",
                  label: "Open screening",
                },
                {
                  title: "4. Decide and export",
                  desc: "Use ranking, interview prep, and exports as the handoff layer for hiring conversations.",
                  href: "/ranking",
                  label: "Open ranking",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50"
                >
                  <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                  <div className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600">
                    {item.label}
                    <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="soft-panel border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Top screening results</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Fast glance at the strongest candidates currently stored in the workspace.
            </p>

            <div className="mt-5 space-y-3">
              {topScreenings.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  No screening results yet. Run screening to populate this panel.
                </div>
              ) : (
                topScreenings.map((screening, index) => (
                  <div
                    key={screening.id}
                    className="flex items-center justify-between rounded-[1.5rem] border border-slate-200/70 bg-white/75 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        #{index + 1} {screening.candidate?.name || "Candidate"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {screening.job_description?.title || "Stored screening result"}
                      </p>
                    </div>
                    <Badge className="rounded-full border-0 bg-slate-900 text-white">
                      {screening.overall_score.toFixed(0)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="soft-panel border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Recent job descriptions</h3>
            </div>
            <div className="mt-5 space-y-3">
              {recentJds.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  No job descriptions yet. Start by creating one structured hiring brief.
                </div>
              ) : (
                recentJds.map((jd) => (
                  <div
                    key={jd.id}
                    className="rounded-[1.5rem] border border-slate-200/70 bg-white/75 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{jd.title}</p>
                        <p className="text-sm text-slate-500">{jd.department || "No department set"}</p>
                      </div>
                      <Badge className="rounded-full border-0 bg-indigo-50 text-indigo-700">
                        {jd.required_skills.length} skills
                      </Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                      {jd.description || "No description entered yet."}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="soft-panel border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Recent candidates</h3>
            </div>
            <div className="mt-5 space-y-3">
              {recentCandidates.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  No candidate CVs uploaded yet. Drag PDF or DOCX files into the candidate inbox.
                </div>
              ) : (
                recentCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between rounded-[1.5rem] border border-slate-200/70 bg-white/75 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{candidate.name || "Unnamed candidate"}</p>
                      <p className="truncate text-sm text-slate-500">{candidate.email || "No email detected"}</p>
                    </div>
                    <Badge className="rounded-full border-0 bg-emerald-50 text-emerald-700">
                      CV parsed
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
