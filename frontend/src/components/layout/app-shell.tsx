"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { api } from "@/lib/api";
import { CircleNotch, ShieldCheck } from "@phosphor-icons/react";

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
      <main className="flex min-h-dvh flex-1 items-center justify-center bg-background px-4">
        <div className="glass-panel max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-sky-500/20">
            {checkingAuth ? <CircleNotch className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <p className="mt-6 text-lg font-heading font-medium tracking-tight text-foreground">
            {checkingAuth ? "Checking your session" : "Redirecting to login"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Keeping candidate data and AI screening actions behind a private workspace.
          </p>
        </div>
      </main>
    );
  }

  return (
    <TooltipProvider>
      <Sidebar />
      <main className="relative min-h-screen flex-1 overflow-x-hidden lg:ml-72 bg-background">
        <div className="relative z-10">
          <AppTopbar />
          {children}
        </div>
      </main>
    </TooltipProvider>
  );
}
