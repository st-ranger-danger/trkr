# trkr — Personal Task Tracker with Claude Assistant

**Date:** 2026-05-31
**Deploy target:** https://trkr.st-range.dev (Vercel team `st-ranger-danger's projects`)

## Summary

A single-user task tracker with a built-in Claude assistant (chat + voice) that can
create, update, complete, delete, and query tasks in natural language, and answer
general questions. Built on Next.js (App Router) + Supabase + Vercel AI Gateway.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4 (dark theme) |
| Data | Supabase Postgres (project `trkr` / `vapnikqefesbqukpqtdg`) |
| Auth | Supabase Auth — email magic link + Google OAuth (single user) |
| AI | Claude via Vercel AI Gateway (`anthropic/claude-sonnet-4.6`), AI SDK v6 tool calling |
| Voice | Browser Web Speech API (speech-to-text → chat pipeline) |
| Hosting | Vercel |

## Data model

`public.tasks`:
- `id uuid pk`
- `title text not null`
- `project text` ∈ {EDP, TiME, Marked, Admin, Other}
- `priority text` ∈ {critical, high, medium, low}
- `due_date date null`
- `notes text null`
- `done boolean default false`
- `created_at`, `updated_at timestamptz`

RLS: enabled; single policy granting `authenticated` role full access (single-user app).

## Features

**Tracker**
- List sorted by priority (critical→low) then due date asc
- Add / edit (modal) / complete / reopen / delete (confirm)
- Filters: status (open/done/all), project, priority — persisted in URL params
- Stats bar: open / critical / high / completed counts
- Due-date display: "due today", "due tomorrow", "due in Xd", "Xd overdue", "due MMM D"
- Done tasks: 45% opacity + strikethrough

**Assistant (chat + voice)**
- Docked chat panel using AI SDK `useChat`
- `/api/chat` route streams Claude through AI Gateway with server-side tools:
  `list_tasks`, `create_task`, `update_task`, `set_task_done`, `delete_task`
- Tools execute against Supabase under the user's authenticated session (RLS applies)
- Plain Q&A supported (acts like normal Claude when no task action is needed)
- Voice: tap mic → Web Speech API transcript → sent through the same chat pipeline
- Board refetches on chat turn completion so AI-driven changes appear live

## Design tokens

- Priority dots: critical `#E24B4A`, high `#EF9F27`, medium `#378ADD`, low `#888780`
- Project tags (dark-mode adaptations of the source palette): EDP blue, TiME purple,
  Marked green, Admin warm gray, Other amber — translucent bg + light accent text

## Auth flow

- `proxy.ts` refreshes the Supabase session and redirects unauthenticated users to `/login`
- `/login` offers magic link (works out of the box) and Google (requires OAuth creds in
  Supabase dashboard)
- `/auth/callback` exchanges the PKCE `code` for a session (both providers)

## Out of scope

Multi-user, per-task comments, recurring tasks, push notifications, native mobile.
