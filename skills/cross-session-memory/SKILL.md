---
name: cross-session-memory
description: Maintain memory continuity across sessions in OpenClaw workspaces. Use when users ask to preserve context, avoid session amnesia, standardize memory logging, or set up a practical memory workflow across MEMORY.md and daily memory files.
---

# Cross-Session Memory (Practical OpenClaw Edition)

This skill defines a lightweight, reliable memory workflow that works **today** in a normal OpenClaw workspace, without custom runtime hooks.

## Scope

Use this skill to:
- Keep continuity across restarts/sessions
- Record important events and decisions
- Distill daily notes into long-term memory
- Avoid storing sensitive data by default

Do **not** assume automatic runtime hook injection unless explicitly implemented by engineering.

## Canonical Files

- `MEMORY.md` → curated long-term memory (stable facts, preferences, durable decisions)
- `memory/YYYY-MM-DD.md` → daily timeline / raw notes
- `USER.md` → human profile and communication preferences
- `AGENTS.md` → workspace operating rules

Optional:
- `memory/heartbeat-state.json` for periodic check timestamps

## Default Operating Loop

1. Session start:
   - Read `SOUL.md`, `USER.md`
   - Read `memory/<today>.md` and `memory/<yesterday>.md` if present
   - In direct main session, also read `MEMORY.md`

2. During work:
   - Log only significant events into daily memory:
     - Decisions
     - User preferences
     - Important failures and fixes
     - Pending follow-ups

3. Session end / periodic maintenance:
   - Review recent daily notes
   - Promote durable items into `MEMORY.md`
   - Keep `MEMORY.md` concise and current

## What to Record

### Record in daily memory
- Timestamped events
- Work in progress
- Temporary context
- One-off issues

### Promote to long-term memory
- Repeated user preferences
- Confirmed identity/profile information
- Important recurring workflows
- Lasting constraints and decisions

### Avoid storing by default
- Credentials, tokens, private secrets
- Sensitive personal data not needed for future work

## Daily Memory Template

When creating a new daily file (`memory/YYYY-MM-DD.md`), use:

```markdown
# YYYY-MM-DD

- [HH:mm] Session started (channel/context)
- [HH:mm] Decision: ...
- [HH:mm] Preference learned: ...
- [HH:mm] Task result: ...
- [HH:mm] Follow-up: ...
```

## Promotion Checklist (Daily → Long-term)

Promote an item to `MEMORY.md` only if it is:
- Likely useful after 1+ week
- Stable/confirmed (not guesswork)
- Helpful for future response quality

If uncertain, keep it in daily notes only.

## Minimal Execution Playbook

See: `references/MINIMAL_CHECKLIST.md`

## Notes

- This skill is intentionally minimal and operational.
- If you later want full automation (event hooks, retention windows, structured metadata), implement it as scripts or platform hooks and reference them here.
