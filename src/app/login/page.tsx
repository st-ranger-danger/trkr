"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const supabase = createClient();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage(`Check ${email} for a sign-in link.`);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm trkr-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-xl font-bold text-white">
            t
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">trkr</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Sign in to your task tracker
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
          <form onSubmit={sendMagicLink} className="space-y-3">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {status === "sending"
                ? "Sending…"
                : status === "sent"
                  ? "Link sent"
                  : "Send magic link"}
            </button>
          </form>

          {message && (
            <p
              className={`mt-4 text-center text-sm ${
                status === "error" ? "text-[var(--danger)]" : "text-[var(--text-muted)]"
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-4 text-center text-xs text-[var(--text-faint)]">
            We&apos;ll email you a one-time sign-in link.
          </p>
        </div>
      </div>
    </main>
  );
}
