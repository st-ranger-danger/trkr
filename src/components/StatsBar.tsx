import type { Task } from "@/lib/tasks";

type StatKey = "open" | "critical" | "high" | "completed";

type Props = {
  tasks: Task[];
  activeFilter: { status: string; priority: string };
  onStatClick: (key: StatKey) => void;
};

const stats: { key: StatKey; label: string; color: string }[] = [
  { key: "open",      label: "Open",      color: "var(--text)" },
  { key: "critical",  label: "Critical",  color: "var(--danger)" },
  { key: "high",      label: "High",      color: "var(--warn)" },
  { key: "completed", label: "Completed", color: "#6FBF73" },
];

function getActiveKey(status: string, priority: string): StatKey | null {
  if (status === "done")                                    return "completed";
  if (status === "open" && priority === "critical")         return "critical";
  if (status === "open" && priority === "high")             return "high";
  if (status === "open" && priority === "all")              return "open";
  return null; // e.g. status=all — no card highlighted
}

export default function StatsBar({ tasks, activeFilter, onStatClick }: Props) {
  const counts: Record<StatKey, number> = {
    open:      tasks.filter((t) => !t.done).length,
    critical:  tasks.filter((t) => !t.done && t.priority === "critical").length,
    high:      tasks.filter((t) => !t.done && t.priority === "high").length,
    completed: tasks.filter((t) => t.done).length,
  };

  const activeKey = getActiveKey(activeFilter.status, activeFilter.priority);
  // Dim inactive cards only when a non-default filter is active
  const shouldDim = activeKey !== null && activeKey !== "open";

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {stats.map((s) => {
        const isActive = activeKey === s.key;
        const dimmed = shouldDim && !isActive;

        return (
          <button
            key={s.key}
            onClick={() => onStatClick(s.key)}
            aria-pressed={isActive}
            className={[
              "rounded-xl border bg-[var(--surface)] px-3 py-3 text-left cursor-pointer",
              "transition-all duration-150",
              dimmed ? "opacity-[0.45] hover:opacity-100" : "opacity-100",
            ].join(" ")}
            style={{
              borderColor: isActive ? s.color : "var(--border)",
              boxShadow:   isActive ? `0 0 0 1px ${s.color}` : undefined,
            }}
          >
            <div
              className="text-2xl font-semibold tabular-nums"
              style={{ color: s.color }}
            >
              {counts[s.key]}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">{s.label}</div>
          </button>
        );
      })}
    </div>
  );
}
