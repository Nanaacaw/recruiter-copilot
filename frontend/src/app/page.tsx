"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import type { Candidate, HealthStatus, JobDescription, Screening } from "@/types";
import {
  ArrowRight,
  Robot,
  Briefcase,
  CheckCircle,
  FileText,
  Stack,
  Target,
  ShieldCheck,
  TrendUp,
  Users,
  Clock,
  UserCircle,
  Gear,
  Columns,
  ChartLineUp,
  FileArrowUp,
} from "@phosphor-icons/react";

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ComponentType<{ className?: string; weight?: "regular" | "thin" | "light" | "bold" | "fill" | "duotone" }>;
}) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } } }} className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:scale-[1.02] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out flex flex-col justify-between h-full group">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono font-semibold mb-2">{label}</p>
          <p className="mt-2 font-heading text-5xl tracking-tighter text-slate-900 sm:text-6xl font-bold">{value}</p>
          <p className="mt-4 max-w-[24ch] text-sm leading-relaxed text-slate-500">{helper}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-100 text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6" weight="duotone" />
        </div>
      </div>
    </motion.div>
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants} 
      className="page-shell space-y-12 sm:space-y-16"
    >
      <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="relative flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
              <Target className="h-3.5 w-3.5" />
              Recruiter overview
            </div>

            <div>
              <h2 className="font-heading text-4xl tracking-tighter text-foreground sm:text-5xl md:text-6xl leading-[1.1]">
                A simpler dashboard for tracking pipeline readiness and deciding the next step.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Keep the page focused on what HR usually needs first: current totals, workspace status,
                the next move, and a short view of recent activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Badge className="badge-pale-yellow rounded-md px-3 py-1.5 text-xs font-mono uppercase border-0">
                <Robot className="mr-1.5 h-3.5 w-3.5" />
                {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
              </Badge>
              <Badge className="badge-pale-green rounded-md px-3 py-1.5 text-xs font-mono uppercase border-0">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {health?.status === "healthy" ? "Backend healthy" : "Backend unknown"}
              </Badge>
            </div>
          </div>

          <div className="w-full max-w-none rounded-[2.5rem] border border-white/60 bg-white/70 p-8 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] xl:max-w-md backdrop-blur-xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono font-semibold">Next move</p>
            <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 leading-tight">{nextMove.title}</p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{nextMove.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={nextMove.href} className="w-full sm:w-auto">
                <button className="premium-button flex h-14 w-full items-center justify-center px-8 text-sm font-semibold sm:w-auto shadow-md">
                  {nextMove.cta}
                  <ArrowRight className="ml-2 h-5 w-5" weight="bold" />
                </button>
              </Link>
              <Link href="/screening" className="w-full sm:w-auto">
                <button className="minimal-button flex h-14 w-full items-center justify-center px-8 text-sm font-semibold sm:w-auto bg-white hover:bg-slate-50">
                  Open screening
                </button>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={containerVariants} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Job Descriptions"
          value={loading ? 0 : jds.length}
          helper="Structured roles ready to be used by the screening engine."
          icon={Briefcase}
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
          icon={TrendUp}
        />
      </motion.section>

      <motion.section variants={containerVariants} className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <motion.div variants={itemVariants} className="glass-panel">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-foreground" />
            <h3 className="font-heading text-2xl tracking-tight text-foreground">Readiness</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Three checks to tell whether the workspace is ready for recruiter decision-making.
          </p>

          <div className="mt-8 space-y-4">
            {readinessChecks.map((item) => (
              <div key={item.label} className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between last:border-0 last:pb-0">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <Badge
                  className={
                    item.done
                      ? "badge-pale-green rounded-md border-0"
                      : "badge-pale-red rounded-md border-0"
                  }
                >
                  {item.done ? "Ready" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel">
          <div className="flex items-center gap-3">
            <Stack className="h-5 w-5 text-foreground" />
            <h3 className="font-heading text-2xl tracking-tight text-foreground">Suggested flow</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A simpler four-step sequence from role setup to shortlist review.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                className="group flex flex-col justify-between rounded-[2rem] border border-white/60 bg-white/50 p-8 transition-all duration-300 hover:bg-white/80 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1"
              >
                <div>
                  <h4 className="font-heading text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{item.title}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <motion.section variants={containerVariants} className="grid gap-6 xl:grid-cols-3">
        <motion.div variants={itemVariants} className="glass-panel xl:col-span-1">
          <div className="flex items-center gap-3 glass-panel-header">
            <TrendUp className="h-5 w-5 text-foreground" />
            <h3 className="font-heading text-2xl tracking-tight text-foreground">Top results</h3>
          </div>
          <div className="space-y-4">
            {topScreenings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary/20 bg-white/30 p-6 text-center text-sm text-muted-foreground font-mono">
                No screening results yet.
              </div>
            ) : (
              topScreenings.map((screening, index) => (
                <div key={screening.id} className="flex flex-col gap-3 rounded-2xl border border-white/50 bg-white/40 p-5 sm:flex-row sm:items-center sm:justify-between transition-all hover:bg-white hover:shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      #{index + 1} {screening.candidate?.name || "Candidate"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground mt-1">
                      {screening.job_description?.title || "Stored screening result"}
                    </p>
                  </div>
                  <Badge className="badge-pale-blue rounded-md border-0 font-mono">
                    {screening.overall_score.toFixed(0)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel xl:col-span-1">
          <div className="flex items-center gap-3 glass-panel-header">
            <FileText className="h-5 w-5 text-foreground" />
            <h3 className="font-heading text-2xl tracking-tight text-foreground">Recent roles</h3>
          </div>
          <div className="space-y-4">
            {recentJds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary/20 bg-white/30 p-6 text-center text-sm text-muted-foreground font-mono">
                No job descriptions yet.
              </div>
            ) : (
              recentJds.map((jd) => (
                <div key={jd.id} className="rounded-2xl border border-white/50 bg-white/40 p-5 transition-all hover:bg-white hover:shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{jd.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{jd.department || "No department"}</p>
                    </div>
                    <Badge className="badge-pale-yellow rounded-md border-0 font-mono uppercase">
                      {jd.required_skills.length} skills
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel xl:col-span-1">
          <div className="flex items-center gap-3 glass-panel-header">
            <Users className="h-5 w-5 text-foreground" />
            <h3 className="font-heading text-2xl tracking-tight text-foreground">Recent candidates</h3>
          </div>
          <div className="space-y-4">
            {recentCandidates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary/20 bg-white/30 p-6 text-center text-sm text-muted-foreground font-mono">
                No candidate CVs uploaded yet.
              </div>
            ) : (
              recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex flex-col gap-3 rounded-2xl border border-white/50 bg-white/40 p-5 sm:flex-row sm:items-center sm:justify-between transition-all hover:bg-white hover:shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{candidate.name || "Unnamed candidate"}</p>
                    <p className="truncate text-xs text-muted-foreground mt-1">{candidate.email || "No email detected"}</p>
                  </div>
                  <Badge className="badge-pale-green rounded-md border-0 uppercase font-mono text-[10px]">
                    Parsed
                  </Badge>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
