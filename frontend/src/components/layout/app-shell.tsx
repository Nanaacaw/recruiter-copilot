"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { api } from "@/lib/api";
import { Loader2, ShieldCheck } from "lucide-react";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const [authStatus, setAuthStatus] = useState<AuthStatus>(isLoginPage ? "authenticated" : "checking");

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let ignore = false;

    api
      .me()
      .then((status) => {
        if (ignore) return;
        if (status.authenticated) {
          setAuthStatus("authenticated");
          return;
        }
        setAuthStatus("unauthenticated");
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .catch(() => {
        if (ignore) return;
        setAuthStatus("unauthenticated");
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      });

    return () => {
      ignore = true;
    };
  }, [isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authStatus !== "authenticated") {
    const checkingAuth = authStatus === "checking";

    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center bg-sky-50/50 px-4">
        <div className="soft-panel max-w-sm rounded-[1.75rem] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            {checkingAuth ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            {checkingAuth ? "Checking your session" : "Redirecting to login"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Keeping candidate data and AI screening actions behind a private workspace.
          </p>
        </div>
      </main>
    );
  }

  return (
    <TooltipProvider>
      <Sidebar />
      <main className="relative min-h-screen flex-1 overflow-x-hidden lg:ml-72">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.08),transparent_22%),radial-gradient(circle_at_85%_15%,rgba(244,114,182,0.08),transparent_20%)]" />
        <div className="relative z-10">
          <AppTopbar />
          {children}
        </div>
      </main>
    </TooltipProvider>
  );
}
