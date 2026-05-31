import { PROJECTS, PRIORITIES } from "@/lib/tasks";

type Props = {
  status: string;
  project: string;
  priority: string;
  onChange: (key: string, value: string) => void;
};

const selectClass =
  "rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] cursor-pointer";

export default function Filters({ status, project, priority, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(e) => onChange("status", e.target.value)}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="open">Open</option>
        <option value="done">Done</option>
        <option value="all">All</option>
      </select>

      <select
        value={project}
        onChange={(e) => onChange("project", e.target.value)}
        className={selectClass}
        aria-label="Filter by project"
      >
        <option value="all">All projects</option>
        {PROJECTS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={priority}
        onChange={(e) => onChange("priority", e.target.value)}
        className={selectClass}
        aria-label="Filter by priority"
      >
        <option value="all">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p[0].toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
