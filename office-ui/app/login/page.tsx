"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("sent");
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="text-lg font-semibold text-slate-100">دخول المكتب</h1>
      <p className="mt-1 text-sm text-slate-400">
        هنبعت لك لينك على الإيميل. مفيش باسوورد.
      </p>

      {state === "sent" ? (
        <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-200">
          بعتنا اللينك على <span className="font-medium">{email}</span>. افتح
          الإيميل ودوس عليه.
        </div>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-3">
          <input
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            {state === "sending" ? "بنبعت..." : "ابعت اللينك"}
          </button>
          {state === "error" && (
            <p className="text-sm text-rose-400" dir="ltr">
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
