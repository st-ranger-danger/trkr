"use client";

import { useEffect, useRef, useState } from "react";
import {
  PROJECTS,
  PRIORITIES,
  type Task,
  type Project,
  type Priority,
} from "@/lib/tasks";
import type { TaskDraft } from "@/components/Dashboard";

const fieldClass =
  "w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--text-muted)]";

export default function TaskModal({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (draft: TaskDraft, id?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [project, setProject] = useState<Project>(task?.project ?? "Other");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(
      {
        title: title.trim(),
        project,
        priority,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      },
      task?.id,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl trkr-fade-in"
      >
        <h2 className="mb-4 text-base font-semibold">
          {task ? "Edit task" : "New task"}
        </h2>

        <div className="space-y-3.5">
          <div>
            <label className={labelClass}>Title</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value as Project)}
                className={fieldClass}
              >
                {PROJECTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={fieldClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
              className={`${fieldClass} resize-none`}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            {task &&
              (confirmDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="rounded-lg bg-[var(--danger)] px-3 py-2 text-sm font-medium text-white"
                >
                  Confirm delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg px-3 py-2 text-sm text-[var(--danger)] transition hover:bg-[var(--danger)]/10"
                >
                  Delete
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)]"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
