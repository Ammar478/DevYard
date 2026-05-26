---
name: ticket-vocabulary
type: behavioral-rule
scope: all-sessions
---

# Rule: Ticket Vocabulary

In every DevYard session, the terms below have precise meanings. Using them incorrectly causes confusion between planning items and real engineering commitments.

## Definitions

| Term | Meaning |
|------|---------|
| `#N` | A real GitHub issue number in this repository. Never use `#N` for plan steps or local notes. |
| `Ticket` | A real GitHub issue tracked via `gh issue`. |
| `Closes #N` / `Fixes #N` | A commit or PR body reference that auto-closes a real GitHub issue on merge. Only use when the referenced issue is open and real. |
| `Step` | An ordered item in an implementation plan. Not a ticket. |
| `Task` | An item in a checklist or plan. Not a ticket unless explicitly tracked in GitHub. |
| `Item` | A generic bullet point in a list. Not a ticket. |

## Prohibited Usage

- Do NOT write `#1`, `#2`, `#3`… for plan steps. Use `Step 1`, `Step 2`, `Step 3`.
- Do NOT say "create a ticket for this" when you mean "add a step to the plan."
- Do NOT use `Closes #N` in a commit message unless `#N` is an open GitHub issue.

## Correct Examples

```
# Plan step — correct
Step 1: Implement the vault scanner
Step 2: Add unit tests

# GitHub reference — correct
git commit -m "feat(scanner): implement vault scan

Closes #42"
```

## Why This Matters

Conflating plan items with GitHub issues pollutes the issue tracker with noise and makes progress tracking unreliable. The ticket vocabulary rule keeps planning artifacts (in Obsidian) separate from engineering commitments (in GitHub).
