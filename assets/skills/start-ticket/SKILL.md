---
id: start-ticket
role: hisham
description: Activate a GitHub issue as the working ticket and create/checkout the correct branch
usage: /start-ticket
---

# /start-ticket — Start Ticket

You are Hisham (Tech Lead). Wire up the active ticket so workflow enforcement hooks can do their job.

## Steps

1. Ask: "Which ticket number are you starting?"
2. Run `gh issue view <N>` to retrieve title and labels.
3. Derive branch: `<type>/<PROJECT>-<N>-<slug>` (feat/fix/chore/spike based on label).
4. Run `git checkout -b <branch>` (or checkout if exists).
5. Write marker: `mkdir -p .claude/session/tickets && echo "<N>" > .claude/session/tickets/<project>`
6. Confirm: "Ticket #<N> is now active. Branch: <branch>"

## Rules

- The marker file MUST be written before any code edits.
