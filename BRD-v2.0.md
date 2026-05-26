---
title: DevYard — Business Requirements Document
version: 2.0
status: draft
author: DevYard maintainer
created: 2026-05-24
last_updated: 2026-05-24
supersedes: BRD-v1.0.md
related_docs:
  - HLD.md
  - LLD.md
tags: [brd, devyard, v2, complete-scope]
---

# DevYard — Business Requirements Document (v2.0 — Complete Scope)

## 0. Document Purpose

This BRD replaces v1.0. The original BRD scoped DevYard as "the navigator" with the SDLC engine deferred to Claude Code. The user has revised this: **DevYard v1.0 is the complete personal engineering OS**, absorbing the entire ApexYard surface as its own engine. This document specifies that complete scope.

## 1. Executive Summary

DevYard is a single-user, terminal-based **personal engineering operating system** built in TypeScript. It runs on the user's macOS machine, presents a TUI control plane (Catppuccin Mocha theme), and orchestrates a complete software-development lifecycle through structured AI personas, deterministic safety hooks, and a library of slash-command skills.

DevYard does four things:

1. **Navigates** — a TUI landing screen showing all projects, their state, and recent ideas.
2. **Orchestrates** — slash-command skills (49 total) for every SDLC phase from idea to handover.
3. **Enforces** — 28 deterministic hooks and 11 behavioral rules that keep the user (and the AI) on a safe, repeatable workflow.
4. **Records** — every artifact, decision, and session is captured in a single Obsidian vault as the source of truth.

The user remains in control of every action; DevYard removes the friction of finding *where* to act, *what* the project's current state is, *which* workflow to invoke, and *how* to do it correctly.

## 2. Problem Statement

A working developer using AI tools faces seven compounding frictions:

1. **Context loss** — switching projects costs 10–15 minutes of re-orientation.
2. **No unified launcher** — every workflow is a separate command in a separate context.
3. **State fragmentation** — knowledge in Obsidian, code in git, status in head.
4. **Workflow inconsistency** — without enforcement, AI-assisted dev drifts into shortcuts (no tests, no decisions documented, force-pushes, secrets committed).
5. **Decision amnesia** — technical decisions made in chat vanish; six months later nobody knows why.
6. **Review skipping** — under time pressure, code review is the first thing cut.
7. **Launch surprise** — production releases discover missing monitoring, missing docs, missing security review.

DevYard exists to collapse all seven into a single command and a single enforced flow. The user types `devyard`, sees their full engineering surface, and is one keystroke from any action — and every action is gated by the right hooks, rules, and reviewers.

## 3. Users

### 3.1 Primary user

A single developer (the maintainer) running macOS, using Claude Code as their primary AI development tool, managing 3–10 active projects across personal work and professional contexts (AIHub, DevSecOps, ApexYard fork itself), with an Obsidian vault as their personal knowledge base.

**Daily signature:**

