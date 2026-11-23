# Office UI

Next.js app for the virtual office. Three screens plus a login.

| Route | What it does |
| --- | --- |
| `/login` | Email magic link. No password. |
| `/floor` | SVG floor plan. Each desk shows live task load; click a desk to open that employee's chat. |
| `/tasks` | Kanban across the six task statuses, live. |
| `/chat/<slug>` | Messages to and from one employee. Writes to `office_messages`. |

The app talks only to Supabase. It never talks to Claude Code directly — the
Office Manager reads `office_messages` and writes `office_tasks`, and the UI
sees those changes over Supabase Realtime. That is what keeps cost bounded:
an open browser tab costs nothing.

## Security model

- Every office table has RLS enabled with a policy bound to the
  `authenticated` role only. The `anon` role has no policy, so it reads and
  writes nothing.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is designed to ship in browser
  JavaScript. On its own it grants no access to office data.
- `middleware.ts` redirects any unauthenticated request to `/login`.
- **Anyone who can receive a magic link at an allowed email can sign in.**
  Right now that is any email address. Before this holds client data, restrict
  sign-ups: Supabase Dashboard → Authentication → Sign In / Providers → turn
  off "Allow new users to sign up", then invite only the owner.

## Running it locally

```bash
cd office-ui && npm install
```

Copy `.env.example` to `.env.local` and fill in the two values from Supabase
Dashboard → Project Settings → API. Then:

```bash
npm run dev
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Vercel → Add New → Project → import `mrebrahim/comp`.
3. **Set Root Directory to `office-ui`.** The repo root is the Claude Code
   office, not a web app; the build fails without this.
4. Add both environment variables from `.env.example` to the Vercel project,
   for Production, Preview and Development.
5. Deploy. Note the deployment URL.
6. Supabase Dashboard → Authentication → URL Configuration: set Site URL to
   that deployment URL and add `https://<your-domain>/auth/callback` to
   Redirect URLs. The magic link does not work until this is done.

## Verified

- `npm run build` passes: 8 routes, no type errors.
- Unauthenticated `/floor` and `/tasks` both 307 to `/login`.
- `/login` renders with no console errors.
- RLS policies confirmed in `pg_policies`: three tables, `{authenticated}`,
  `ALL`.

Not verified, because signing in needs a real inbox: the rendered `/floor`,
`/tasks` and `/chat` screens with a live session. They compile and type-check,
but a human has not looked at them with data in the tables.

## Known gaps

- No task-creation UI. Tasks appear when the Office Manager creates them.
  Sending a chat message is currently the only way to start work from here.
- `lib/employees.ts` duplicates the roster in `office/org-chart.yaml`. Editing
  one does not update the other.
- The floor plan desk positions are hand-placed and do not reflow on very
  narrow screens; the board scrolls horizontally below 720px.
