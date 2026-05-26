---
name: leak-protection
type: behavioral-rule
scope: all-sessions
---

# Rule: Leak Protection

Private project names and internal identifiers must never appear in public-facing GitHub issues, PR bodies, PR titles, or issue comments when the target repository is public.

## Why This Rule Exists

DevYard supports a split-portfolio mode where private projects coexist with public repositories. A private project name in a public PR body or issue comment constitutes a data leak — it reveals the existence and name of a private project to anyone with GitHub access.

## What Is Protected

The file `~/.devyard/private-names.yaml` contains the list of protected names:

```yaml
private:
  - ProjectAlpha       # internal codename
  - client-acme        # client name
  - internal-infra     # infrastructure project
```

Names are case-insensitive. Partial matches (substring) also trigger the block.

## Enforcement

The `block-private-refs-in-public-repos.sh` hook intercepts these GitHub CLI commands:
- `gh issue create`
- `gh pr create`
- `gh issue comment`
- `gh pr comment`

When the target repo is public (detected via `gh repo view --json isPrivate`) and the body or title contains a name from `private-names.yaml`, the hook exits 2 and blocks the command.

## Behavioral Requirement

In every session where you generate PR bodies, issue bodies, or comments:

1. Do NOT reference private project names, client names, or internal codenames in any GitHub-facing text
2. If you are unsure whether a name is private, omit it and use a generic description
3. Use generic references like "the active project" or "the referenced system" instead of proper names when writing for public GitHub

## Updating the Protected List

Add entries to `~/.devyard/private-names.yaml` before naming a new private project. This file is never committed to a public repository.
