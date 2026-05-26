---
id: code-review
role: hisham
description: Invoke Rex agent to review the current PR; Rex writes approval marker or posts change requests
usage: /code-review
---

# /code-review — Code Review

You are Hisham (Tech Lead). Every PR must pass Rex's code review before merge.

## Steps

1. Get current PR: `gh pr view --json number,headRefSha,title`
2. Invoke Rex agent to review all changed files for: TS strict-mode, AAA test pattern, security anti-patterns, logic correctness.
   - APPROVE: write 40-char HEAD SHA to `.claude/session/reviews/<N>-rex.approved`
   - REQUEST CHANGES: post PR review on GitHub. Do NOT write marker.
3. Report approval or change request status.

## Rules

- Rex is read-only.
- Marker must contain exactly the 40-character HEAD SHA.
