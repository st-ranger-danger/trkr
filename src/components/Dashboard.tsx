"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PROJECTS,
  PRIORITIES,
  sortTasks,
  type Task,
  type Project,
  type Priority,
} from "@/lib/tasks";
import StatsBar from "@/components/StatsBar";
import Filters from "@/components/Filters";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import ChatPanel from "@/components/ChatPanel";

type StatusFilter = "open" | "done" | "all";

export type TaskDraft = {
  title: string;
  project: Project;
  priority: Priority;
  due_date: string | null;
  notes: string | null;
};

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const status = (params.get("status") as StatusFilter) || "open";
  const project = params.get("project") || "all";
  const priority = params.get("priority") || "all";

  const refetch = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*");
    if (data) setTasks(sortTasks(data as Task[]));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all" || (key === "status" && value === "open")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(`/?${next.toString()}`, { scroll: false });
  }

  function handleStatClick(key: "open" | "critical" | "high" | "completed") {
    const presets = {
      open:      { status: "open",  priority: "all"      },
      critical:  { status: "open",  priority: "critical" },
      high:      { status: "open",  priority: "high"     },
      completed: { status: "done",  priority: "all"      },
    } as const;

    const preset = presets[key];
    const isActive =
      key === "completed"
        ? status === "done"
        : status === preset.status && priority === preset.priority;

    const next = new URLSearchParams(params.toString());
    if (isActive) {
      // Deselect → return to default (all open tasks)
      next.delete("status");
      next.delete("priority");
    } else {
      if (preset.status === "open") next.delete("status");
      else next.set("status", preset.status);
      if (preset.priority === "all") next.delete("priority");
      else next.set("priority", preset.priority);
    }
    router.replace(`/?${next.toString()}`, { scroll: false });
  }

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      if (status === "open" && t.done) return false;
      if (status === "done" && !t.done) return false;
      if (project !== "all" && t.project !== project) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      return true;
    });
  }, [tasks, status, project, priority]);

  async function toggleDone(task: Task) {
    setTasks((prev) =>
      sortTasks(
        prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
      ),
    );
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
    refetch();
  }

  async function saveTask(draft: TaskDraft, id?: string) {
    if (id) {
      await supabase.from("tasks").update(draft).eq("id", id);
    } else {
      await supabase.from("tasks").insert(draft);
    }
    setEditing(null);
    refetch();
  }

  async function deleteTask(id: string) {
    setEditing(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
    refetch();
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 pb-32 pt-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            t
          </div>
          <h1 className="text-lg font-semibold tracking-tight">trkr</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <span className="hidden sm:inline">{userEmail}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md px-2 py-1 transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <StatsBar
        tasks={tasks}
        activeFilter={{ status, priority }}
        onStatClick={handleStatClick}
      />

      <div className="mt-6 mb-3 flex items-center justify-between gap-3">
        <Filters
          status={status}
          project={project}
          priority={priority}
          onChange={setFilter}
        />
        <button
          onClick={() => setEditing("new")}
          className="shrink-0 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)]"
        >
          + Add
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="py-12 text-center text-sm text-[var(--text-faint)]">
            Loading tasks…
          </p>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-14 text-center">
            <p className="text-sm text-[var(--text-muted)]">No tasks here.</p>
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              Add one above, or ask the assistant to create it.
            </p>
          </div>
        ) : (
          visible.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={() => toggleDone(t)}
              onClick={() => setEditing(t)}
            />
          ))
        )}
      </div>

      {editing && (
        <TaskModal
          task={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}

      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        onTasksChanged={refetch}
      />
    </div>
  );
}

export { PROJECTS, PRIORITIES };
