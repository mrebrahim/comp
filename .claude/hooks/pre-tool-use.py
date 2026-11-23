#!/usr/bin/env python3
"""PreToolUse gate — طارق's tripwire.

Claude Code sends a JSON object on stdin describing the tool call. This hook
classifies it; anything risky is denied and written to office/security/queue/
so the Office Manager can route it to the `security` subagent and then to the
owner.

Protocol: print a JSON decision on stdout. See
https://code.claude.com/docs/en/hooks
"""
import json
import os
import re
import sys
import time
import uuid

ROOT = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
QUEUE = os.path.join(ROOT, "office", "security", "queue")

# (rule name, tool-name regex, command/arg regex or None)
RULES = [
    ("production_push", r"^Bash$", r"\bgit\s+push\b|\bvercel\s+(deploy|--prod)\b|\bsupabase\s+db\s+push\b|\bnpx\s+prisma\s+migrate\s+deploy\b"),
    ("destructive_delete", r"^Bash$", r"\brm\s+-[a-zA-Z]*[rf]|\bgit\s+clean\s+-[a-zA-Z]*f|\bDROP\s+TABLE\b|\bTRUNCATE\b|\bdelete\s+from\b"),
    ("credential_exposure", r"^(Bash|Read)$", r"\.env(?![a-zA-Z])|SERVICE_ROLE|SECRET_KEY|API_KEY|PRIVATE_KEY|credentials\.json"),
    ("outbound_message", r"mcp__.*__(send|post|create_draft|reply|message|email|tweet)", None),
    ("spends_money", r"mcp__.*__(buy|purchase|upgrade|charge|payout|update_budget|create_campaign)", None),
    ("db_write", r"^mcp__Supabase__(apply_migration|execute_sql)$", None),
    ("deploy", r"^mcp__Vercel__(create_deployment|request_promote|assign_alias|buy_domain|create_or_transfer_domain)$", None),
]

def classify(tool, payload):
    blob = json.dumps(payload, ensure_ascii=False)
    for name, tool_re, arg_re in RULES:
        if not re.search(tool_re, tool):
            continue
        if arg_re is None or re.search(arg_re, blob, re.IGNORECASE):
            return name
    return None

def main():
    try:
        event = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # never break the session on a malformed event

    tool = event.get("tool_name", "")
    tool_input = event.get("tool_input", {}) or {}

    rule = classify(tool, tool_input)
    if not rule:
        sys.exit(0)  # silent pass

    # SELECT-only SQL is read-only; let it through.
    if rule == "db_write":
        q = str(tool_input.get("query", "")).strip().lower()
        if q.startswith(("select", "with", "explain", "show")) and ";" not in q.rstrip(";"):
            sys.exit(0)

    req_id = time.strftime("%Y%m%dT%H%M%S") + "-" + uuid.uuid4().hex[:6]
    os.makedirs(QUEUE, exist_ok=True)
    path = os.path.join(QUEUE, req_id + ".json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(
            {
                "id": req_id,
                "rule": rule,
                "tool": tool,
                "tool_input": tool_input,
                "session_id": event.get("session_id"),
                "cwd": event.get("cwd"),
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "verdict": None,
            },
            fh,
            ensure_ascii=False,
            indent=2,
        )

    reason = (
        f"BLOCKED by security gate [{rule}]. Request written to "
        f"office/security/queue/{req_id}.json. Do not retry this call and do not "
        f"work around the gate. Invoke the `security` subagent on that file, write "
        f"its one-line JSON verdict into the file's `verdict` field, then: "
        f"allow -> retry once; needs_owner -> post to office/approvals/ and stop; "
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