- Opens 3–6 active project contexts per week
- Generates 1–3 BRDs / design docs per week
- Creates 5–15 GitHub issues per week
- Reviews 5–10 PRs per week (own + team's)
- Makes 3–8 technical decisions per week
- Captures 5–20 ideas per week
- Runs at least one production launch per month

### 3.2 Secondary users (not v1.0 target)

Engineers who adopt DevYard. v1.0 does not optimize for them, but the architecture must not preclude future generalization.

## 4. Goals and Non-Goals

### 4.1 Primary goals

- **G1** Eliminate context-switching tax. Re-entering a project takes under 5 seconds.
- **G2** Single entry point (`devyard`) for navigation, status, and skill invocation.
- **G3** Make the Obsidian vault the canonical, human-readable source of truth.
- **G4** Enforce a complete SDLC workflow: idea → spec → decision → ticket → branch → code → review → security → merge → launch → monitor → handover.
- **G5** Catch unsafe actions deterministically (hooks), advise behavior (rules), shape persona (roles), orchestrate flows (skills).
- **G6** Document every technical decision automatically via AgDR (Agent Decision Record).
- **G7** Maintain a strict Catppuccin Mocha visual identity across the entire surface.
- **G8** One-command install. Fresh macOS to working state in under 15 minutes.

### 4.2 Non-goals

- **NG1** Not a SaaS or hosted service.
- **NG2** Not a code editor / IDE replacement.
- **NG3** Not an autonomous agent. Every action requires user trigger or explicit confirmation.
- **NG4** Not a replacement for git, GitHub, or GitLab.
- **NG5** Not a general-purpose note-taker.
- **NG6** Not cross-platform for v1.0. macOS only.
- **NG7** No multi-user / team support. Single-developer tool.

## 5. Scope

### 5.1 In scope for v1.0 — Complete surface

The full DevYard surface is in v1.0. Each capability area is summarized here; full specifications appear in §7.

| Layer | Count | Summary |
|-------|-------|---------|
| Navigator | 1 TUI | Landing screen + project view + skill launcher |
| Skills | 49 | Slash commands covering every SDLC phase |
| Roles | 19 | AI personas across Engineering, Product, Design, Security, Data |
| Agents | 5 | Restricted sub-Claude processes (Rex, Hatim, Tariq, Idris, Munir) |
| Rules | 11 | Behavioral constraints loaded at session start |
| Hooks | 28 | Deterministic enforcement scripts |
| Workflows | 3 | Process maps (SDLC, code review, deployment) |
| Pipelines | 7 | Ready-to-use CI/CD YAML templates |
| Doctor | 1 | Comprehensive health-check command |
| Installer | 1 | Idempotent setup of all above |
| Vault | 1 | Obsidian schema for all artifacts |
| Theme | 1 | Catppuccin Mocha, locked |

### 5.2 Explicitly deferred to v1.1+

| ID | Capability | Reason |
|----|------------|--------|
| D1 | Cross-platform (Linux/Windows) | macOS-only reduces test surface |
| D2 | Multi-machine sync of operational state | Obsidian sync covers artifacts; local state is intentionally local |
| D3 | Team / multi-user support | Out of scope for personal tool |
| D4 | Public npm release | Decision deferred until personal use stabilizes |
| D5 | Web UI companion | Terminal-only for v1.0 |
| D6 | Custom themes beyond Catppuccin Mocha | Locked theme for v1.0 |
| D7 | Per-project role overrides | Global roles only in v1.0 |
| D8 | Telemetry / analytics on DevYard usage | Privacy-first; nothing leaves the machine |

## 6. Phased Build Plan (Inside v1.0)

Even though everything is v1.0, building it requires a sequence. The build proceeds in four phases. Each phase produces a runnable system.

| Phase | Duration | Deliverable | Verifiable via |
|-------|----------|-------------|----------------|
| **Phase A: Foundation** | Week 1–2 | Doctor, theme, vault scanner, MCP clients, installer skeleton | `devyard doctor` green on fresh install |
| **Phase B: Navigator** | Week 3–4 | Ink TUI, landing screen, input box, project view | `devyard` opens, navigates projects |
| **Phase C: Engine** | Week 5–10 | 49 skills, 19 roles, 5 agents, 11 rules, 28 hooks, 7 pipelines | Full SDLC flow runs end-to-end |
| **Phase D: Hardening** | Week 11–12 | All audits pass, performance budgets met, installer tested on fresh machines | `/launch-check` returns GO on DevYard itself |

Total: **12 weeks** to full v1.0.

## 7. Functional Requirements

### 7.1 FR1 — Launch & Navigation

| ID | Requirement |
|----|-------------|
| FR1.1 | `devyard` with no args opens the landing screen within 500ms |
| FR1.2 | Landing has three panels: Projects (left), Status (top-right), Ideas (bottom-right) |
| FR1.3 | Persistent input box at bottom with three-bucket grammar |
| FR1.4 | Input box: project name → navigate; `/skill` → launch skill; else → freeform query to Claude |
| FR1.5 | Project names support fuzzy match; skill names match strictly |
| FR1.6 | Input history persists across sessions (last 100), navigable with Up/Down |
| FR1.7 | Selecting a project opens project view with repos, current branch per repo, last ticket, last session, recent decisions |
| FR1.8 | Esc returns from any sub-screen to landing |
| FR1.9 | Ctrl+C exits cleanly, persisting history |

### 7.2 FR2 — Skills Catalog (49 total)

All 49 skills must be implemented in v1.0. Full per-skill specifications are in the LLD; here is the catalog with category and primary owner.

#### Planning & Discovery (6 skills)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/status` | Current project snapshot — git state, open PRs, recent merges, in-progress issue | any engineer |
| `/inbox` | Cross-project attention queue — PRs to review, failing CI, assigned issues | any engineer |
| `/projects` | Portfolio view — all active projects with health metrics | Tech Lead |
| `/tasks` | Prioritized action list across all projects | any engineer |
| `/roadmap` | Manage `projects/<name>/roadmap.md` (Now/Next/Later/Done) | Product Manager |
| `/stakeholder-update` | Generate weekly/monthly/launch update from PRs, issues, AgDRs, roadmap | Tech Lead |

#### Ticket Creation (12 skills)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/feature` | Structured feature-request issue (user story + acceptance criteria) | Product Manager |
| `/bug` | Structured bug report (Given/When/Then + severity) | QA Engineer |
| `/task` | Technical task ticket (debt/infra/refactor/docs/chore) | any engineer |
| `/spike` | Time-boxed hypothesis-driven investigation | Tech Lead |
| `/spike-close` | Binary disposition (PROMOTE → feature ticket / DISCARD → memo) | spike runner |
| `/investigation` | Sustained root-cause analysis with live working doc | SRE |
| `/idea` | Submit idea to backlog with IDEA-NNN id and dedupe | anyone |
| `/validate-idea` | 5-question gate before spec writing (GREEN/YELLOW/RED) | Product Manager |
| `/tickets-batch` | File 5–20 structured issues in one guided flow | Tech Lead |
| `/migration` | Database-migration ticket + AgDR in one flow | Backend Engineer |
| `/start-ticket` | Declare active ticket for session; required before code edits | every engineer |
| `/write-spec` | Author full PRD with required sections | Product Manager |

#### Architecture & Design (8 skills)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/decide` | Create AgDR (Agent Decision Record) for any technical decision | Tech Lead |
| `/agdr` | Browse, search, show, stats over the AgDR library | any engineer |
| `/c4` | Generate C4 Level 1 & 2 diagrams from the codebase (Mermaid) | Tech Lead |
| `/dfd` | Generate Data Flow Diagram (Mermaid + OWASP Threat Dragon JSON) | Security Auditor |
| `/threat-model` | STRIDE threat model consuming the DFD | Security Auditor |
| `/tech-vision` | Author 7-section architecture vision document | Head of Engineering |
| `/process` | Extract business processes as BPMN 2.0 | Product Manager |
| `/journey` | Generate interactive user-journey HTML map | UX Designer |

#### Coordination (1 skill)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/fan-out` | Spawn N parallel sub-agents for independent work | Tech Lead |

#### Code Review & Quality (5 skills)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/code-review` | Invoke Rex agent for full PR review | PR author |
| `/security-review` | Invoke Hatim agent for security-focused review | author / Sec |
| `/approve-merge` | Human-CEO merge approval + atomic merge | the human |
| `/approve-design` | Per-PR design review approval marker | UI/UX Designer |
| `/audit-deps` | Munir agent — vulnerability + outdated + license + health audit | Platform Engineer |

#### Audits & Launch (9 skills)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/launch-check` | Production readiness across 8 dimensions, GO/WARN/CONDITIONAL/NO-GO | Head of Engineering |
| `/accessibility-audit` | WCAG 2.1 AA compliance deep-dive | UI Designer |
| `/compliance-check` | GDPR + ePrivacy audit consuming the DFD | Head of Security |
| `/analytics-audit` | Event taxonomy and funnel coverage check | Product Analyst |
| `/seo-audit` | Technical SEO scan (meta, sitemap, structured data) | PM |
| `/performance-audit` | Bundle + image + CWV + API perf check | Frontend Engineer |
| `/monitoring-audit` | Observability + alerting + runbook readiness | SRE |
| `/docs-audit` | Diataxis coverage + staleness check | Tech Lead |
| `/release` | Cut a DevYard framework release (semver + CHANGELOG + PR) | maintainer |

#### System Management (5 skills)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/setup` | First-run framework bootstrap; configures `onboarding.yaml` | new user |
| `/handover` | Onboard external repo into DevYard; generate assessment | Tech Lead |
| `/update` | Sync fork with upstream `devyard/devyard` | maintainer |
| `/split-portfolio` | Migrate to public-framework + private-sibling repo split | maintainer |
| `/onboard` | DEPRECATED — redirects to `/setup` or `/handover` | — |

#### Documentation & Operations (3 skills)

| Skill | Purpose | Primary role |
|-------|---------|--------------|
| `/extract-features` | Scan codebase for full feature inventory across 6 axes | any engineer |
| `/debug` | Structured hypothesis-driven debugging flow | any engineer |
| `/cli-builder` | Expert guidance for building CLI/TUI tools | any engineer |

**Count check:** 6 + 12 + 8 + 1 + 5 + 9 + 5 + 3 = **49 skills** ✓

### 7.3 FR3 — Roles (19 personas)

All 19 roles in v1.0. Each is a markdown file with frontmatter (name, description, tools_allowed, focus) and a system-prompt body.

| Department | Roles |
|------------|-------|
| Engineering (7) | Head of Engineering (Khalid), Tech Lead (Hisham), Backend (Karim), Frontend (Yasmin), QA (Salim), Platform (Adel), SRE (Saif) |
| Product (3) | Head of Product (Omar), Product Manager (Mariam), Product Analyst (Hanan) |
| Design (3) | Head of Design (Maha), UI Designer (Nour), UX Designer (Iman) |
| Security (3) | Head of Security (Faisal), Security Auditor (Hakim), Penetration Tester (Hamza) |
| Data (3) | Head of Data (Khalil), Data Analyst (Nadia), Data Engineer (Anwar) |

**Activation methods:**

1. `detect-role-trigger.sh` hook auto-banners based on file paths, labels, or prompts
2. User explicit: "act as Salim for this QA work"
3. Skill activates a role internally

**Conflict resolution:** when two roles disagree (e.g., developer wants to ship, reviewer wants to block), reviewer wins. Override is explicit, logged to `Work/_System/override-log.md`.

### 7.4 FR4 — Agents (5 specialists)

Sub-Claude processes with restricted tool access. They cannot write or edit code; only produce reviews, audits, and marker files.

| Agent | Persona | Tools | Invoked by |
|-------|---------|-------|------------|
| Rex | Code Reviewer | Read, Grep, Glob, Bash | `/code-review`, `auto-code-review.sh` hook |
| Hatim | Security Reviewer | Read, Grep, Glob, Bash | `/security-review` |
| Tariq | PR Manager | Bash, Read, Grep, Glob | end-to-end PR coordination |
| Idris | Ticket Manager | Bash, Read | every ticket-creation skill |
| Munir | Dependency Auditor | Bash, Read, Grep, Glob | `/audit-deps`, weekly CI |

Agents are invoked through Claude Code's sub-agent mechanism. They run with their persona's system prompt, restricted tool list, and produce their specific output (review on GitHub, marker file locally, ticket creation, etc.).

### 7.5 FR5 — Rules (11 behavioral laws)

Markdown files loaded into every Claude Code session. Self-enforced by Claude reading them; hooks are the deterministic backstop.

| Rule | What it constrains |
|------|---------------------|
| `ticket-vocabulary.md` | `#N` and `Ticket` refer ONLY to real GitHub issues, never to plan items |
| `workflow-gates.md` | 6 sequential SDLC gates — each must clear before next |
| `agdr-decisions.md` | HARD STOP — run `/decide` before any technical decision |
| `git-conventions.md` | Branch naming, PR title, commit format, staging discipline |
| `parallel-work.md` | When to offer `/fan-out` and when not to |
| `code-standards.md` | TypeScript strict, no bare `any`, AAA tests, >80% coverage |
| `role-triggers.md` | Activation table for all 19 roles |
| `pr-workflow.md` | What counts as PR approval; explicit hard stops |
| `plan-mode.md` | When to enter plan mode (≥4 dependent steps, hard-to-reverse) |
| `pr-quality.md` | Glossary mandatory, SHA verification, design review for UI |
| `leak-protection.md` | No private project refs in public-repo issues/PRs |

### 7.6 FR6 — Hooks (28 enforcement scripts)

Shell scripts fired by Claude Code at `PreToolUse`, `PostToolUse`, or `SessionStart`. Exit 2 blocks; exit 0 allows. Hooks cannot be bypassed by Claude — only by explicit user override.

**Session Start hooks (6):**

| Hook | Effect |
|------|--------|
| `onboarding-check.sh` | Banner if `onboarding.yaml` has placeholder values |
| `check-upstream-drift.sh` | Banner if new DevYard release is available |
| `check-portfolio-config.sh` | Validate portfolio config structure |
| `clear-bootstrap-marker.sh` | Remove stale bootstrap markers |
| `clear-issue-skill-marker.sh` | Remove stale issue-skill markers |
| `link-custom-skills.sh` | Symlink private custom skills (split-portfolio mode) |

**Ticket & Workflow hooks (5):**

| Hook | Trigger | Effect |
|------|---------|--------|
| `require-active-ticket.sh` | Write/Edit/Bash-write | Block code edits unless active ticket declared |
| `require-skill-for-issue-create.sh` | `gh issue create` | Block raw issue creation — must use skill |
| `suggest-ticket-template.sh` | `gh issue create` | Advisory reminder (non-blocking) |
| `require-migration-ticket.sh` | Edit/Write on migration paths | Require migration label + AgDR ref |
| `validate-issue-structure.sh` | `gh issue create` | Validate ticket body sections per type |

**Git hooks (8):**

| Hook | Trigger | Effect |
|------|---------|--------|
| `block-git-add-all.sh` | `git add -A / . / --all` | Block bulk staging |
| `block-main-push.sh` | `git push` | Block pushes to protected branches |
| `validate-branch-name.sh` | `git push` | Validate `type/TICKET-N-description` format |
| `validate-commit-format.sh` | `git commit` | Validate `type(scope): subject` |
| `verify-commit-refs.sh` | `git commit` | Check `Closes #N` refs are real issues |
| `check-secrets.sh` | `git commit` | Scan diff for secret patterns |
| `pre-push-gate.sh` | `git push` | Run lint/typecheck/test/build |
| `require-agdr-for-arch-changes.sh` | `git commit` | Require AgDR ref when arch paths staged |

**PR hooks (8):**

| Hook | Trigger | Effect |
|------|---------|--------|
| `auto-code-review.sh` | `gh pr create` (post) | Write pending marker; instruct Rex invocation |
| `validate-pr-create.sh` | `gh pr create` (pre) | Validate title, ticket open, body sections |
| `require-agdr-for-arch-pr.sh` | `gh pr create` (pre) | Require AgDR ref in PR body for arch changes |
| `require-design-review-for-ui.sh` | `gh pr merge` | Block merge if UI paths touched without design approval |
| `block-merge-on-red-ci.sh` | `gh pr merge` | Block merge if any CI check failing/pending |
| `block-unreviewed-merge.sh` | `gh pr merge` | Require Rex marker + CEO marker, both SHA-validated |
| `warn-stale-review-markers.sh` | `git push` (post) | Warn / delete stale review markers |
| `block-private-refs-in-public-repos.sh` | `gh issue/pr create` | Block private project refs in public bodies |

**Role & Advisory hook (1):**

| Hook | Effect |
|------|--------|
| `detect-role-trigger.sh` | Advisory banner for role activation (never blocks) |

**Total: 6 + 5 + 8 + 8 + 1 = 28 hooks** ✓

### 7.7 FR7 — Workflows (3 process maps)

Reference markdown documents describing how phases connect.

| Workflow | Phases |
|----------|--------|
| `sdlc.md` | 7 phases: Planning → Tech Design → Build → Code Review → QA → Deploy → Monitor |
| `code-review.md` | Author prep → reviewer responsibilities → anti-patterns Rex blocks |
| `deployment.md` | CI/CD stages (11) → rollback decision tree |

### 7.8 FR8 — Golden-Path Pipelines (7 CI templates)

Ready-to-drop GitHub Actions workflows under `golden-paths/pipelines/`.

| Pipeline | Purpose |
|----------|---------|
| `ci.yml` | Combined: Rex + Hatim + Munir parallel jobs + summary PR comment |
| `code-quality.yml` | TS check, ESLint, Prettier, tests, build + Rex review comment |
| `security.yml` | Semgrep, npm audit, TruffleHog, CodeQL + Hatim review comment |
| `dependency-audit.yml` | Weekly Monday cron — Munir agent + auto-create issues for Critical/High |
| `pr-title-check.yml` | Validate PR title has ticket ID; auto-label by type |
| `review-check.yml` | Verify Rex reviewed latest SHA before merge |
| `seo-check.yml` | Content audit for `.md` / `.mdx` files; scoring 0–100 |

### 7.9 FR9 — Vault Schema

The Obsidian vault is the source of truth for all DevYard data. Schema is enforced by frontmatter validators and the BRD/Design validator hooks.

**Vault root:** `~/Documents/DevYard-Vault/` (configurable).

**Top-level structure:**

```
DevYard-Vault/
├── _System/                       # config, schemas, templates, override log
├── _Inbox/                        # quick-capture ideas
├── Projects/<Name>/               # per-project work
│   ├── README.md                  # project home + frontmatter state
│   ├── BRDs/                      # /feature output
│   ├── Designs/                   # /write-spec, /tech-vision
│   ├── Tasks/                     # /tasks output
│   ├── Sessions/                  # session logs
│   ├── Decisions/                 # AgDRs (also in /docs/agdr/ in repos)
│   ├── investigations/            # /investigation output
│   ├── spike-memos/               # /spike-close DISCARD output
│   └── handover-assessment.md     # /handover output
├── Ideas/                         # /idea promoted
├── Decisions/                     # cross-project AgDRs
├── Handovers/                     # archived project summaries
└── Roadmaps/                      # /roadmap output (mirrored per-project)
```

**Required frontmatter per entity type:** see HLD §5 and LLD §6.

### 7.10 FR10 — Doctor

`devyard doctor` checks every dependency and integration. `--hooks-deep` fires synthetic bad inputs to verify hooks block correctly. Output is a colored Catppuccin checklist with remediation per failure.

**v1.0 doctor checks (24 total):**

- Environment (3): Node version, Claude binary, config valid
- Vault (4): vault path exists, top-level skeleton, schemas present, templates present
- Integrations (4): Obsidian MCP installed + reachable, Ollama reachable, GitLab token (optional)
- Hooks basic (3): all 28 hook scripts exist + executable, Claude settings wired, audit log writable
- Skills (3): all 49 skill files present, role table valid, agent files present
- Hooks deep (with `--hooks-deep`, 7+): one per high-stakes hook with synthetic bad input

### 7.11 FR11 — Installer

`devyard init` performs idempotent setup:

1. Read or create `~/.devyard/config.yaml`
2. Create vault skeleton (top-level folders, `_System/templates/`, `_System/schemas/`)
3. Create `~/.devyard/` skeleton (logs, roles, rules, skills, hooks, schemas, templates as symlinks to bundled assets)
4. Make all hook scripts executable
5. Merge Claude Code settings (`~/.claude/settings.json`) without overwriting user content
6. Install MCP servers (Obsidian MCP)
7. Run `devyard doctor`; if any required check fails, exit with remediation

**Idempotency:** every step checks "exists and correct?" before acting. No destructive overwrites.

**First-time bootstrap:** `install.sh` wrapper does: install pnpm → `pnpm install` → `pnpm build` → `pnpm link --global` → `devyard init`.

### 7.12 FR12 — Theme

Catppuccin Mocha, locked. Every visible UI surface uses the palette. Tokens referenced by semantic name (`semantic.success`), never by hex. No other theme in v1.0.

### 7.13 FR13 — AgDR (Agent Decision Records)

Every technical decision produces an AgDR file: `docs/agdr/AgDR-NNNN-slug.md` in the relevant repo (mirrored to `Projects/<Name>/Decisions/` in the vault). Required structure: Y-statement, Context, Options, Decision, Consequences, Status.

**Enforcement:** `require-agdr-for-arch-changes.sh` (commit) and `require-agdr-for-arch-pr.sh` (PR create) block when arch-path files are staged without an AgDR reference.

## 8. Non-Functional Requirements

### 8.1 Performance

| ID | Budget |
|----|--------|
| NFR1.1 | Cold start to first paint: < 500ms |
| NFR1.2 | Input box keystroke latency: < 50ms p95 |
| NFR1.3 | Project navigation: < 200ms |
| NFR1.4 | Skill invocation (process spawn): < 500ms before Claude takes over |
| NFR1.5 | Vault scan for 50 projects: < 100ms |
| NFR1.6 | Hook execution: < 200ms p95 |
| NFR1.7 | Doctor full run: < 5 seconds |
| NFR1.8 | Doctor `--hooks-deep`: < 15 seconds |

### 8.2 Reliability

- A panel crash must not crash the app; render error state and continue.
- MCP unreachable degrades specific panels, never blocks launch.
- Malformed project frontmatter shows warning, does not crash scan.
- Hook script errors surface to the user; never silently swallowed.

### 8.3 Security

- Secrets never written to repo or vault. Scanned by `check-secrets.sh` on commit.
- Destructive git ops (`push --force` to main, `branch -D` on main) blocked by hooks.
- GitLab/GitHub tokens in env vars only, never in `config.yaml`.
- All hook executions audit-logged to `~/.devyard/logs/hook-audit.log`.
- Override events logged to `Work/_System/override-log.md`.

### 8.4 Maintainability

- TypeScript strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Every public function has JSDoc.
- Module boundaries explicit (see LLD §1).
- Every architectural decision recorded as ADR in `docs/decisions/`.

### 8.5 Portability & Recovery

- Fresh macOS to working state: < 15 minutes via installer.
- All user state recoverable from the Obsidian vault.
- Losing `~/.devyard/` loses configuration only, not work.

### 8.6 Accessibility (terminal)

- All Catppuccin color combos used together meet WCAG AA contrast (4.5:1) on Mocha base.
- No information conveyed by color alone; icons or labels accompany every color signal.
- Keyboard-only navigation mandatory.

## 9. Success Metrics

| Metric | Target | How measured |
|--------|--------|--------------|
| Cold-start time | < 500ms | `time devyard` averaged over 10 warm-cache runs |
| Keystroke latency | < 50ms p95 | Instrumented `performance.now()` in dev mode |
| Daily use | ≥ 5 launches per working day | Self-reported, first month |
| Context-switch time | < 5s from launch to "I know where I left off" | Self-reported |
| Doctor pass rate | 100% on fresh install | Verified after `devyard init` |
| Hooks-deep pass rate | 100% | `devyard doctor --hooks-deep` |
| Override-log entries | < 1 / week | Monday weekly review |
| False-positive hook blocks | < 1 / week | Self-reported |
| AgDR creation rate | ≥ 90% of arch decisions documented | Self-reported plus arch-hook block rate |
| Skill usage | All 49 skills used at least once in first 90 days | Hook audit log |
| Launch checklist completion | `/launch-check` returns GO before every production release | Per-release |

## 10. Assumptions and Constraints

### 10.1 Assumptions

- macOS (Apple Silicon or Intel) with Node ≥ 20 LTS
- Claude Code installed and authenticated
- Obsidian installed (optional — MCP server reads vault as plain files)
- Ollama installed, running on `localhost:11434`, at least one model pulled
- GitHub CLI (`gh`) installed and authenticated
- User has GitHub repos with Issues enabled
- Repo conventions follow `{type}/{TICKET}-{description}` branching

### 10.2 Constraints

- Single user, single machine
- macOS only
- TypeScript, Node ≥ 20, ESM
- Terminal-only UI
- Vault is single source of truth; no SQLite, no remote DB

## 11. Risks

| ID | Risk | L | I | Mitigation |
|----|------|---|---|------------|
| R1 | Ink rendering latency exceeds budget | M | H | Kill criterion: fall back to fzf + plain stdout if > 80ms p95 after 2 weeks |
| R2 | Scope of 49 skills is overwhelming | H | H | Phased build (A–D); each skill is small and testable |
| R3 | Hook silently breaks | M | H | `doctor --hooks-deep` + audit log canary review |
| R4 | Schema drift between roles, skills, validators | M | M | Schemas centralized in `~/.devyard/schemas/` |
| R5 | Vault becomes single point of failure | L | H | Vault in iCloud sync + weekly git snapshot |
| R6 | Persona names confuse users in shared contexts | M | L | Names are internal; visible names are role titles |
| R7 | Maintaining 49 skills exceeds solo capacity | H | M | Many skills share infrastructure (Idris, validators, templates); marginal cost per skill is low after first 10 |
| R8 | Claude Code API or hook system changes break integration | M | H | Pin Claude Code version; track upstream changelog; abstract hook wiring through a single config file |
| R9 | GitHub rate-limits affect `/inbox`, `/projects`, `/tasks` | L | M | Cache per-session; use GraphQL where possible |
| R10 | Force-push or destructive command escapes hook | L | H | Hook tested via `--hooks-deep`; audit log reviewed weekly |

## 12. Open Questions

- **Q1** Should MCP servers install globally (`~/.config/claude-code/`) or per-project? **Current:** globally.
- **Q2** Should the Ideas panel show all recent notes or only `#idea`-tagged? **Current:** only `#idea`.
- **Q3** When repo state diverges from frontmatter, auto-sync or warn? **Current:** warn in v1.0, auto-sync in v1.1.
- **Q4** Should `/decide` be invokable from inside another skill (e.g., during `/feature`)? **Current:** yes — embedded `/decide` is allowed.
- **Q5** Should Rex re-review on every push, or only when explicitly invoked? **Current:** every push (via `auto-code-review.sh` post-hook).

## 13. Glossary

| Term | Definition |
|------|-----------|
| Agent | Sub-Claude process with restricted tools; produces specific output (Rex, Hatim, Tariq, Idris, Munir) |
| AgDR | Agent Decision Record. A markdown file under `docs/agdr/` capturing one technical decision |
| Artifact | Any structured document DevYard reads or writes: BRD, design, AgDR, session, idea, handover |
| Hook | Deterministic shell script fired by Claude Code; cannot be bypassed by Claude |
| Marker | A file under `.claude/session/` that records workflow state (active ticket, review approval) |
| MCP | Model Context Protocol — the protocol DevYard uses to talk to Obsidian |
| Ops Root | The DevYard fork directory containing `.claude/`, `roles/`, `golden-paths/`, etc. |
| Role | Markdown file with system prompt that defines an AI persona |
| Rule | Markdown file loaded into Claude sessions as advisory behavioral constraint |
| Skill | Markdown definition of a slash command and its workflow |
| Stage | Position in the SDLC pipeline; recorded in artifact frontmatter |
| Vault | The Obsidian vault that is DevYard's source of truth |
| Y-statement | AgDR format: "In the context of X, facing Y, we chose Z because A, accepting B" |

## 14. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Author | maintainer | drafted | 2026-05-24 |
| Approver | maintainer (after cold re-read) | pending | — |
