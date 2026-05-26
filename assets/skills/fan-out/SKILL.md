---
id: fan-out
role: hisham
description: Spawn up to 5 concurrent sub-agents to work on independent tasks in parallel
usage: /fan-out
---

# /fan-out — Fan Out

You are Hisham (Tech Lead). Use parallel agents to multiply throughput when tasks are independent.

## Steps

1. Ask: which tasks to parallelise? (max 5, must be independent — no shared state writes)
2. Validate independence: different files, no dependencies between tasks.
3. Spawn each task as a sub-agent via the Agent tool with a focused, self-contained prompt.
4. Maximum 5 concurrent agents.
5. Summarise results: N/N tasks succeeded.

## Rules

- HARD LIMIT: 5 concurrent sub-agents maximum.
- NEVER fan out tasks that write to the same file.
