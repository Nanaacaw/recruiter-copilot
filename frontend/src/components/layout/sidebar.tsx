"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Search,
  BarChart3,
  MessageSquare,
  Download,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { HealthStatus } from "@/types";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/job-descriptions", label: "Job Descriptions", icon: FileText },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/screening", label: "Screening", icon: Search },
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
  { href: "/interview", label: "Interview Prep", icon: MessageSquare },
  { href: "/export", label: "Export", icon: Download },
];

const providerLabels: Record<string, string> = {
  gemini: "Google Gemini AI",
  openai: "OpenAI-compatible LLM",
  claude: "Anthropic Claude",
  ollama: "Ollama LLM",
};

const providerColors: Record<string, string> = {
  gemini: "from-blue-500 to-cyan-400",
  openai: "from-emerald-500 to-teal-400",
  claude: "from-orange-500 to-amber-400",
  ollama: "from-purple-500 to-pink-400",
};

export function Sidebar() {
  const pathname = usePathname();
  const [aiStatus, setAiStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let ignore = false;
    api.health()
      .then((status) => {
        if (!ignore) setAiStatus(status);
      })
      .catch(() => {
        if (!ignore) setAiStatus(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const provider = (aiStatus?.ai_provider || "openai").toLowerCase();
  const providerLabel = providerLabels[provider] || provider;
  const providerColor = providerColors[provider] || "from-slate-500 to-cyan-400";
  const backendHealthy = aiStatus?.status === "healthy";

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col"
      style={{ background: "linear-gradient(180deg, #081126 0%, #102145 46%, #163871 100%)" }}
    >
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 shadow-inner shadow-cyan-200/10">
            <Sparkles className="h-5 w-5 text-cyan-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">AI Screening</h1>
            <p className="text-[11px] font-medium text-sky-200/80">Copilot Workspace</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-sky-200/70">
            <span>Runtime</span>
            <span className={backendHealthy ? "text-emerald-300" : "text-amber-300"}>
              {backendHealthy ? "Live" : "Unknown"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${backendHealthy ? "bg-emerald-300" : "bg-amber-300"}`} />
            <p className="text-sm font-semibold text-white">{providerLabel}</p>
          </div>
          <p className="mt-1 text-[11px] text-sky-200/75">{aiStatus?.ai_model || "qwen2.5:7b"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/14 text-white shadow-lg shadow-slate-950/35 ring-1 ring-white/10"
                  : "text-sky-100/78 hover:bg-white/7 hover:text-white"
              )}
            >
              <item.icon
                className={cn("h-[18px] w-[18px]", isActive ? "text-cyan-300" : "text-sky-200/55")}
              />
              {item.label}
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-sky-200/70">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI Control
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{providerLabel}</p>
          <p className="text-[11px] text-sky-200/75">{aiStatus?.ai_model || "qwen2.5:7b"}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className={cn("h-full w-2/3 rounded-full bg-gradient-to-r", providerColor)} />
          </div>
          <p className="mt-2 text-[10px] text-sky-200/55">
            Current workspace status and provider mapping.
          </p>
        </div>
      </div>
    </aside>
  );
}
