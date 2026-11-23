# State of This Office

Last updated: 2026-11-23 (scaffolded, not yet in production)

## Roster
See `org-chart.yaml`. Only **طارق (security)** is marked `active`. Everyone
else is scaffolded but `not_hired` — the owner activates them one at a time
per the scaling path below.

## Active projects
_None yet._

## Clients
_None yet._

## Scaling path
- **Month 1–2:** طارق + سامي + عمر. Confirm they work correctly.
- **Month 3–4:** add منى (media buyer) + نور (trainer).
- **Month 5–6:** add رامي (lawyer) + هشام (CFO). Start scheduled tasks.
- **Month 7+:** build the UI and connect the team.

## Open setup items
- [ ] Replace `<OWNER_NAME>`, `<AMOUNT>`, `<COMPANY_NAME>` placeholders
      (`grep -rn '<OWNER_NAME>\|<AMOUNT>\|<COMPANY_NAME>' .`)
- [ ] Create the Supabase project, run `supabase/schema.sql`
- [ ] Set `SUPABASE_ACCESS_TOKEN` and `--project-ref` in `.claude/settings.json`
- [ ] Connect Gmail / Stripe / Zoho / Meta Ads MCP servers, then widen each
      agent's `tools:` list
- [ ] Write `office/style/owner-voice.md` from 10 real emails the owner wrote
- [ ] Fill in the playbooks (they are stubs right now)

## Warning the owner agreed to
Do not fire a human on the strength of these agents. Keep human review of AI
accounting output for at least two months. Hallucinated numbers in Egyptian
books mean real tax exposure.
