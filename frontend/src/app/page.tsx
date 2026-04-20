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
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Layers3,
  Radar,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="h-full border border-sky-100 bg-white shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">{value}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{helper}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
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

  const sortedScreenings = [...screenings].sort((a, b) => b.overall_score - a.overall_score);
  const topScreenings = sortedScreenings.slice(0, 4);
  const recentJds = jds.slice(0, 4);
  const recentCandidates = candidates.slice(0, 4);
  const readinessChecks = [
    { label: "Job descriptions ready", done: jds.length > 0 },
    { label: "Candidates uploaded", done: candidates.length > 0 },
    { label: "Screening results available", done: screenings.length > 0 },
  ];

  const nextMove =
    jds.length === 0
      ? {
          title: "Create the first job description",
          body: "Start with one structured role brief before moving into candidate intake.",
          href: "/job-descriptions",
          cta: "Open job descriptions",
        }
      : candidates.length === 0
        ? {
            title: "Upload candidate CVs",
            body: "Bring the candidate pool into the workspace so the screening page can stay focused on selection.",
            href: "/candidates",
            cta: "Open candidates",
          }
        : screenings.length === 0
          ? {
              title: "Run the first screening batch",
              body: "Pick one role and a small pilot batch so the team can validate fit quality before scaling.",
              href: "/screening",
              cta: "Open screening",
            }
          : {
              title: "Review ranking and export reports",
              body: "The workspace already has enough signal to compare candidates and prepare recruiter-ready handoff files.",
              href: "/ranking",
              cta: "Open ranking",
            };

  return (
    <div className="page-shell space-y-6 sm:space-y-8">
      <section className="rounded-[1.75rem] border border-sky-100 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              <Radar className="h-3.5 w-3.5" />
              Recruiter overview
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl md:text-4xl">
                A simpler dashboard for tracking pipeline readiness and deciding the next step.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                Keep the page focused on what HR usually needs first: current totals, workspace status,
                the next move, and a short view of recent activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-slate-700">
                <Bot className="mr-1.5 h-3.5 w-3.5 text-sky-600" />
                {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
              </Badge>
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {health?.status === "healthy" ? "Backend healthy" : "Backend unknown"}
              </Badge>
            </div>
          </div>

          <div className="w-full max-w-none rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4 sm:p-5 xl:max-w-md">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next move</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{nextMove.title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">{nextMove.body}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={nextMove.href} className="w-full sm:w-auto">
                <Button className="h-11 w-full rounded-2xl gradient-blue border-0 px-5 text-white shadow-md shadow-sky-200 sm:w-auto">
                  {nextMove.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/screening" className="w-full sm:w-auto">
                <Button variant="outline" className="h-11 w-full rounded-2xl border-sky-100 bg-white px-5 text-slate-700 sm:w-auto">
                  Open screening
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Job Descriptions"
          value={loading ? 0 : jds.length}
          helper="Structured roles ready to be used by the screening engine."
          icon={BriefcaseBusiness}
        />
        <MetricCard
          label="Candidates"
          value={loading ? 0 : candidates.length}
          helper="Candidate profiles already parsed and available for selection."
          icon={Users}
        />
        <MetricCard
          label="Completed Screenings"
          value={loading ? 0 : sortedScreenings.length}
          helper="Stored fit results that can feed ranking and recruiter handoff reports."
          icon={TrendingUp}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:gap-6">
        <Card className="border border-sky-100 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-slate-900">Readiness</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Three checks to tell whether the workspace is ready for recruiter decision-making.
            </p>

            <div className="mt-5 space-y-3">
              {readinessChecks.map((item) => (
                <div key={item.label} className="flex flex-col gap-2 rounded-2xl border border-sky-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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

        <Card className="border border-sky-100 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-slate-900">Suggested flow</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              A simpler four-step sequence from role setup to shortlist review.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "1. Define the role",
                  desc: "Create one job description with clear skills and expectations.",
                  href: "/job-descriptions",
                },
                {
                  title: "2. Upload candidates",
                  desc: "Bring candidate CVs into the workspace and inspect the parse quality.",
                  href: "/candidates",
                },
                {
                  title: "3. Run screening",
                  desc: "Use a small batch first, then expand when the fit quality is reliable.",
                  href: "/screening",
                },
                {
                  title: "4. Rank and export",
                  desc: "Compare the shortlist, then export reports for recruiter handoff.",
                  href: "/ranking",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="h-full rounded-[1.5rem] border border-sky-100 bg-slate-50/70 p-4 transition hover:border-sky-200 hover:bg-white sm:p-5"
                >
                  <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3 xl:gap-6">
        <Card className="border border-sky-100 bg-white shadow-sm xl:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-slate-900">Top results</h3>
            </div>
            <div className="mt-5 space-y-3">
              {topScreenings.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-sky-100 bg-slate-50/70 p-5 text-sm text-slate-500">
                  No screening results yet.
                </div>
              ) : (
                topScreenings.map((screening, index) => (
                  <div key={screening.id} className="flex flex-col gap-3 rounded-[1.5rem] border border-sky-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        #{index + 1} {screening.candidate?.name || "Candidate"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {screening.job_description?.title || "Stored screening result"}
                      </p>
                    </div>
                    <Badge className="rounded-full border-0 bg-sky-600 text-white">
                      {screening.overall_score.toFixed(0)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-sky-100 bg-white shadow-sm xl:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-slate-900">Recent roles</h3>
            </div>
            <div className="mt-5 space-y-3">
              {recentJds.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-sky-100 bg-slate-50/70 p-5 text-sm text-slate-500">
                  No job descriptions yet.
                </div>
              ) : (
                recentJds.map((jd) => (
                  <div key={jd.id} className="rounded-[1.5rem] border border-sky-100 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{jd.title}</p>
                        <p className="text-sm text-slate-500">{jd.department || "No department"}</p>
                      </div>
                      <Badge className="rounded-full border-0 bg-sky-50 text-sky-700">
                        {jd.required_skills.length} skills
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-sky-100 bg-white shadow-sm xl:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-slate-900">Recent candidates</h3>
            </div>
            <div className="mt-5 space-y-3">
              {recentCandidates.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-sky-100 bg-slate-50/70 p-5 text-sm text-slate-500">
                  No candidate CVs uploaded yet.
                </div>
              ) : (
                recentCandidates.map((candidate) => (
                  <div key={candidate.id} className="flex flex-col gap-3 rounded-[1.5rem] border border-sky-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{candidate.name || "Unnamed candidate"}</p>
                      <p className="truncate text-sm text-slate-500">{candidate.email || "No email detected"}</p>
                    </div>
                    <Badge className="rounded-full border-0 bg-sky-50 text-sky-700">
                      Parsed
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
