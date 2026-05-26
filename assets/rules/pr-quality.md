---
name: pr-quality
type: behavioral-rule
scope: all-sessions
---

# Rule: PR Quality Standards

Every PR submitted in a DevYard project must meet these quality standards. Rex enforces them during code review. Substandard PRs receive change requests, not approval.

## Code Quality Checklist

- [ ] No bare `any` types — all `unknown` + narrowing
- [ ] No `@ts-ignore` without explanatory comment
- [ ] All `.js` extensions on ESM imports
- [ ] No direct imports from `theme/catppuccin.ts` in UI components
- [ ] Atomic writes used for all file mutations (`.tmp.{pid}` + rename)
- [ ] No trailing comments explaining WHAT the code does

## Test Quality Checklist

- [ ] All new exported functions have at least one test
- [ ] Tests follow AAA (Arrange, Act, Assert) pattern
- [ ] No mocked database connections in integration tests
- [ ] Property-based tests have minimum 100 iterations
- [ ] Coverage delta is non-negative (PR does not reduce coverage)

## PR Hygiene Checklist

- [ ] PR title matches `type[(scope)]: subject` format
- [ ] PR body contains `## Summary`, `## Testing`, `## Glossary`
- [ ] `Closes #N` references a real, open GitHub issue
- [ ] Branch name matches `{type}/{TICKET-ID}-{description}`
- [ ] No merge commits in PR history (rebase or squash)
- [ ] No unresolved review comments from a previous review round

## Size Guidelines

- Prefer small, focused PRs that do one thing
- A PR touching more than 20 files is a signal to split it
- A PR with more than 500 lines of change requires Khalid review before Rex

## What Rex Blocks On (BLOCKER Severity)

- TypeScript compilation errors
- Missing tests for new code paths
- Hardcoded secrets (caught by `check-secrets.sh` pattern set)
- Import of `theme/catppuccin.ts` in UI components
- Direct file writes without atomic pattern

## What Rex Suggests (SUGGESTION Severity)

- Test coverage improvements for existing paths
- Comment cleanup
- Naming consistency with existing conventions
