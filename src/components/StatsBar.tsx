import type { Task } from "@/lib/tasks";

export default function StatsBar({ tasks }: { tasks: Task[] }) {
  const open = tasks.filter((t) => !t.done).length;
  const critical = tasks.filter((t) => !t.done && t.priority === "critical").length;
  const high = tasks.filter((t) => !t.done && t.priority === "high").length;
  const done = tasks.filter((t) => t.done).length;

  const stats = [
    { label: "Open", value: open, color: "var(--text)" },
    { label: "Critical", value: critical, color: "var(--danger)" },
    { label: "High", value: high, color: "var(--warn)" },
    { label: "Completed", value: done, color: "#6FBF73" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
        >
          <div
            className="text-2xl font-semibold tabular-nums"
            style={{ color: s.color }}
          >
            {s.value}
          </div>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
