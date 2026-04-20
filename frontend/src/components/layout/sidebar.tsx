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
  Download,
  Sparkles,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { HealthStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/job-descriptions", label: "Job Descriptions", icon: FileText },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/screening", label: "Screening", icon: Search },
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
  { href: "/export", label: "Export", icon: Download },
];

const providerLabels: Record<string, string> = {
  gemini: "Google Gemini AI",
  openai: "OpenAI-compatible LLM",
  claude: "Anthropic Claude",
  ollama: "Ollama LLM",
};

const providerColors: Record<string, string> = {
  gemini: "from-sky-400 to-blue-500",
  openai: "from-cyan-400 to-blue-500",
  claude: "from-amber-400 to-orange-500",
  ollama: "from-blue-400 to-indigo-500",
};

function SidebarPanel({
  pathname,
  aiStatus,
  onNavigate,
  mobile = false,
}: {
  pathname: string;
  aiStatus: HealthStatus | null;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const provider = (aiStatus?.ai_provider || "openai").toLowerCase();
  const providerLabel = providerLabels[provider] || provider;
  const providerColor = providerColors[provider] || "from-slate-500 to-cyan-400";
  const backendHealthy = aiStatus?.status === "healthy";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(250,252,255,0.98),rgba(237,246,255,0.98))]",
        mobile ? "rounded-[1.75rem]" : "border-r border-sky-100/90"
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 blueprint-grid opacity-55" />
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
      </div>

      <div className="relative border-b border-sky-100/90 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 shadow-lg shadow-sky-200/80">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">AI Screening</h1>
            <p className="text-[11px] font-medium text-slate-500">Copilot Workspace</p>
          </div>
        </div>

        <div className="sky-card mt-4 rounded-2xl p-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <span>Runtime</span>
            <span className={backendHealthy ? "text-emerald-600" : "text-amber-600"}>
              {backendHealthy ? "Live" : "Unknown"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${backendHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
            <p className="text-sm font-semibold text-slate-900">{providerLabel}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{aiStatus?.ai_model || "qwen2.5:7b"}</p>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-slate-900 shadow-lg shadow-sky-100/90 ring-1 ring-sky-100"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn("h-[18px] w-[18px]", isActive ? "text-blue-600" : "text-slate-400")}
              />
              {item.label}
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
            </Link>
          );
        })}
        </div>
      </nav>

      <div className="relative border-t border-sky-100/90 p-4">
        <div className="sky-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI Control
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{providerLabel}</p>
          <p className="text-[11px] text-slate-500">{aiStatus?.ai_model || "qwen2.5:7b"}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
            <div className={cn("h-full w-2/3 rounded-full bg-gradient-to-r", providerColor)} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Current workspace status and provider mapping.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [aiStatus, setAiStatus] = useState<HealthStatus | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <>
      <div className="fixed left-4 top-4 z-40 md:left-6 md:top-5 lg:hidden">
        <Button
          variant="outline"
          size="icon-lg"
          className="h-11 w-11 rounded-2xl border-sky-100 bg-white/92 text-slate-700 shadow-lg shadow-sky-100/80 backdrop-blur"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </div>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 lg:flex">
        <SidebarPanel pathname={pathname} aiStatus={aiStatus} />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          className="left-4 top-4 h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] max-w-none -translate-x-0 -translate-y-0 overflow-hidden border border-sky-100 bg-transparent p-0 shadow-2xl shadow-sky-200/70"
        >
          <SidebarPanel
            pathname={pathname}
            aiStatus={aiStatus}
            mobile
            onNavigate={() => setMobileOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
