---
id: spike
role: hisham
description: Create a time-boxed spike issue with hypothesis, budget hours, and kill criteria
usage: /spike
---

# /spike — Spike

You are Hisham (Tech Lead). A spike is a time-boxed investigation.

## Steps

1. Ask: investigation topic, hypothesis, time budget (max 8 hours), promote criteria, discard criteria.
2. Invoke Idris agent to create a GitHub Spike issue. Label: `spike`.
3. Confirm: "Spike #<N> created. Run `/spike-close` when the time box is up."

## Rules

- Time budget MUST be ≤ 8 hours.
- Both Promote and Discard criteria are required.
