"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { HealthStatus } from "@/types";
import { Activity, Bot, Orbit, Workflow } from "lucide-react";

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Hiring Control Center",
    subtitle: "Track pipeline readiness, AI status, and next actions in one place.",
  },
  "/job-descriptions": {
    title: "Job Description Builder",
    subtitle: "Define hiring criteria that the screening engine can score against.",
  },
  "/candidates": {
    title: "Candidate Inbox",
    subtitle: "Collect CVs, preview parsed data, and keep inbound talent organized.",
  },
  "/screening": {
    title: "Screening Studio",
    subtitle: "Match shortlisted CVs to one role and refresh stale AI results automatically.",
  },
  "/ranking": {
    title: "Ranking Board",
    subtitle: "Review candidate order, compare strengths, and decide who moves forward.",
  },
  "/export": {
    title: "Export Center",
    subtitle: "Download candidate reports and handoff-ready recruiter artifacts.",
  },
};

function resolveRouteMeta(pathname: string) {
  if (pathname === "/") return routeMeta["/"];

  for (const [prefix, meta] of Object.entries(routeMeta)) {
    if (prefix !== "/" && pathname.startsWith(prefix)) {
      return meta;
    }
  }

  return {
    title: "AI Screening Copilot",
    subtitle: "Recruiter workflow and AI-assisted screening operations.",
  };
}

export function AppTopbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const meta = resolveRouteMeta(pathname);

  useEffect(() => {
    let ignore = false;

    api.health()
      .then((status) => {
        if (!ignore) setHealth(status);
      })
      .catch(() => {
        if (!ignore) setHealth(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b border-sky-100/90 bg-white/78 backdrop-blur-xl">
      <div className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.14),transparent_28%)]" />
        <div className="absolute inset-0 blueprint-grid opacity-40" />
        <div className="relative flex min-w-0 flex-col gap-4 pl-14 sm:pl-16 lg:pl-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              <Orbit className="h-3.5 w-3.5 text-blue-600" />
              System Workspace
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{meta.title}</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-start lg:justify-end">
            <Badge className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-slate-700">
              <Workflow className="mr-1.5 h-3.5 w-3.5" />
              Recruiter Flow
            </Badge>
            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              <Activity className="mr-1.5 h-3.5 w-3.5" />
              {health?.status === "healthy" ? "Backend Healthy" : "Backend Status Unknown"}
            </Badge>
            <Badge className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-700">
              <Bot className="mr-1.5 h-3.5 w-3.5" />
              {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
