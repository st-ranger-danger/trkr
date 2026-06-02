# trkr

Personal task tracker with a built-in Claude assistant (chat + voice).

- **App:** Next.js 16 (App Router) + React 19 + Tailwind v4
- **Data/Auth:** Supabase (Postgres + Auth — magic link & Google)
- **AI:** Claude (`anthropic/claude-haiku-4.5`) via Vercel AI Gateway, AI SDK v6 tool calling
  - ⚠️ Free tier only supports Haiku. To upgrade to Sonnet/Opus: add payment method to Vercel AI Gateway, then update `MODEL` in `src/app/api/chat/route.ts`
- **Voice:** Browser Web Speech API
- **Hosting:** Vercel — production at https://trkr.st-range.dev
- **Code:** https://github.com/st-ranger-danger/trkr (auto-deploys on push to main)

The assistant can create, update, complete, delete, and query tasks in natural
language (typed or spoken), and answer general questions.

## Local development

```bash
npm install
vercel env pull .env.local   # pulls Supabase vars + VERCEL_OIDC_TOKEN for AI Gateway
npm run dev
```

Sign in works locally out of the box (Supabase's default Site URL is `localhost:3000`).

## Project resources

- Supabase project: `trkr` (`vapnikqefesbqukpqtdg`), org `st-range`
- Vercel project: `trkr`, team `st-ranger-dangers-projects`

## Remaining setup (requires dashboard access)

1. **DNS (Cloudflare)** — add a record so `trkr.st-range.dev` resolves to Vercel:
   `CNAME  trkr  →  cname.vercel-dns.com`  (or `A  trkr  →  76.76.21.21`).
   Vercel verifies and issues SSL automatically.

2. **Supabase Auth URLs** — Dashboard → Authentication → URL Configuration:
   - Site URL: `https://trkr.st-range.dev`
   - Redirect URLs: `https://trkr.st-range.dev/auth/callback`,
     `http://localhost:3000/auth/callback`

3. **AI Gateway billing** — chat/voice need a credit card on file to unlock the free
   monthly credits: https://vercel.com/st-ranger-dangers-projects/~/ai

4. **Google sign-in (optional)** — add Google OAuth credentials in Supabase
   (Authentication → Providers → Google). Magic-link login works without this.

## Schema

`public.tasks` — see the `create_tasks_table` migration. RLS grants the
`authenticated` role full access (single-user app).
