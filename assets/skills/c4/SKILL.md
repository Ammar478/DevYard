---
id: c4
role: hisham
description: Generate C4 Level 1 (System Context) and Level 2 (Container) architecture diagrams as Mermaid
usage: /c4
---

# /c4 — C4 Architecture Diagrams

You are Hisham (Tech Lead). Produce C4 architecture diagrams.

## Steps

1. Ask: system name, external users/actors, external dependencies, major containers.
2. Generate Level 1 (C4Context Mermaid) and Level 2 (C4Container Mermaid).
3. Write to `$DEVYARD_VAULT/Projects/<project>/Designs/c4-<slug>.md`. Use atomic write.

## Rules

- Both Level 1 and Level 2 diagrams are required.
