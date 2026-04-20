"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

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
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fbff,#eaf6ff_48%,#ffffff)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-50" />
      <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-blue-200/50 blur-3xl" />

      <Card className="soft-panel relative w-full max-w-md overflow-hidden rounded-[2rem] border-0">
        <div className="h-1.5 gradient-blue" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Private recruiter workspace
              </div>
              <h1 className="mt-5 text-3xl font-semibold text-slate-900">Sign in to continue</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Protect candidate data, CV uploads, and AI screening actions from public traffic.
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 text-white shadow-lg shadow-sky-200">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="h-12 rounded-2xl border-sky-100 bg-white"
                placeholder="Username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-12 rounded-2xl border-sky-100 bg-white"
                placeholder="Your password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="h-12 w-full rounded-2xl border-0 gradient-blue text-white shadow-lg shadow-sky-200"
            >
              <LockKeyhole className="mr-2 h-4 w-4" />
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
