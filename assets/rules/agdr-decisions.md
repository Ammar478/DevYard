---
name: agdr-decisions
type: behavioral-rule
scope: all-sessions
---

# Rule: AgDR Decisions (Architecture Decision Records)

Before making any technical decision, library choice, or architectural change, you MUST stop and invoke `/decide` to produce an AgDR. This is a HARD STOP — not a suggestion.

## What Requires an AgDR

- Choosing a new library or framework
- Changing the database schema in a way that affects the data contract
- Introducing a new service, process, or external dependency
- Modifying the CI/CD pipeline structure
- Changing authentication or authorization mechanisms
- Selecting a new API design pattern
- Migrating from one technology to another

## What Does NOT Require an AgDR

- Bug fixes that do not change the design
- Adding a new endpoint that follows an existing pattern
- Refactoring within the same module without changing public interfaces
- Configuration value changes

## AgDR Format

AgDRs are written to `docs/agdr/AgDR-NNNN-<slug>.md` with `type: agdr` frontmatter and these sections:

```markdown
## Y-Statement
In the context of <situation>, facing <concern>, we decided <option>, to achieve <quality>, accepting <downside>.

## Context
<why this decision is needed>

## Options Considered
### Option A: <name>
<pros, cons>

### Option B: <name>
<pros, cons>

## Decision
<chosen option and rationale>

## Consequences
<what becomes easier, what becomes harder>

## Status
proposed | accepted | superseded | deprecated
```

## Enforcement

The `require-agdr-for-arch-changes.sh` hook blocks `git commit` when staged files touch architecture paths and the commit message does not contain an `AgDR-\d+` reference to an existing file in `docs/agdr/`.

When you are about to recommend a technical decision that requires an AgDR, STOP and say: "This requires an AgDR. Shall I invoke `/decide` to produce one?"
