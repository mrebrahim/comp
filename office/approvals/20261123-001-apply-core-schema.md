# Approval 001 — apply core schema to Supabase project AI emp

Created: 2026-11-23 · Status: **resolved 2026-11-23 — owner approved recalibration; schema applied**

## What is being asked
Apply `supabase/schema.sql` (office_tasks, office_messages, office_approvals
+ 2 indexes + RLS on) to project `pvwtitigsdqmvexgiecy` ("AI emp",
eu-west-1). The project is currently empty: zero tables.

## Security officer verdict
`allow` — creates only, no destructive statement, nothing leaves the company,
no money, reversible.

## Why it still needs you
The PreToolUse gate denied the call and has **no release path**: it does not
read the verdict it asked for, so retrying is denied again. Charter §5 forbids
the Office Manager from editing the hook or routing around it via Bash. Only
you can unblock it.

## Recommendation
**approve + fix the gate.** Two separate decisions:

1. Let the schema be applied (low risk, verdict is `allow`).
2. Decide how the gate releases an approved call. See the options in the
   owner's reply for this task.

## What happens if you say nothing
No tables exist, so the Office Manager cannot write task state, the daily
brief has nowhere to publish status, and the UI (when built) stays blind.
Everything else in the repo is unaffected.

---

## Resolution (2026-11-23)

The owner approved recalibrating the gate. `db_write` is now a **warn**, so
the migration no longer needed a release at all — it ran and was logged.
Verified: three tables exist in `pvwtitigsdqmvexgiecy` with RLS enabled and
zero rows.

The gate now also has a working release path (allow-verdict, fingerprint
matched, single use). See `.claude/hooks/pre-tool-use.py`.
