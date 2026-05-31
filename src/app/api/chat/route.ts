import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PROJECTS, PRIORITIES } from "@/lib/tasks";

export const maxDuration = 30;

// Haiku 4.5 is available on the AI Gateway free tier and is strong at tool calling.
// Switch to a Sonnet/Opus slug once the team has paid credits topped up.
const MODEL = "anthropic/claude-haiku-4.5";

const projectEnum = z.enum(PROJECTS);
const priorityEnum = z.enum(PRIORITIES);

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (local)

  const result = streamText({
    model: MODEL,
    system: `You are the assistant inside "trkr", a personal task tracker. Today is ${today}.

You help the user manage their tasks and answer general questions.

Tasks have:
- project: one of ${PROJECTS.join(", ")}
- priority: one of ${PRIORITIES.join(", ")} (critical is highest)
- due_date: optional, format YYYY-MM-DD
- notes: optional
- done: boolean

Guidelines:
- To modify or reference an existing task, first call list_tasks to find its id, then act on that id. Never invent ids.
- When the user gives a relative date ("Friday", "next week", "tomorrow"), resolve it to an absolute YYYY-MM-DD using today's date above.
- If the user doesn't specify a project, default to "Other". If they don't specify a priority, default to "medium".
- After creating/updating/completing/deleting, confirm briefly in plain language (e.g. "Added 'Call dentist' to Admin, due Fri Jun 5.").
- For questions about what's due, overdue, or counts, call list_tasks and summarize concisely.
- For general questions unrelated to tasks, just answer normally — no tools needed.
- Keep replies short and conversational. This may be read aloud, so avoid markdown tables and long lists when a sentence will do.`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
    providerOptions: {
      gateway: { user: user.id, tags: ["feature:trkr-chat"] },
    },
    tools: {
      list_tasks: tool({
        description:
          "List tasks, optionally filtered. Use this to find a task's id before updating/completing/deleting, or to answer questions about due/overdue/counts.",
        inputSchema: z.object({
          done: z
            .boolean()
            .optional()
            .describe("Filter by completion. Omit for all."),
          project: projectEnum.optional(),
          priority: priorityEnum.optional(),
          due_before: z
            .string()
            .optional()
            .describe("Only tasks due on or before this YYYY-MM-DD."),
          search: z
            .string()
            .optional()
            .describe("Case-insensitive substring match on the title."),
        }),
        execute: async (f) => {
          let q = supabase.from("tasks").select("*");
          if (f.done !== undefined) q = q.eq("done", f.done);
          if (f.project) q = q.eq("project", f.project);
          if (f.priority) q = q.eq("priority", f.priority);
          if (f.due_before) q = q.lte("due_date", f.due_before);
          if (f.search) q = q.ilike("title", `%${f.search}%`);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { tasks: data };
        },
      }),

      create_task: tool({
        description: "Create a new task.",
        inputSchema: z.object({
          title: z.string(),
          project: projectEnum.default("Other"),
          priority: priorityEnum.default("medium"),
          due_date: z
            .string()
            .nullable()
            .optional()
            .describe("YYYY-MM-DD or null."),
          notes: z.string().nullable().optional(),
        }),
        execute: async (f) => {
          const { data, error } = await supabase
            .from("tasks")
            .insert({
              title: f.title,
              project: f.project,
              priority: f.priority,
              due_date: f.due_date ?? null,
              notes: f.notes ?? null,
            })
            .select()
            .single();
          if (error) return { error: error.message };
          return { task: data };
        },
      }),

      update_task: tool({
        description:
          "Update fields on an existing task by id. Only include fields to change.",
        inputSchema: z.object({
          id: z.string(),
          title: z.string().optional(),
          project: projectEnum.optional(),
          priority: priorityEnum.optional(),
          due_date: z.string().nullable().optional(),
          notes: z.string().nullable().optional(),
        }),
        execute: async ({ id, ...fields }) => {
          const patch = Object.fromEntries(
            Object.entries(fields).filter(([, v]) => v !== undefined),
          );
          const { data, error } = await supabase
            .from("tasks")
            .update(patch)
            .eq("id", id)
            .select()
            .single();
          if (error) return { error: error.message };
          return { task: data };
        },
      }),

      set_task_done: tool({
        description: "Mark a task complete or reopen it, by id.",
        inputSchema: z.object({ id: z.string(), done: z.boolean() }),
        execute: async ({ id, done }) => {
          const { data, error } = await supabase
            .from("tasks")
            .update({ done })
            .eq("id", id)
            .select()
            .single();
          if (error) return { error: error.message };
          return { task: data };
        },
      }),

      delete_task: tool({
        description: "Permanently delete a task by id.",
        inputSchema: z.object({ id: z.string() }),
        execute: async ({ id }) => {
          const { error } = await supabase.from("tasks").delete().eq("id", id);
          if (error) return { error: error.message };
          return { deleted: id };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
