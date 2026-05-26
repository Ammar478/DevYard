# Code Review Workflow

This document defines the code review process in DevYard, covering Rex (automated review agent) and human reviewer responsibilities.

---

## Overview

DevYard uses a two-layer review model:
1. **Rex** (automated): Reads all changed files, checks code standards, flags security anti-patterns.
2. **Human** (Khalid / merge approver): Verifies Rex marker, checks CI, makes the final merge decision.

---

## Step 1: Automatic Review Trigger

When a PR is created, `auto-code-review.sh` fires and:
- Writes a pending review marker at `.claude/session/reviews/<N>-rex.pending`
- Displays: "PR #<N> created. Run `/code-review` to invoke Rex."

---

## Step 2: Rex Code Review

Run `/code-review` to invoke the Rex agent. Rex:

### What Rex Checks
| Category | Checks |
|----------|--------|
| TypeScript | No bare `any`, no `@ts-ignore` without comment, strict-mode compliance |
| Tests | AAA pattern, edge cases covered, no test-only mocks of production behaviour |
| Security | SQL injection, XSS, command injection, hardcoded credentials |
| Logic | Does the code do what the PR description says? |
| Quality | No commented-out code, no debug logs, no dead imports |

### Rex's Decision
- **Approve**: Writes 40-character HEAD SHA to `.claude/session/reviews/<N>-rex.approved`
- **Request Changes**: Posts a PR review on GitHub with specific change requests. Does NOT write approval marker.

### Rex's Constraints
Rex is read-only: it has access to Read, Grep, Glob, and Bash (read-only) only. It cannot write or edit code.

---

## Step 3: Address Change Requests

If Rex requests changes:
1. Make the requested changes on the same branch.
2. Push the updated branch — the new HEAD SHA invalidates the old Rex marker.
3. Run `/code-review` again to get a fresh review.

---

## Step 4: Security Review (if applicable)

For PRs touching auth, data access, or external APIs, run `/security-review`:
- Hatim classifies findings as CRITICAL, HIGH, MEDIUM, LOW.
- CRITICAL findings block merge until resolved.

---

## Step 5: Design Review (if applicable)

For PRs with UI changes, run `/approve-design`:
- Maha reviews Catppuccin Mocha compliance and accessibility.
- Writes `.claude/session/reviews/<N>-design.approved` on approval.

---

## Step 6: Human Merge Approval

Run `/approve-merge`. Khalid verifies:
1. Rex marker exists at `.claude/session/reviews/<N>-rex.approved`
2. Rex marker SHA matches current HEAD (no new commits since review)
3. CI checks are all green
4. No unresolved change requests on the PR

If all pass:
- Writes `.claude/session/reviews/<N>-ceo.approved`
- Executes `gh pr merge --squash --delete-branch`

---

## Marker File Reference

| File | Written By | Content | Purpose |
|------|-----------|---------|---------|
| `<N>-rex.approved` | Rex agent | 40-char HEAD SHA | Code review approval |
| `<N>-ceo.approved` | `/approve-merge` | 40-char HEAD SHA | Final merge approval |
| `<N>-design.approved` | `/approve-design` | 40-char HEAD SHA | Design approval |

---

## What the `block-unreviewed-merge` Hook Enforces

The hook fires on every `gh pr merge` command and blocks unless:
- Both `<N>-rex.approved` and `<N>-ceo.approved` exist
- Both files contain the current HEAD SHA

If the HEAD has moved (new commit pushed after review), the markers are stale and merge is blocked until re-review.

---

## FAQ

**Q: What if Rex is too strict and blocks legitimate code?**
A: Address Rex's concerns — they represent real code standard violations. If a rule is wrong, update the rule file in `assets/rules/code-standards.md`.

**Q: Can I bypass Rex in an emergency?**
A: Set `DEVYARD_SKIP_REVIEW=1` only with the vault admin's explicit approval. This is logged to the audit log.

**Q: What if CI is flaky and failing non-deterministically?**
A: Fix the flaky test before merging. "CI is flaky" is not a bypass condition.
