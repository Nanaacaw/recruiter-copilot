"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { HealthStatus } from "@/types";
import { Heartbeat, Robot, Graph, SlidersHorizontal } from "@phosphor-icons/react";

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
    <div className="sticky top-0 z-30 border-b border-white/40 bg-white/40 backdrop-blur-2xl shadow-sm">
      <div className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="relative flex min-w-0 flex-col gap-4 pl-14 sm:pl-16 lg:pl-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <button className="minimal-button mb-2 hidden h-8 items-center justify-center px-3 sm:flex w-fit">
              <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs font-medium">Filter view</span>
            </button>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">{meta.title}</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-start lg:justify-end">
            <Badge className="badge-pale-blue rounded-full px-3 py-1.5 text-[11px] font-mono tracking-wider uppercase border-0">
              <Graph className="mr-1.5 h-3.5 w-3.5" />
              Recruiter Flow
            </Badge>
            <Badge className="badge-pale-green rounded-full px-3 py-1.5 text-[11px] font-mono tracking-wider uppercase border-0">
              <Heartbeat className="mr-1.5 h-3.5 w-3.5" />
              {health?.status === "healthy" ? "Backend Healthy" : "Backend Unknown"}
            </Badge>
            <Badge className="badge-pale-yellow rounded-full px-3 py-1.5 text-[11px] font-mono tracking-wider uppercase border-0">
              <Robot className="mr-1.5 h-3.5 w-3.5" />
              {(health?.ai_provider || "openai").toUpperCase()} / {health?.ai_model || "qwen2.5:7b"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
