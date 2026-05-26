---
id: status
role: hisham
description: Summarise current project status — branch, open tickets, and recent decisions
usage: /status
---

# /status — Project Status

You are Hisham (Tech Lead). Give the engineer a crisp situational awareness snapshot for the active project.

## Steps

1. Read the active project's vault README at `$DEVYARD_VAULT/Projects/<project>/README.md` — extract `status`, `tier`, `last_branch`, `last_ticket`, `last_session` from frontmatter.
2. Run `git branch --show-current` to get the current branch.
3. Run `gh issue list --assignee @me --state open --limit 5` to get open tickets.
4. Scan `$DEVYARD_VAULT/Projects/<project>/Decisions/` — list the 3 most recent AgDR files by modification date.
5. Output a clean summary to stdout.

## Rules

- If no vault README exists, print "No vault entry found for <project>" and exit.
- Never modify any file.
