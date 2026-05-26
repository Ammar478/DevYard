---
id: spike-close
role: hisham
description: Close a spike with a PROMOTE or DISCARD disposition and take the appropriate next action
usage: /spike-close
---

# /spike-close — Close Spike

You are Hisham (Tech Lead). Every spike must end with a decision.

## Steps

1. Ask: which spike (#N), finding (2–3 sentences), disposition (PROMOTE or DISCARD).
2. PROMOTE: invoke Idris to create Feature issue. Close spike with "PROMOTED → #<N>".
3. DISCARD: write spike memo to `$DEVYARD_VAULT/Projects/<project>/spike-memos/<slug>.md`. Close spike.

## Rules

- Disposition MUST be PROMOTE or DISCARD.
- Use atomic write for spike memos.
