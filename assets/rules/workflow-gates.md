---
name: workflow-gates
type: behavioral-rule
scope: all-sessions
---

# Rule: Workflow Gates (6 SDLC Gates)

Every feature or change must pass through 6 sequential gates before shipping. Skipping a gate is not allowed. If a gate condition is not met, stop and resolve the blocker before proceeding.

## Gate 1 — Validated Idea

**Condition**: The idea has a `verdict: GREEN` or `verdict: YELLOW` in its `Ideas/` vault file.

- GREEN = proceed
- YELLOW = proceed with risk acknowledgment
- RED = do not proceed; idea is rejected
- `null` = not yet validated; run `/validate-idea` first

## Gate 2 — Approved Spec

**Condition**: A BRD exists at `Projects/<Name>/BRDs/<feature>.md` with `type: brd` frontmatter AND a Design artifact at `Projects/<Name>/Designs/<feature>.md` with a `linked_brd` field pointing to the BRD.

The BRD must have a `## Problem` section. The Design must have a `linked_brd` field.

## Gate 3 — Active Ticket

**Condition**: A marker file exists at `.claude/session/tickets/<project>` containing the active ticket number, AND the referenced GitHub issue is open.

No code edits (Write, Edit, MultiEdit, Bash-write) are permitted without this marker.

### Gate 3a — Migration Sub-Gate

For database migrations specifically: the active ticket must have the `migration` label AND reference an `AgDR-NNNN` in the issue body.

## Gate 4 — PR Ready

**Condition**: Pre-push gate passes (`pnpm lint && pnpm typecheck && pnpm test && pnpm build` all exit 0), branch name matches the required regex, and commit messages match conventional commit format.

## Gate 5 — Merge Ready

**Condition**: Both `<N>-rex.approved` and `<N>-ceo.approved` marker files exist with SHA values matching the current PR HEAD. All CI checks are green. No CRITICAL security findings are open.

## Gate 6 — Launch Ready

**Condition**: `/launch-check` produces a GO or GO_WITH_WARNINGS verdict. Result is persisted to `Audit-History/launch-<date>.md`.

## Enforcement

Gates 3 and 5 are enforced deterministically by hooks (`require-active-ticket.sh`, `block-unreviewed-merge.sh`). Gates 1, 2, 4, and 6 are enforced by behavioral guidance — Claude Code will not proceed without confirmation that the gate condition is met.
