"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EMPLOYEES } from "@/lib/employees";

type Load = Record<string, { active: number; needsOwner: number }>;

const DESK_W = 170;
const DESK_H = 110;

export default function FloorPage() {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({});
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data } = await supabase
        .from("office_tasks")
        .select("assignee,status")
        .neq("status", "done");

      const next: Load = {};
      for (const row of data ?? []) {
        const slug = row.assignee ?? "unassigned";
        next[slug] ??= { active: 0, needsOwner: 0 };
        next[slug].active += 1;
        if (row.status === "awaiting_approval") next[slug].needsOwner += 1;
      }
      setLoad(next);
    }

    refresh();
    const channel = supabase
      .channel("floor-tasks")
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

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-3">
        <h1 className="text-lg font-semibold">خريطة المكتب</h1>
        <p className="text-sm text-slate-400">دوس على موظف تفتح شات معاه</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 p-3">
        <svg viewBox="0 0 1000 620" className="h-auto w-full min-w-[720px]">
          {/* floor */}
          <rect
            x="20"
            y="20"
            width="960"
            height="580"
            rx="16"
            fill="#0b1220"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* owner's office, bottom-right */}
          <g>
            <rect
              x="700"
              y="430"
              width="250"
              height="140"
              rx="10"
              fill="#111c2e"
              stroke="#334155"
              strokeDasharray="5 4"
            />
            <text x="825" y="492" textAnchor="middle" className="fill-slate-300 text-[15px]">
              مكتب المالك
            </text>
            <text x="825" y="516" textAnchor="middle" className="fill-slate-500 text-[12px]">
              CEO
            </text>
          </g>

          {EMPLOYEES.map((e) => {
            const l = load[e.slug] ?? { active: 0, needsOwner: 0 };
            const isHover = hover === e.slug;
            return (
              <g
                key={e.slug}
                transform={`translate(${e.desk.x},${e.desk.y})`}
                onClick={() => router.push(`/chat/${e.slug}`)}
                onMouseEnter={() => setHover(e.slug)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              >
                <rect
                  width={DESK_W}
                  height={DESK_H}
                  rx="10"
                  fill={e.hired ? "#15233a" : "#101826"}
                  stroke={
                    l.needsOwner > 0
                      ? "#f59e0b"
                      : isHover
                        ? "#38bdf8"
                        : e.hired
                          ? "#2b4566"
                          : "#1e293b"
                  }
                  strokeWidth={isHover || l.needsOwner > 0 ? 2 : 1}
                />
                <circle
                  cx="18"
                  cy="18"
                  r="5"
                  fill={!e.hired ? "#475569" : l.active > 0 ? "#38bdf8" : "#10b981"}
                />
                <text x="34" y="28" className="fill-slate-100 text-[16px] font-medium">
                  {e.name}
                </text>
                <text x="12" y="56" className="fill-slate-400 text-[11px]">
                  {e.role}
                </text>
                <text x="12" y="78" className="fill-slate-500 text-[11px]">
                  {e.hired ? `${l.active} تاسك شغال` : "مش متعيّن"}
                </text>
                {l.needsOwner > 0 && (
                  <text x="12" y="98" className="fill-amber-400 text-[11px] font-medium">
                    {l.needsOwner} مستني موافقتك
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <Legend color="#10b981" label="فاضي" />
        <Legend color="#38bdf8" label="شغال" />
        <Legend color="#f59e0b" label="مستني موافقتك" />
        <Legend color="#475569" label="مش متعيّن" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
