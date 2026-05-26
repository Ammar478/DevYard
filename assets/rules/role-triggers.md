---
name: role-triggers
type: behavioral-rule
scope: all-sessions
---

# Rule: Role Triggers

When a file path, issue label, or prompt keyword matches a role's trigger table, the `detect-role-trigger.sh` hook displays an advisory banner suggesting the appropriate role. This is advisory — it never blocks the tool call.

## Trigger Table

| File Path Pattern | Issue Label | Prompt Keyword | Suggested Role |
|-------------------|-------------|----------------|----------------|
| `docs/agdr/`, `package.json` (version), `README.md` | `architecture`, `release`, `handover` | "approve merge", "release", "tech vision", "arch decision" | **khalid** (Head of Engineering) |
| `src/`, `tsconfig.json`, `docs/agdr/`, `*.ts` | `task`, `spike`, `investigation`, `architecture` | "code review", "status", "AgDR", "decide", "investigate", "tasks" | **hisham** (Tech Lead) |
| `src/`, `prisma/`, `migrations/`, `*.service.ts` | `backend`, `bug`, `database`, `api` | "backend", "API", "database", "migration", "debug" | **karim** (Backend Engineer) |
| `src/panels/`, `src/screens/`, `*.tsx`, `*.css` | `frontend`, `ui`, `accessibility`, `seo` | "frontend", "component", "UI", "React", "accessibility" | **yasmin** (Frontend Engineer) |
| `tests/`, `*.test.ts`, `*.spec.ts` | `testing`, `qa`, `regression`, `coverage` | "test", "QA", "coverage", "regression" | **salim** (QA Engineer) |
| `.github/workflows/`, `Dockerfile`, `install.sh` | `platform`, `infra`, `ci-cd`, `migration` | "CI", "pipeline", "deploy", "infra", "setup" | **adel** (Platform Engineer) |
| Performance markers, monitoring config | `reliability`, `performance`, `incident` | "SLO", "monitoring", "incident", "investigation", "latency" | **saif** (SRE) |
| `Projects/*/BRDs/`, `Roadmaps/` | `product`, `roadmap`, `strategy`, `brd` | "validate idea", "roadmap", "product decision" | **omar** (Head of Product) |
| `_Inbox/`, `Ideas/`, `Projects/*/BRDs/` | `feature`, `product`, `inbox`, `idea` | "BRD", "spec", "inbox", "idea", "feature" | **mariam** (Product Manager) |
| `Audit-History/feature-inventory*` | `analytics`, `product-analysis` | "feature inventory", "analytics", "extract features" | **hanan** (Product Analyst) |
| `src/theme/`, `src/panels/`, `*.tsx` (visual) | `design`, `ui`, `design-system` | "design review", "approve design", "design system" | **maha** (Head of Design) |
| `src/theme/` | `ui`, `visual`, `component` | "visual design", "layout", "color", "icon" | **nour** (UI Designer) |
| `src/panels/InputBox.tsx`, user-flow docs | `ux`, `accessibility`, `user-journey` | "user journey", "UX", "interaction", "WCAG" | **iman** (UX Designer) |
| Auth routes, middleware, `assets/hooks/` | `security`, `critical`, `compliance` | "security review", "threat model", "CRITICAL", "vulnerability" | **faisal** (Head of Security) |
| `src/`, dependencies, `assets/hooks/` | `security`, `audit`, `vulnerability` | "security audit", "vulnerability", "audit deps" | **hakim** (Security Auditor) |
| Auth endpoints, API surfaces | `pentest`, `exploit` | "pentest", "penetration test", "exploit", "attack surface" | **hamza** (Penetration Tester) |
| `prisma/`, `migrations/`, pipeline config | `data`, `analytics`, `schema`, `governance` | "data architecture", "schema", "data governance" | **khalil** (Head of Data) |
| `Audit-History/analytics-*`, tracking code | `analytics`, `data-analysis` | "analytics audit", "instrumentation", "usage data" | **nadia** (Data Analyst) |
| `prisma/`, `migrations/`, ETL scripts | `data-engineering`, `pipeline`, `etl` | "data pipeline", "ETL", "ingestion", "data migration" | **anwar** (Data Engineer) |

## Advisory Banner Format

```
[DevYard] Role suggestion: This looks like a <role title> task.
Consider: /devyard set-role <name>
Or start your prompt with: "As <name>, ..."
```

The banner is printed to stderr. The tool call proceeds regardless.

## Explicit Role Override

A user can explicitly set the active role by saying "act as <role name>" in any prompt. The session adopts that role for the remainder of the session unless changed again.
