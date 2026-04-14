"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Candidate, HealthStatus, JobDescription, Screening } from "@/types";
import {
  ArrowRight,
  Bot,
  Brain,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Layers3,
  Radar,
  ShieldCheck,
  Sparkles,
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
    <Card className="sky-card rounded-[1.75rem] border-0">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">{helper}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionTile({
  href,
  title,
  description,
  kicker,
}: {
  href: string;
  title: string;
  description: string;
  kicker: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-sky-100 bg-white/88 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/80"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">{kicker}</p>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
        Open
        <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
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
    { label: "Structured job descriptions ready", done: jds.length > 0 },
    { label: "Candidate CVs uploaded and parsed", done: candidates.length > 0 },
    { label: "Screening results available", done: screenings.length > 0 },
  ];
  const readinessScore = readinessChecks.filter((item) => item.done).length;
  const sortedScreenings = [...screenings].sort((a, b) => b.overall_score - a.overall_score);
  const topScreenings = sortedScreenings.slice(0, 4);
  const recentJds = jds.slice(0, 4);
  const recentCandidates = candidates.slice(0, 4);

  const nextMove =
    jds.length === 0
      ? {
          title: "Create the first hiring brief",
          body: "Start by defining the role, required skills, and scoring weights before touching AI.",
          href: "/job-descriptions",
          cta: "Open job descriptions",
        }
      : candidates.length === 0
        ? {
            title: "Upload candidate CVs",
            body: "Once the role is ready, load the candidate pool so the screening workspace can stay focused.",
            href: "/candidates",
            cta: "Open candidate inbox",
          }
        : screenings.length === 0
          ? {
              title: "Run the first screening batch",
              body: "Use a small pilot batch first to validate the output tone and the score distribution.",
              href: "/screening",
              cta: "Open screening",
            }
          : {
              title: "Move into ranking and interview prep",
              body: "You already have enough signal to compare candidates, generate questions, and prepare handoff-ready artifacts.",
              href: "/ranking",
              cta: "Open ranking board",
            };

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-sky-100/90 bg-white/90 shadow-[0_24px_70px_rgba(96,165,250,0.16)]">
        <div className="absolute inset-0 hero-mesh" />
        <div className="absolute inset-0 blueprint-grid opacity-55" />
        <div className="relative grid gap-6 p-6 xl:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/92 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Morning hiring brief
            </div>

            <div className="space-y-4">
              <h2 className="max-w-4xl text-3xl font-semibold text-slate-900 md:text-5xl">
                A light, focused control room for screening candidates without drowning the HR team in noise.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                This dashboard is intentionally calmer: softer blue surfaces, clearer hierarchy, and faster pathways
                from job brief to shortlist. The goal is to help the team know what is ready, what is missing, and what should happen next.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="soft-blue-chip rounded-full px-3 py-1.5">
                <Bot className="mr-1.5 h-3.5 w-3.5" />
                {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
              </Badge>
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {health?.status === "healthy" ? "Backend healthy" : "Backend not confirmed"}
              </Badge>
              <Badge className="rounded-full border border-sky-100 bg-white/90 px-3 py-1.5 text-slate-700">
                <TrendingUp className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                {sortedScreenings.length} stored screening result{sortedScreenings.length === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={nextMove.href}>
                <Button className="h-12 rounded-2xl gradient-blue border-0 px-5 text-white shadow-lg shadow-sky-200">
                  {nextMove.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/screening">
                <Button variant="outline" className="h-12 rounded-2xl border-sky-100 bg-white/88 px-5 text-slate-700">
                  Open screening studio
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-sky-100 bg-white/88 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role setup</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? 0 : jds.length}</p>
                <p className="mt-2 text-sm text-slate-500">Hiring briefs ready for the recruiter team.</p>
              </div>
              <div className="rounded-[1.5rem] border border-sky-100 bg-white/88 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Candidate supply</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? 0 : candidates.length}</p>
                <p className="mt-2 text-sm text-slate-500">CVs available to enter a screening batch.</p>
              </div>
              <div className="rounded-[1.5rem] border border-sky-100 bg-white/88 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Decision signal</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? 0 : sortedScreenings.length}</p>
                <p className="mt-2 text-sm text-slate-500">Results ready for ranking and interview prep.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="sky-card rounded-[1.75rem] border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pipeline posture</p>
                    <p className="mt-2 text-4xl font-semibold text-slate-900">{readinessScore}/3</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 shadow-lg shadow-sky-200">
                    <Radar className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {readinessChecks.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/85 px-4 py-3">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <Badge
                        className={
                          item.done
                            ? "rounded-full border-0 bg-emerald-100 text-emerald-700"
                            : "rounded-full border-0 bg-amber-100 text-amber-700"
                        }
                      >
                        {item.done ? "Ready" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="soft-panel rounded-[1.75rem] border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-slate-900">Best next move</p>
                </div>
                <p className="mt-3 text-xl font-semibold text-slate-900">{nextMove.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">{nextMove.body}</p>
                <Link href={nextMove.href} className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
                  {nextMove.cta}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Job Descriptions"
          value={loading ? 0 : jds.length}
          helper="Roles with structured criteria ready to be screened against candidate profiles."
          icon={BriefcaseBusiness}
          tone="bg-sky-50 text-sky-600"
        />
        <MetricCard
          label="Candidates"
          value={loading ? 0 : candidates.length}
          helper="Profiles already parsed and visible to the recruiter team inside the workspace."
          icon={Users}
          tone="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Completed Screenings"
          value={loading ? 0 : sortedScreenings.length}
          helper="Stored fit assessments that feed ranking, export, and interview preparation."
          icon={Brain}
          tone="bg-cyan-50 text-cyan-600"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="soft-panel rounded-[1.85rem] border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-900">Suggested operating flow</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              These four moves keep the recruiter workflow readable, predictable, and easier to maintain.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ActionTile
                href="/job-descriptions"
                kicker="Phase 1"
                title="Shape the role"
                description="Capture must-have skills, minimum experience, and score weights before involving AI."
              />
              <ActionTile
                href="/candidates"
                kicker="Phase 2"
                title="Load candidate supply"
                description="Upload CVs first so later decisions focus on matching and not document chasing."
              />
              <ActionTile
                href="/screening"
                kicker="Phase 3"
                title="Run screening batches"
                description="Start with a small validation batch, then expand when the score quality feels right."
              />
              <ActionTile
                href="/ranking"
                kicker="Phase 4"
                title="Compare and decide"
                description="Move into ranking, interview prep, and export once the shortlist already has signal."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="sky-card rounded-[1.85rem] border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-slate-900">Shortlist snapshot</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              A fast glance at the strongest candidates currently stored in the workspace.
            </p>

            <div className="mt-5 space-y-3">
              {topScreenings.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-sky-100 bg-white/80 p-5 text-sm text-slate-500">
                  No screening results yet. Run screening to populate this panel.
                </div>
              ) : (
                topScreenings.map((screening, index) => (
                  <div
                    key={screening.id}
                    className="flex items-center justify-between rounded-[1.5rem] border border-sky-100 bg-white/88 px-4 py-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        #{index + 1} {screening.candidate?.name || "Candidate"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {screening.job_description?.title || "Stored screening result"}
                      </p>
                    </div>
                    <Badge className="rounded-full border-0 bg-blue-600 px-3 py-1.5 text-white">
                      {screening.overall_score.toFixed(0)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="soft-panel rounded-[1.85rem] border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-900">Recent job descriptions</h3>
            </div>

            <div className="mt-5 space-y-3">
              {recentJds.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-sky-100 bg-white/80 p-5 text-sm text-slate-500">
                  No job descriptions yet. Start by creating one structured hiring brief.
                </div>
              ) : (
                recentJds.map((jd) => (
                  <div key={jd.id} className="rounded-[1.5rem] border border-sky-100 bg-white/88 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{jd.title}</p>
                        <p className="text-sm text-slate-500">{jd.department || "No department set"}</p>
                      </div>
                      <Badge className="rounded-full border-0 bg-sky-50 text-sky-700">
                        {jd.required_skills.length} skills
                      </Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">
                      {jd.description || "No description entered yet."}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="sky-card rounded-[1.85rem] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600" />
                <h3 className="text-xl font-semibold text-slate-900">Recent candidates</h3>
              </div>

              <div className="mt-5 space-y-3">
                {recentCandidates.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-sky-100 bg-white/80 p-5 text-sm text-slate-500">
                    No candidate CVs uploaded yet. Use the candidate inbox to load the supply side of the pipeline.
                  </div>
                ) : (
                  recentCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between rounded-[1.5rem] border border-sky-100 bg-white/88 px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{candidate.name || "Unnamed candidate"}</p>
                        <p className="truncate text-sm text-slate-500">{candidate.email || "No email detected"}</p>
                      </div>
                      <Badge className="rounded-full border-0 bg-sky-50 text-sky-700">CV parsed</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="soft-panel rounded-[1.85rem] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-900">AI runtime cue</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Keep the provider and model visible before launching a larger screening run. It reduces confusion when you compare historical results across batches.
              </p>
              <div className="mt-4 rounded-[1.5rem] border border-sky-100 bg-white/88 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current mapping</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Healthy runtime makes retry, cache refresh, and interviewer prep more predictable.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
