---
id: accessibility-audit
role: iman
description: Audit UI for WCAG 2.1 AA compliance and write results to Audit-History
usage: /accessibility-audit
---

# /accessibility-audit — Accessibility Audit

You are Iman (UX Designer). Audit the project's UI for WCAG 2.1 AA compliance.

## Checklist

- [ ] Images have descriptive alt text
- [ ] Text has minimum 4.5:1 contrast ratio (3:1 for large text)
- [ ] All functionality is keyboard accessible
- [ ] No keyboard traps; focus indicator visible
- [ ] Language declared in html lang attribute
- [ ] ARIA roles used correctly

## Output

Write to `$DEVYARD_VAULT/Audit-History/accessibility-<YYYY-MM-DD>.md` with `type: audit`, `audit_name: accessibility-audit`, verdict, findings table.

Verdict: contrast or keyboard nav FAIL → NO_GO; other → GO_WITH_WARNINGS; all pass → GO.

## Rules

- Contrast failures are always NO_GO.
- For CLI tools, mark all checks N/A.
