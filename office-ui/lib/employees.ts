// The roster the floor plan draws. Slugs must match office/org-chart.yaml and
// .claude/agents/<slug>.md, because /chat/<slug> writes messages addressed to
// that slug and the Office Manager reads them by slug.

export type Employee = {
  slug: string;
  name: string;
  role: string;
  dept: string;
  hired: boolean;
  // Desk position on the floor plan, in the SVG's 1000x620 coordinate space.
  desk: { x: number; y: number };
};

export const OM_SLUG = "om";

export const EMPLOYEES: Employee[] = [
  { slug: "security",    name: "طارق", role: "Security Officer", dept: "Security",   hired: true,  desk: { x: 80,  y: 430 } },
  { slug: "accountant",  name: "سامي", role: "Accountant",       dept: "Finance",    hired: false, desk: { x: 320, y: 110 } },
  { slug: "cfo",         name: "هشام", role: "CFO",              dept: "Finance",    hired: false, desk: { x: 530, y: 110 } },
  { slug: "secretary",   name: "عمر",  role: "Secretary / EA",   dept: "Operations", hired: false, desk: { x: 320, y: 300 } },
  { slug: "media-buyer", name: "منى",  role: "Media Buyer",      dept: "Growth",     hired: false, desk: { x: 530, y: 300 } },
  { slug: "trainer",     name: "نور",  role: "Trainer / HR",     dept: "People",     hired: false, desk: { x: 760, y: 110 } },
  { slug: "lawyer",      name: "رامي", role: "Lawyer",           dept: "Legal",      hired: false, desk: { x: 760, y: 300 } },
];

export function employeeBySlug(slug: string): Employee | undefined {
  return EMPLOYEES.find((e) => e.slug === slug);
}

export const STATUSES = [
  "queued",
  "in_progress",
  "awaiting_review",
  "awaiting_approval",
  "blocked",
  "done",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  queued: "في الانتظار",
  in_progress: "شغال",
  awaiting_review: "مراجعة",
  awaiting_approval: "موافقتك",
  blocked: "متوقف",
  done: "خلص",
};

// Tailwind classes per column, so the board reads at a glance.
export const STATUS_ACCENT: Record<Status, string> = {
  queued: "border-slate-600",
  in_progress: "border-sky-500",
  awaiting_review: "border-violet-500",
  awaiting_approval: "border-amber-500",
  blocked: "border-rose-500",
  done: "border-emerald-500",
};
