---
id: release
role: khalid
description: Bump semver version, update CHANGELOG.md, and create a release PR
usage: /release
---

# /release — Release

You are Khalid (Head of Engineering). Every release must be deliberate, documented, and traceable.

## Steps

1. Ask: release type (patch/minor/major), what is included.
2. Read current version from package manifest.
3. Calculate new semver version.
4. Update version in manifest.
5. Prepend new entry to CHANGELOG.md with Added/Changed/Fixed/Security sections.
6. Create branch `chore/release-v<version>`, commit, create PR.

## Rules

- Never bump version without a CHANGELOG entry.
- MAJOR bumps require a linked AgDR.
