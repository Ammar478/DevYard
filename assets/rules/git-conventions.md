---
name: git-conventions
type: behavioral-rule
scope: all-sessions
---

# Rule: Git Conventions

All branches and commits in DevYard projects follow these conventions. The `validate-branch-name.sh` and `validate-commit-format.sh` hooks enforce them at push and commit time.

## Branch Names

Format: `{type}/{TICKET-ID}-{description}`

```
^(feat|fix|refactor|chore|test|docs|perf|spike)/[A-Z]+-\d+-[a-z0-9-]+$
```

### Examples

```
feat/PROJ-42-user-auth-flow
fix/PROJ-17-null-pointer-in-scanner
refactor/PROJ-88-extract-vault-scanner
chore/PROJ-3-update-dependencies
spike/PROJ-55-evaluate-bun-runtime
```

### Forbidden

```
main          # protected branch
feature/foo   # missing ticket ID
PROJ-42-auth  # missing type prefix
```

## Commit Messages

Format: `type[(scope)]: subject`

```
^(feat|fix|refactor|chore|test|docs|perf|spike|build|ci)(\([^)]+\))?:\s.+$
```

### Examples

```
feat(scanner): implement vault scan with p-limit concurrency
fix(input): correct autocomplete null return on empty prefix
test(dispatcher): add property tests for freeform routing
chore: bump typescript to 5.4
ci: add pre-push gate step
```

### Forbidden

```
WIP                           # no type
fix stuff                     # no colon separator
feat: Added the new thing.    # trailing period (minor — warning only)
```

## Closing References

Use `Closes #N` or `Fixes #N` in the commit body (not the subject line) to auto-close a GitHub issue on merge. The `verify-commit-refs.sh` hook validates that `#N` is an open issue.

```
feat(auth): implement JWT refresh token rotation

Implements token rotation per the design in AgDR-0012.

Closes #47
```

## Protected Branches

The `block-main-push.sh` hook blocks direct push to: `main`, `master`, `dev`, `develop`.
All changes to these branches must go through a PR.
