"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  EMPLOYEES,
  STATUSES,
  STATUS_ACCENT,
  STATUS_LABEL,
  type Status,
} from "@/lib/employees";

type Task = {
  id: string;
  created_at: string;
  subject: string | null;
  body: string | null;
  assignee: string | null;
  status: Status;
  priority: number | null;
  deadline: string | null;
  last_message: string | null;
  next_action: string | null;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data, error } = await supabase
        .from("office_tasks")
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setTasks((data ?? []) as Task[]);
    }

    refresh();
    const channel = supabase
      .channel("board-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "office_tasks" },
        refresh,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-200">
        مش قادر أقرأ التاسكات: <span dir="ltr">{error}</span>
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-3">
        <h1 className="text-lg font-semibold">التاسكات</h1>
        <p className="text-sm text-slate-400">
          {tasks === null ? "بيحمّل..." : `${tasks.length} تاسك`}
        </p>
      </div>

      {tasks !== null && tasks.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
          مفيش تاسكات لحد الآن. التاسكات بتتولد لما الـOffice Manager يعمل
          triage لحاجة في <code dir="ltr">office/inbox/</code>، أو لما تبعت
          رسالة لموظف.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATUSES.map((s) => {
          const col = (tasks ?? []).filter((t) => t.status === s);
          return (
            <section
              key={s}
              className={`rounded-xl border-t-2 ${STATUS_ACCENT[s]} bg-slate-900/40 p-3`}
            >
              <header className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-medium text-slate-200">
                  {STATUS_LABEL[s]}
                </h2>
                <span className="text-xs text-slate-500">{col.length}</span>
              </header>
              <ul className="space-y-2">
                {col.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-sm font-medium text-slate-100">
                      {t.subject ?? "بدون عنوان"}
                    </p>
                    {t.last_message && (
                      <p className="mt-1 text-xs text-slate-400">
                        {t.last_message}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      {t.assignee ? (
                        <Link
                          href={`/chat/${t.assignee}`}
                          className="text-sky-400 hover:underline"
                        >
                          {nameOf(t.assignee)}
                        </Link>
                      ) : (
                        <span>مش متوزّع</span>
                      )}
                      {t.deadline && (
                        <span dir="ltr">
                          · {new Date(t.deadline).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </div>
                    {t.next_action && (
                      <p className="mt-2 border-t border-slate-800 pt-2 text-xs text-slate-400">
                        الخطوة اللي جاية: {t.next_action}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function nameOf(slug: string) {
  return EMPLOYEES.find((e) => e.slug === slug)?.name ?? slug;
}
