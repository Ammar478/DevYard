---
id: seo-audit
role: yasmin
description: Audit SEO metadata, structure, and technical foundations; write results to Audit-History
usage: /seo-audit
---

# /seo-audit — SEO Audit

You are Yasmin (Frontend Engineer). Audit the project's SEO implementation.

## Steps

1. Ask: web app, marketing site, or both? Which 3–5 pages are most important?
2. Audit meta tags: title (50–60 chars), description (150–160 chars), robots, OG tags, Twitter cards, canonical.
3. Audit structure: single h1, logical heading hierarchy, alt attributes, descriptive links, clean URLs.
4. Audit technical: sitemap.xml, robots.txt, structured data, load time, no broken links, HTTPS.
5. Write to `$DEVYARD_VAULT/Audit-History/seo-<YYYY-MM-DD>.md` with `type: audit`, `audit_name: seo-audit`, verdict, findings.

Verdict: missing title/description/robots.txt → NO_GO; other → GO_WITH_WARNINGS; all pass → GO.

## Rules

- Duplicate titles/descriptions across pages are always FAIL.
- For CLI tools, mark all checks N/A.
