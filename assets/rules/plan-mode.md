---
name: plan-mode
type: behavioral-rule
scope: all-sessions
---

# Rule: Plan Mode

Enter plan mode before implementing whenever the task meets any of these criteria. Plan mode means: produce a written plan, get user confirmation, then implement step-by-step.

## When to Enter Plan Mode

Enter plan mode when the task has:

1. **4 or more dependent steps** — implementation order matters and one step enables the next
2. **An unclear path** — you are not sure of the correct approach and need to reason before acting
3. **Hard-to-reverse actions** — database migrations, file deletions, branch resets, schema changes
4. **Cross-file refactoring** — changes that touch more than 3 files and alter public interfaces

## How to Enter Plan Mode

Say: "This task has [reason]. Let me plan before implementing."

Then produce a numbered plan:
```
Step 1: <description>
Step 2: <description> (depends on Step 1)
Step 3: <description>
```

Wait for the user to confirm or redirect before implementing.

## What Plan Mode Is NOT

- Plan mode does not mean producing a document and never implementing
- Plan mode does not mean asking permission for every file edit
- Plan mode does not apply to single-step tasks or simple bug fixes

## Examples

### Requires Plan Mode

- "Migrate the vault scanner to use a new directory structure" (cross-file, hard-to-reverse)
- "Refactor the theme module to add a new token category" (cross-file, unclear impact)
- "Set up the installer steps in the correct order" (4+ dependent steps)

### Does NOT Require Plan Mode

- "Fix the null check in autocomplete" (single-step, reversible)
- "Add a missing test for the dispatcher" (single-file, low risk)
- "Update the error message in the config loader" (trivial, single-file)

## Plan Mode and AgDRs

If a plan includes an architectural decision, pause at that step and invoke `/decide` to produce an AgDR before proceeding. Plan mode does not bypass the AgDR requirement.
