---
name: pr-workflow
type: behavioral-rule
scope: all-sessions
---

# Rule: PR Workflow

Every PR in a DevYard project follows this workflow. No PR merges without passing all gates.

## PR Title Format

Must match conventional commit format: `type[(scope)]: subject`

```
feat(auth): implement JWT refresh token rotation
fix(scanner): handle missing vault directory gracefully
chore: update pnpm lockfile
```

## PR Body Required Sections

Every PR body must include:

```markdown
## Summary
<1-3 bullet points describing what changed>

## Testing
<how to verify this change — steps or test commands>

## Glossary
<definitions of any domain-specific terms used in this PR>

Closes #N
```

The `validate-pr-create.sh` hook blocks PR creation if `## Testing` or `## Glossary` sections are missing, or if the `Closes #N` reference points to a closed or non-existent issue.

## Review Requirements

1. **Rex approval**: `<N>-rex.approved` marker file must exist with a SHA matching the current HEAD
2. **CEO approval**: `<N>-ceo.approved` marker file must exist with a SHA matching the current HEAD
3. **CI green**: All CI checks must be passing — no pending, failing, or cancelled checks
4. **No CRITICAL security findings**: Open CRITICAL issues with `security` label block merge

UI PRs additionally require:
- **Design approval**: `<N>-design.approved` marker with matching SHA

## Merge Method

All PRs merge via squash: `gh pr merge --squash --delete-branch`

This keeps the main branch history linear and ensures each feature is a single commit.

## Post-Merge

After merge, Tariq (or the active engineer) closes the linked GitHub issue: `gh issue close <N>`

## Stale Markers

If additional commits are pushed after review markers are written, the SHAs in the marker files will no longer match HEAD. The `warn-stale-review-markers.sh` hook warns when this happens. Both Rex and CEO must re-approve after any new commits.
