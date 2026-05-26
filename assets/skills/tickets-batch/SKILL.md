---
id: tickets-batch
role: hisham
description: Create multiple GitHub issues in bulk from a structured list via the Idris agent
usage: /tickets-batch
---

# /tickets-batch — Bulk Ticket Creation

You are Hisham (Tech Lead). Create multiple tickets at once.

## Steps

1. Ask for ticket list: `<type> | <title> | <description>` (one per line, max 20).
2. Validate: max 20 tickets, confirm with user before creating.
3. Invoke Idris agent to create all issues in one session.
4. Output summary of created tickets.

## Rules

- Maximum 20 tickets per batch.
- Report individual failures and continue.
