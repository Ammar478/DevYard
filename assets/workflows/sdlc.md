# DevYard SDLC — 7-Phase Software Development Lifecycle

This document defines the end-to-end development workflow enforced by DevYard's hooks and skills.

---

## Phase 1: Idea

**Entry**: A new product or engineering idea.
**Exit**: Idea captured in vault with `IDEA-NNN` identifier and `verdict: null`.

### Skills
- `/idea` — capture the idea with problem statement and target user

### Artifacts
- `$DEVYARD_VAULT/Ideas/<slug>.md` with `type: idea`, `verdict: null`

### Gate 1: Validated Idea
Before proceeding to Phase 2, the idea must have `verdict: GREEN` or `verdict: YELLOW`.
Run `/validate-idea` to score the idea across Market, Technical, and Strategic dimensions.

---

## Phase 2: Specification

**Entry**: Validated idea (GREEN or YELLOW verdict).
**Exit**: Approved BRD + linked Design document in vault.

### Skills
- `/write-spec` — produce BRD + Design pair
- `/c4` — generate architecture diagrams (optional)
- `/dfd` — generate data flow diagram (if data flows are involved)
- `/threat-model` — STRIDE analysis (required for features touching auth, data, or external APIs)

### Artifacts
- `$DEVYARD_VAULT/Projects/<name>/BRDs/<slug>.md` — must contain `## Problem`
- `$DEVYARD_VAULT/Projects/<name>/Designs/<slug>.md` — must contain `linked_brd`

### Gate 2: Approved Spec
BRD must be reviewed and status updated to `approved`. No tickets are created until the spec is approved.

---

## Phase 3: Ticket

**Entry**: Approved spec or identified bug/task.
**Exit**: GitHub issue created with correct structure and labels.

### Skills
- `/feature` — create a Feature issue
- `/bug` — create a Bug issue
- `/task` — create a Task issue
- `/spike` — create a Spike issue (for technical unknowns)
- `/migration` — create a Migration issue (Gate 3a: requires `migration` label + AgDR)
- `/tickets-batch` — create multiple issues at once

### Gate 3: Active Ticket (with sub-gate 3a for migrations)
Run `/start-ticket <N>` to activate the ticket and create/checkout the branch.
Migration tickets require the `migration` label and an AgDR reference in the issue body.

---

## Phase 4: Development

**Entry**: Active ticket with branch checked out.
**Exit**: PR created with all checks passing.

### Skills
- `/decide` — record any architectural decisions as AgDRs (HARD STOP before arch changes)
- `/debug` — structured debugging for bugs
- `/fan-out` — parallel sub-agent work for independent tasks

### Hooks Active
- `require-active-ticket.sh` — blocks Write/Edit without marker
- `check-secrets.sh` — blocks commits with secrets
- `validate-branch-name.sh` — enforces branch convention
- `validate-commit-format.sh` — enforces conventional commits
- `block-git-add-all.sh` — prevents `git add -A`

### Gate 4: PR Ready
PR created with description, linked issue, and passing pre-push gate (lint + typecheck + test + build).

---

## Phase 5: Review

**Entry**: PR created.
**Exit**: Rex approval marker + CEO approval marker written.

### Skills
- `/code-review` — invokes Rex agent; writes `<N>-rex.approved` on approval
- `/security-review` — invokes Hatim agent; CRITICAL findings block merge
- `/approve-design` — writes `<N>-design.approved` for UI changes
- `/approve-merge` — verifies all markers + CI green; squash merges PR

### Hooks Active
- `auto-code-review.sh` — writes pending marker on PR creation
- `block-unreviewed-merge.sh` — blocks merge without matching SHA markers
- `block-merge-on-red-ci.sh` — blocks merge with failing CI

### Gate 5: Merge Ready
Rex approved (SHA matches HEAD) + CI green + no unresolved change requests.

---

## Phase 6: Launch

**Entry**: Merged to main.
**Exit**: GO verdict from `/launch-check`.

### Skills
- `/launch-check` — 7-gate readiness checklist
- `/monitoring-audit` — verify alerting and on-call readiness
- `/performance-audit` — verify performance budgets
- `/accessibility-audit` — verify WCAG 2.1 AA (for UI changes)
- `/compliance-check` — verify regulatory requirements (if applicable)
- `/release` — bump version, update CHANGELOG, create release PR

### Gate 6: Launch Ready
`/launch-check` verdict must be GO or GO_WITH_WARNINGS with all warnings acknowledged.

---

## Phase 7: Handover

**Entry**: Project is stable or changing ownership.
**Exit**: Project registered in DevYard vault with current state documented.

### Skills
- `/handover` — create vault entry with current state
- `/update` — keep vault frontmatter current
- `/stakeholder-update` — communicate state to stakeholders
- `/extract-features` — generate feature inventory for documentation

### Artifacts
- `$DEVYARD_VAULT/Projects/<name>/handover-assessment.md`
- Updated `~/.devyard/projects.yaml`

---

## Decision Gates Summary

| Gate | Trigger | Enforced By |
|------|---------|-------------|
| 1 — Validated Idea | Before spec work | Manual: `/validate-idea` |
| 2 — Approved Spec | Before ticket creation | Manual: BRD status field |
| 3 — Active Ticket | Before any code edit | Hook: `require-active-ticket.sh` |
| 3a — Migration Gate | Before migration work | Hook + Skill: `migration` label + AgDR |
| 4 — PR Ready | Before review | Hook: `pre-push-gate.sh` |
| 5 — Merge Ready | Before merge | Hook: `block-unreviewed-merge.sh` |
| 6 — Launch Ready | Before deploy | Skill: `/launch-check` |
