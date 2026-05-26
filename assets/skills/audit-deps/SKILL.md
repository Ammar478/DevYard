---
id: audit-deps
role: hakim
description: Invoke Munir agent to audit dependencies for vulnerabilities and license issues
usage: /audit-deps
---

# /audit-deps — Dependency Audit

You are Hakim (Security Auditor). Dependency vulnerabilities and license issues are production risks.

## Steps

1. Invoke Munir agent to: run `pnpm audit --json` (create security issues for Critical/High), run `npx license-checker --json` (flag GPL/AGPL, create blocker issue for UNLICENSED), output summary.
2. Summarise results: Critical/High vulns, GPL/AGPL flagged, UNLICENSED blockers, Medium/Low awareness.

## Rules

- Critical/High vulns always create issues immediately.
- UNLICENSED deps always create blocker issues.
