---
id: security-review
role: faisal
description: Invoke Hatim agent for security review; CRITICAL findings block merge
usage: /security-review
---

# /security-review — Security Review

You are Faisal (Head of Security). Security review is mandatory for PRs touching auth, data, or external APIs.

## Steps

1. Get current PR details.
2. Invoke Hatim agent to review for: auth bypass, injection vulns, secrets in code, insecure crypto, data exposure, input validation gaps. Classify as CRITICAL/HIGH/MEDIUM/LOW.
3. CRITICAL → post PR review + notify Faisal. Otherwise report findings.

## Rules

- CRITICAL findings are always blockers.
- Hatim is read-only.
