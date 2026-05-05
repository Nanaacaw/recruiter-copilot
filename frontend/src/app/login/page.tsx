"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { LockKey, ShieldCheck, Sparkle } from "@phosphor-icons/react";

function nextPathFromLocation() {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login({ username, password });
      api.setToken(response.access_token);
      router.replace(nextPathFromLocation());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-background px-4 py-10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="glass-panel w-full max-w-md relative z-10"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
              Private recruiter workspace
            </div>
            <h1 className="mt-6 font-heading text-3xl font-semibold text-foreground">Sign in to continue</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Protect candidate data, CV uploads, and AI screening actions from public traffic.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Sparkle className="h-7 w-7" weight="fill" />
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Username</Label>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="h-14 rounded-xl border-white/50 bg-white/50 shadow-sm text-base"
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="h-14 rounded-xl border-white/50 bg-white/50 shadow-sm text-base"
              placeholder="Your password"
            />
          </div>

          {error ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl border border-rose-200/50 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 font-medium shadow-sm"
            >
              {error}
            </motion.div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="premium-button h-14 w-full flex items-center justify-center gap-2 mt-8 text-base"
          >
            <LockKey className="h-5 w-5" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
