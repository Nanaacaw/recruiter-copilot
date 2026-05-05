"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  FileText,
  Users,
  MagnifyingGlass,
  ChartBar,
  DownloadSimple,
  Sparkle,
  ShieldCheck,
  List,
  SignOut,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { HealthStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const navItems = [
  { href: "/", label: "Dashboard", icon: SquaresFour },
  { href: "/job-descriptions", label: "Job Descriptions", icon: FileText },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/screening", label: "Screening", icon: MagnifyingGlass },
  { href: "/ranking", label: "Ranking", icon: ChartBar },
  { href: "/export", label: "Export", icon: DownloadSimple },
];

const providerLabels: Record<string, string> = {
  gemini: "Google Gemini AI",
  openai: "OpenAI-compatible LLM",
  claude: "Anthropic Claude",
  ollama: "Ollama LLM",
};

const providerColors: Record<string, string> = {
  gemini: "bg-primary",
  openai: "bg-primary",
  claude: "bg-primary",
  ollama: "bg-primary",
};

function SidebarPanel({
  pathname,
  aiStatus,
  onLogout,
  onNavigate,
  mobile = false,
}: {
  pathname: string;
  aiStatus: HealthStatus | null;
  onLogout: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const provider = (aiStatus?.ai_provider || "openai").toLowerCase();
  const providerLabel = providerLabels[provider] || provider;
  const backendHealthy = aiStatus?.status === "healthy";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden bg-card/80 backdrop-blur-3xl shadow-[4px_0_24px_-12px_rgba(14,165,233,0.1)]",
        mobile ? "rounded-xl border border-white/40" : "border-r border-white/40"
      )}
    >
      <div className="relative border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkle className="h-5 w-5" weight="fill" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">AI Screening</h1>
            <p className="text-[11px] font-medium text-muted-foreground">Copilot Workspace</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/50 bg-white/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>Runtime</span>
            <span className={backendHealthy ? "text-[#346538]" : "text-[#9F2F2D]"}>
              {backendHealthy ? "Live" : "Unknown"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${backendHealthy ? "bg-[#346538]" : "bg-[#9F2F2D]"}`} />
            <p className="text-sm font-semibold text-foreground">{providerLabel}</p>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{aiStatus?.ai_model || "qwen2.5:7b"}</p>
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
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
              )}
            >
              <item.icon
                weight={isActive ? "fill" : "regular"}
                className={cn("h-[18px] w-[18px]", isActive ? "text-foreground" : "text-muted-foreground")}
              />
              {item.label}
              {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)]" />}
            </Link>
          );
        })}
        </div>
      </nav>

      <div className="relative border-t border-border p-4">
        <div className="rounded-xl border border-white/50 bg-white/40 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI Control
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{providerLabel}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{aiStatus?.ai_model || "qwen2.5:7b"}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className={cn("h-full w-2/3 rounded-full bg-primary")} />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Current workspace status and provider mapping.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="mt-4 h-10 w-full rounded-full border-white/60 bg-white/50 text-muted-foreground hover:bg-white hover:text-foreground shadow-sm transition-all"
          >
            <SignOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
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

  const handleLogout = () => {
    api.clearToken();
    window.location.href = "/login";
  };

  return (
    <>
      <div className="fixed left-4 top-4 z-40 md:left-6 md:top-5 lg:hidden">
        <Button
          variant="outline"
          size="icon-lg"
          className="h-11 w-11 rounded-lg border-border bg-background text-foreground shadow-sm"
          onClick={() => setMobileOpen(true)}
        >
          <List className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </div>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 lg:flex">
        <SidebarPanel pathname={pathname} aiStatus={aiStatus} onLogout={handleLogout} />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          className="left-4 top-4 h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] max-w-none -translate-x-0 -translate-y-0 overflow-hidden border border-border bg-transparent p-0"
          showCloseButton={false}
        >
          <SidebarPanel
            pathname={pathname}
            aiStatus={aiStatus}
            mobile
            onLogout={handleLogout}
            onNavigate={() => setMobileOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
