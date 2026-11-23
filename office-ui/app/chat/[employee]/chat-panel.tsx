"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  created_at: string;
  from_whom: string | null;
  to_whom: string | null;
  body: string | null;
};

export default function ChatPanel({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data, error } = await supabase
        .from("office_messages")
        .select("*")
        .or(`from_whom.eq.${slug},to_whom.eq.${slug}`)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) {
        setError(error.message);
        return;
      }
      setMessages((data ?? []) as Message[]);
    }

    refresh();
    const channel = supabase
      .channel(`chat-${slug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "office_messages" },
        refresh,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("office_messages")
      .insert({ from_whom: "owner", to_whom: slug, body });

    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDraft("");
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="h-[55vh] space-y-3 overflow-y-auto p-4">
        {messages === null && (
          <p className="text-sm text-slate-500">بيحمّل...</p>
        )}
        {messages?.length === 0 && (
          <p className="text-sm text-slate-500">
            مفيش رسايل. اكتب حاجة تحت — الـOffice Manager بيقرأ الرسايل دي
            ويوزّعها.
          </p>
        )}
        {messages?.map((m) => {
          const mine = m.from_whom === "owner";
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  mine
                    ? "bg-sky-600 text-white"
                    : "border border-slate-800 bg-slate-950 text-slate-100"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-[11px] text-slate-400">
                    {m.from_whom === "om" ? "Office Manager" : name}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={`mt-1 text-[10px] ${mine ? "text-sky-100/70" : "text-slate-500"}`}
                  dir="ltr"
                >
                  {new Date(m.created_at).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={send}
        className="flex gap-2 border-t border-slate-800 p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`اكتب لـ${name}...`}
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-40"
        >
          ابعت
        </button>
      </form>

      {error && (
        <p className="border-t border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-200" dir="ltr">
          {error}
        </p>
      )}
    </div>
  );
}
