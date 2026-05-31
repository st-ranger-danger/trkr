export const PROJECTS = ["EDP", "TiME", "Marked", "Admin", "Other"] as const;
export const PRIORITIES = ["critical", "high", "medium", "low"] as const;

export type Project = (typeof PROJECTS)[number];
export type Priority = (typeof PRIORITIES)[number];

export type Task = {
  id: string;
  title: string;
  project: Project;
  priority: Priority;
  due_date: string | null; // YYYY-MM-DD
  notes: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  critical: "#E24B4A",
  high: "#EF9F27",
  medium: "#378ADD",
  low: "#888780",
};

export const PRIORITY_RANK: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// Dark-mode adaptations of the source project palette: translucent fill + light accent text.
export const PROJECT_STYLE: Record<Project, { fg: string; bg: string; border: string }> = {
  EDP: { fg: "#7FB6F2", bg: "rgba(55,138,221,0.14)", border: "rgba(55,138,221,0.35)" },
  TiME: { fg: "#AEA2F6", bg: "rgba(124,108,233,0.16)", border: "rgba(124,108,233,0.38)" },
  Marked: { fg: "#9BD06E", bg: "rgba(80,128,40,0.18)", border: "rgba(120,170,70,0.38)" },
  Admin: { fg: "#BDB9AD", bg: "rgba(120,118,110,0.16)", border: "rgba(150,148,138,0.34)" },
  Other: { fg: "#E2A85C", bg: "rgba(160,110,40,0.16)", border: "rgba(190,140,60,0.36)" },
};

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Open before done.
    if (a.done !== b.done) return a.done ? 1 : -1;
    // Priority critical → low.
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    // Due date ascending; nulls last.
    if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : 1;
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return a.created_at < b.created_at ? -1 : 1;
  });
}

export type DueTone = "overdue" | "today" | "soon" | "normal";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Format a due date relative to today. `now` defaults to the current date. */
export function formatDue(
  dueDate: string | null,
  now: Date = new Date(),
): { label: string; tone: DueTone } | null {
  if (!dueDate) return null;

  const [y, m, d] = dueDate.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = startOfDay(now);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    return { label: `${n}d overdue`, tone: "overdue" };
  }
  if (diffDays === 0) return { label: "due today", tone: "today" };
  if (diffDays === 1) return { label: "due tomorrow", tone: "soon" };
  if (diffDays <= 6) return { label: `due in ${diffDays}d`, tone: "soon" };
  return { label: `due ${MONTHS[m - 1]} ${d}`, tone: "normal" };
}
