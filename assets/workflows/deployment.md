# Deployment Pipeline

This document defines the 11-stage deployment pipeline for DevYard-managed projects.

---

## Pipeline Overview

```
1. Pre-push Gate
2. PR Creation
3. Automated Code Review (Rex)
4. Human Code Review
5. Security Review
6. CI Validation
7. Merge Approval
8. Merge to Main
9. Build & Package
10. Staging Deploy
11. Production Deploy
```

---

## Stage 1: Pre-push Gate

**Trigger**: `git push`
**Hook**: `pre-push-gate.sh`

Runs locally before any code reaches the remote:
```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

**Block condition**: Any step fails — push is blocked, never reaches remote.

---

## Stage 2: PR Creation

**Trigger**: `gh pr create`
**Hook**: `auto-code-review.sh`

- Validates PR has a linked issue (`Closes #N`)
- Validates PR title follows conventional commit format
- Writes review pending marker

---

## Stage 3: Automated Code Review (Rex)

**Trigger**: Manual — `/code-review`
**Agent**: Rex (read-only)

Rex reviews all changed files against code standards, security patterns, and test quality.

**Outputs**:
- Approval → `.claude/session/reviews/<N>-rex.approved`
- Rejection → GitHub PR review with change requests

---

## Stage 4: Human Code Review

**Trigger**: After Rex approval
**Reviewer**: Team member or self-review for solo projects

Address any Rex change requests, verify logic and domain correctness.

---

## Stage 5: Security Review

**Trigger**: Manual — `/security-review` (required for auth/data/API changes)
**Agent**: Hatim (read-only)

CRITICAL findings block the pipeline until resolved.

---

## Stage 6: CI Validation

**Trigger**: Push to PR branch (automatic)
**Pipeline**: GitHub Actions (`.github/workflows/`)

Runs in parallel:
- Lint + typecheck
- Test suite with coverage
- Build verification

**Block condition**: Any job fails → merge blocked by `block-merge-on-red-ci.sh`.

---

## Stage 7: Merge Approval

**Trigger**: Manual — `/approve-merge`
**Actor**: Khalid (Head of Engineering)

Verifies:
- Rex marker SHA matches HEAD
- CI green
- No unresolved change requests

Writes `<N>-ceo.approved` marker.

---

## Stage 8: Merge to Main

**Trigger**: `/approve-merge` success
**Method**: Squash merge + branch deletion

```
gh pr merge <N> --squash --delete-branch
```

Commit message: `<type>(<scope>): <subject> (#<N>)`

---

## Stage 9: Build & Package

**Trigger**: Push to `main` (CI)
**Pipeline**: `node-api.yml` / `react-app.yml` / `docker-build.yml` (as applicable)

Builds production artifact:
- Node/React: `pnpm build` → `dist/`
- Docker: `docker buildx build` → GHCR
- Go/Rust: release binary → GitHub Actions artifact

---

## Stage 10: Staging Deploy

**Trigger**: Successful Stage 9 build (CI)
**Target**: Staging environment

Deploy steps are project-specific. Recommended pattern:
```yaml
- name: Deploy to staging
  run: |
    ssh deploy@staging "cd /app && git pull && pnpm install && pnpm build && pm2 restart app"
```

Run smoke tests against staging before proceeding.

---

## Stage 11: Production Deploy

**Trigger**: Manual approval (or automatic on tag push)
**Gate**: `/launch-check` must produce GO or GO_WITH_WARNINGS verdict

```bash
# Tag-triggered production deploy
git tag v<version>
git push origin v<version>
# Triggers release.yml pipeline
```

Post-deploy:
- Monitor error rate alert (first 30 minutes)
- Verify business metric alert (first 2 hours)
- Update vault entry: `/update`

---

## Rollback Procedure

If production deploy fails or error rate spikes:

1. **Immediate**: Revert to previous version
   ```bash
   gh release download v<previous-version>
   # Deploy previous artifact
   ```

2. **Git revert** (for simple changes):
   ```bash
   git revert <merge-commit-sha>
   git push origin main
   ```

3. **Database migrations**: Follow the rollback steps documented in the migration plan.

---

## Deployment Checklist

Before every production deploy:
- [ ] `/launch-check` verdict is GO or GO_WITH_WARNINGS
- [ ] CHANGELOG.md updated
- [ ] Stakeholders notified
- [ ] Rollback plan reviewed
- [ ] Monitoring dashboards open and baseline established
