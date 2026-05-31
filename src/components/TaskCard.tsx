import {
  PRIORITY_COLOR,
  PROJECT_STYLE,
  formatDue,
  type Task,
  type DueTone,
} from "@/lib/tasks";

const DUE_TONE: Record<DueTone, string> = {
  overdue: "var(--danger)",
  today: "var(--warn)",
  soon: "var(--warn)",
  normal: "var(--text-faint)",
};

export default function TaskCard({
  task,
  onToggle,
  onClick,
}: {
  task: Task;
  onToggle: () => void;
  onClick: () => void;
}) {
  const due = formatDue(task.due_date);
  const proj = PROJECT_STYLE[task.project];

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] trkr-fade-in"
      style={{ opacity: task.done ? 0.45 : 1 }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={task.done ? "Reopen task" : "Complete task"}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition"
        style={{
          borderColor: task.done ? "#6FBF73" : "var(--border-strong)",
          background: task.done ? "#6FBF73" : "transparent",
        }}
      >
        {task.done && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5l2.5 2.5 4.5-5"
              stroke="#0b0b0e"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm leading-snug"
          style={{ textDecoration: task.done ? "line-through" : "none" }}
        >
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              color: proj.fg,
              background: proj.bg,
              border: `1px solid ${proj.border}`,
            }}
          >
            {task.project}
          </span>
          {due && (
            <span
              className="text-[11px] font-medium"
              style={{ color: DUE_TONE[due.tone] }}
            >
              {due.label}
            </span>
          )}
        </div>
      </div>

      <span
        title={task.priority}
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: PRIORITY_COLOR[task.priority] }}
      />
    </div>
  );
}
