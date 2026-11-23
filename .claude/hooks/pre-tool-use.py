#!/usr/bin/env python3
"""PreToolUse gate — طارق's tripwire.

Claude Code sends a JSON object on stdin describing the tool call. This hook
classifies it and does one of three things:

  DENY  — the four irreversible/outbound classes. Writes a request to
          office/security/queue/ so the Office Manager can route it to the
          `security` subagent, and denies the call.
  WARN  — logged to office/log/<date>.jsonl, call proceeds. For classes that
          are worth an audit trail but not worth stopping work.
  PASS  — silent.

RELEASE PATH: a denied call is released if a queue entry with the same
fingerprint carries a verdict of "allow". That entry is then marked consumed,
so one approval releases exactly one call and not a class of calls.

Owner-authorized calibration, 2026-11-23: the previous version denied all
seven classes and blocked four legitimate actions and zero illegitimate ones,
with no way to release any of them. See office/approvals/20261123-001.

Protocol: https://code.claude.com/docs/en/hooks
"""
import hashlib
import json
import os
import re
import sys
import time
import uuid

ROOT = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
QUEUE = os.path.join(ROOT, "office", "security", "queue")
LOGDIR = os.path.join(ROOT, "office", "log")

SECRET_WORDS = r"SERVICE_ROLE|SECRET_KEY|API_KEY|PRIVATE_KEY|credentials\.json"

# (rule, action, tool-name regex, arg regex or None)
RULES = [
    # --- DENY: irreversible, outbound, or costs money ---
    ("spends_money", "deny",
     r"mcp__.*__(buy|purchase|upgrade|charge|payout|update_budget|create_campaign)", None),
    ("outbound_message", "deny",
     r"mcp__.*__(send|post|reply|message|email|tweet)", None),
    ("production_push", "deny", r"^Bash$",
     r"\bgit\s+push\b|\bvercel\s+(deploy|--prod)\b|\bsupabase\s+db\s+push\b|\bprisma\s+migrate\s+deploy\b"),
    ("production_push", "deny",
     r"^mcp__Vercel__(create_deployment|request_promote|assign_alias|buy_domain|create_or_transfer_domain)$", None),
    ("destructive_delete", "deny", r"^Bash$",
     r"\brm\s+-[a-zA-Z]*[rf]|\bgit\s+clean\s+-[a-zA-Z]*f|\bDROP\s+TABLE\b|\bTRUNCATE\b|\bdelete\s+from\b"),
    ("destructive_delete", "deny",
     r"mcp__.*__(delete|destroy|drop|pause_project|restore)", None),

    # --- WARN: audit, do not stop work ---
    # A real secret file is already walled off by permissions.deny in
    # settings.json. This rule existed to catch the *string*, which fired on
    # documentation that merely named a path. Logged, not denied.
    ("credential_mention", "warn", r"^(Bash|Read|Write|Edit)$", SECRET_WORDS),
    ("db_write", "warn", r"^mcp__Supabase__(apply_migration|execute_sql)$", None),
]


def fingerprint(tool, tool_input):
    blob = json.dumps(tool_input, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256((tool + "\n" + blob).encode("utf-8")).hexdigest()[:16]


def classify(tool, tool_input):
    blob = json.dumps(tool_input, ensure_ascii=False)
    for rule, action, tool_re, arg_re in RULES:
        if not re.search(tool_re, tool):
            continue
        if arg_re is None or re.search(arg_re, blob, re.IGNORECASE):
            return rule, action
    return None, None


def log(entry):
    try:
        os.makedirs(LOGDIR, exist_ok=True)
        path = os.path.join(LOGDIR, time.strftime("%Y-%m-%d") + ".jsonl")
        entry.setdefault("ts", time.strftime("%Y-%m-%dT%H:%M:%S%z"))
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass  # a failed log must never block a call


def find_release(fp):
    """Return the path of an unconsumed queue entry whose verdict allows fp."""
    if not os.path.isdir(QUEUE):
        return None
    for name in sorted(os.listdir(QUEUE)):
        if not name.endswith(".json"):
            continue
        path = os.path.join(QUEUE, name)
        try:
            with open(path, encoding="utf-8") as fh:
                entry = json.load(fh)
        except Exception:
            continue
        if entry.get("fingerprint") != fp or entry.get("consumed"):
            continue
        verdict = entry.get("verdict")
        if isinstance(verdict, dict) and verdict.get("verdict") == "allow":
            return path
    return None


def consume(path):
    try:
        with open(path, encoding="utf-8") as fh:
            entry = json.load(fh)
        entry["consumed"] = True
        entry["consumed_at"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(entry, fh, ensure_ascii=False, indent=2)
    except Exception:
        pass


def main():
    try:
        event = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # never break the session on a malformed event

    tool = event.get("tool_name", "")
    tool_input = event.get("tool_input", {}) or {}

    rule, action = classify(tool, tool_input)
    if not rule:
        sys.exit(0)

    # Read-only SQL is not a write.
    if rule == "db_write":
        q = str(tool_input.get("query", "")).strip().lower()
        if q.startswith(("select", "with", "explain", "show")):
            sys.exit(0)

    if action == "warn":
        log({"actor": "gate", "event": "warn", "rule": rule, "tool": tool})
        sys.exit(0)

    fp = fingerprint(tool, tool_input)

    released = find_release(fp)
    if released:
        consume(released)
        log({"actor": "gate", "event": "released", "rule": rule, "tool": tool,
             "fingerprint": fp, "request": os.path.basename(released)})
        sys.exit(0)

    req_id = time.strftime("%Y%m%dT%H%M%S") + "-" + uuid.uuid4().hex[:6]
    os.makedirs(QUEUE, exist_ok=True)
    path = os.path.join(QUEUE, req_id + ".json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({
            "id": req_id,
            "rule": rule,
            "fingerprint": fp,
            "tool": tool,
            "tool_input": tool_input,
            "session_id": event.get("session_id"),
            "cwd": event.get("cwd"),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "verdict": None,
            "consumed": False,
        }, fh, ensure_ascii=False, indent=2)

    log({"actor": "gate", "event": "denied", "rule": rule, "tool": tool,
         "fingerprint": fp, "request": req_id + ".json"})

    reason = (
        f"BLOCKED by security gate [{rule}]. Request written to "
        f"office/security/queue/{req_id}.json (fingerprint {fp}). Do not work "
        f"around the gate. Invoke the `security` subagent on that file, write "
        f"its one-line JSON verdict into the file's `verdict` field, then: "
        f"allow -> retry the identical call once, which the gate will release; "
        f"needs_owner -> post to office/approvals/ and stop; "
        f"block -> tell the owner and propose an alternative."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
