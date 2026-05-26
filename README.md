# DevYard

**Personal engineering OS — a terminal-based TUI control plane for the full SDLC.**

DevYard gives a solo developer a single entry point for every phase of software development: idea capture, spec writing, ticket management, code review, security auditing, performance measurement, and release. It runs on macOS, presents a Catppuccin Mocha–styled terminal UI, and orchestrates Claude Code through structured AI personas, deterministic safety hooks, and 49 slash-command skills.

---

## Quick Start

### Requirements

- macOS (v1.0 only)
- Node.js 20.11.0 LTS (`nvm use` in the repo root)
- [Claude Code](https://claude.ai/code) installed and authenticated
- [Obsidian](https://obsidian.md) (optional — for vault browsing)

### Install

```bash
bash install.sh
```

This installs pnpm, builds DevYard, links the `devyard` binary globally, and runs `devyard init` to scaffold the vault and wire Claude Code hooks.

### First Run

```bash
devyard
```

Opens the landing screen with three panels:
- **Left**: Projects panel — all discovered projects with tier, status, and last ticket
- **Top-right**: Status panel — Claude Code and Ollama availability
- **Bottom-right**: Ideas panel — 5 most recent vault ideas via MCP

Type a project name to navigate to it, type `/skill` to launch a skill, or type freely to send a freeform query to Claude Code.

---

## The Four-Layer Model

DevYard enforces engineering standards through four orthogonal layers:

| Layer | Mechanism | Enforced by | Bypassable? |
|-------|-----------|-------------|-------------|
| **Skills** | 49 slash commands | User invocation | N/A — user choice |
| **Roles** | 19 AI personas | Claude reading persona file | Yes — Claude can resist |
| **Rules** | 11 behavioral laws | Claude reading rule files | Yes — advisory |
| **Hooks** | 28 bash scripts | Claude Code harness at tool-call time | Only by explicit user override |

Rules and roles shape behavior for the 99% case. Hooks are the deterministic backstop.

---

## Skill Catalog (49 Skills)

### Navigation & Status
| Skill | Role | Description |
|-------|------|-------------|
| `/status` | Hisham | Summarise active project: branch, tickets, recent decisions |
| `/inbox` | Mariam | List `_Inbox/` items and open GitHub issues |
| `/projects` | Khalid | List all projects with tier, status, last ticket |
| `/tasks` | Hisham | List open GitHub issues for the active project |

### Planning & Specification
| Skill | Role | Description |
|-------|------|-------------|
| `/feature` | Mariam | Write BRD + Design artifact pair |
| `/write-spec` | Mariam | Produce BRD + Design with validation |
| `/roadmap` | Omar | Generate roadmap document |
| `/stakeholder-update` | Mariam | Generate stakeholder update |
| `/process` | Khalid | Document an engineering process |
| `/journey` | Iman | Map user journey with stages and pain points |

### Ideas & Decisions
| Skill | Role | Description |
|-------|------|-------------|
| `/idea` | Mariam | Capture idea with `IDEA-NNN` identifier |
| `/validate-idea` | Omar | Evaluate idea → GREEN / YELLOW / RED verdict |
| `/decide` | Hisham | Write AgDR (Agent Decision Record) |
| `/agdr` | Hisham | Browse, search, or summarise AgDRs |
| `/c4` | Hisham | Generate C4 Level 1 + 2 diagrams as Mermaid |
| `/dfd` | Hisham | Generate Data Flow Diagram as Mermaid |
| `/threat-model` | Faisal | STRIDE threat model |
| `/tech-vision` | Khalid | Write tech vision document |

### Development Workflow
| Skill | Role | Description |
|-------|------|-------------|
| `/bug` | Karim | Create Bug GitHub issue via Idris agent |
| `/task` | Hisham | Create Task GitHub issue via Idris agent |
| `/spike` | Hisham | Create Spike issue with hypothesis + kill criteria |
| `/spike-close` | Hisham | PROMOTE → new feature ticket; DISCARD → spike memo |
| `/investigation` | Saif | Create Investigation document with `INV-NNN` ID |
| `/tickets-batch` | Hisham | Create multiple GitHub issues in one session |
| `/start-ticket` | Hisham | Write active-ticket marker before code edits |
| `/migration` | Adel | Write migration plan (requires Gate 3a: migration ticket + AgDR) |
| `/debug` | Karim | Structured debug session: hypothesis → root cause → fix |
| `/fan-out` | Hisham | Spawn ≤5 concurrent sub-agents for parallel work |

### Review & Approval
| Skill | Role | Description |
|-------|------|-------------|
| `/code-review` | Hisham | Invoke Rex agent for code review + SHA-locked approval |
| `/security-review` | Faisal | Invoke Hatim agent for CRITICAL/HIGH/MEDIUM/LOW findings |
| `/approve-merge` | Khalid | Write `<N>-ceo.approved` marker + `gh pr merge --squash` |
| `/approve-design` | Maha | Write `<N>-design.approved` marker for UI PRs |

### Auditing
| Skill | Role | Description |
|-------|------|-------------|
| `/launch-check` | Khalid | Pre-launch checklist → GO / GO_WITH_WARNINGS / CONDITIONAL_GO / NO_GO |
| `/audit-deps` | Hakim | Invoke Munir agent for dependency + license audit |
| `/accessibility-audit` | Iman | WCAG AA compliance audit |
| `/compliance-check` | Faisal | Regulatory compliance audit |
| `/analytics-audit` | Nadia | Analytics instrumentation coverage audit |
| `/seo-audit` | Yasmin | SEO metadata and structure audit |
| `/performance-audit` | Saif | Performance budgets and bottlenecks audit |
| `/monitoring-audit` | Saif | Monitoring coverage audit (alerts, dashboards, on-call) |
| `/docs-audit` | Hisham | Documentation coverage and freshness audit |

### Portfolio & Tooling
| Skill | Role | Description |
|-------|------|-------------|
| `/release` | Khalid | Bump semver, update CHANGELOG, create release PR |
| `/setup` | Adel | Scaffold new project repo (branch protection, CI, labels) |
| `/handover` | Khalid | Produce `handover-assessment.md`, register in `projects.yaml` |
| `/update` | Hisham | Update project frontmatter (status, tier, last_branch, last_ticket) |
| `/split-portfolio` | Khalid | Create public + private repos, migrate content |
| `/onboard` | Khalid | Deprecated — redirects to `/setup` or `/handover` |
| `/extract-features` | Hanan | Scan codebase → `feature-inventory.md` |
| `/cli-builder` | Karim | Scaffold a new CLI tool with Commander + tests |

---

## Roles (19 AI Personas)

| Department | Role | Name |
|------------|------|------|
| Engineering | Head of Engineering | Khalid |
| Engineering | Tech Lead | Hisham |
| Engineering | Backend Engineer | Karim |
| Engineering | Frontend Engineer | Yasmin |
| Engineering | QA Engineer | Salim |
| Engineering | Platform Engineer | Adel |
| Engineering | SRE | Saif |
| Product | Head of Product | Omar |
| Product | Product Manager | Mariam |
| Product | Product Analyst | Hanan |
| Design | Head of Design | Maha |
| Design | UI Designer | Nour |
| Design | UX Designer | Iman |
| Security | Head of Security | Faisal |
| Security | Security Auditor | Hakim |
| Security | Penetration Tester | Hamza |
| Data | Head of Data | Khalil |
| Data | Data Analyst | Nadia |
| Data | Data Engineer | Anwar |

---

## Hooks (28 Safety Enforcements)

Hooks fire deterministically at Claude Code tool-call time. Exit 2 blocks; exit 0 allows.

**Key enforcements:**
- `require-active-ticket.sh` — blocks code edits without an active ticket marker
- `check-secrets.sh` — blocks commits containing AWS/GitHub/Slack token patterns
- `block-main-push.sh` — blocks push to main/master/dev/develop
- `block-git-add-all.sh` — blocks `git add -A`, `git add .`
- `block-unreviewed-merge.sh` — validates Rex + human approval SHA markers match PR HEAD
- `validate-branch-name.sh` — enforces `{type}/{TICKET-ID}-{description}` format
- `validate-commit-format.sh` — enforces conventional commit format
- `pre-push-gate.sh` — runs lint + typecheck + test + build before push

All executions are audit-logged to `~/.devyard/logs/hook-audit.log`.

---

## Agents (5 Restricted Sub-Processes)

| Agent | Tools | Purpose |
|-------|-------|---------|
| Rex | Read, Grep, Glob, Bash (read-only) | Code review + SHA-locked approval marker |
| Hatim | Read, Grep, Glob, Bash (read-only) | Security review with severity classification |
| Tariq | Bash, Read, Grep, Glob | End-to-end PR lifecycle |
| Idris | Bash, Read | GitHub issue creation with required structure |
| Munir | Bash, Read, Grep, Glob | Dependency audit + auto-created security issues |

All agents have `tools_denied: [Write, Edit, MultiEdit]` — they cannot modify code.

---

## Health Check

```bash
devyard doctor             # 24 checks, must complete within 5s
devyard doctor --hooks-deep  # + 7 synthetic hook checks, within 15s
```

---

## Configuration

`~/.devyard/config.yaml` — generated by `devyard init` with safe defaults. Never stores API tokens (those come from environment variables).

Key sections: `vault`, `ollama`, `claude`, `mcp`, `ui`, `performance`, `logging`, `env`, `portfolio`.

---

## Contributing

1. All code is TypeScript strict-mode ESM — `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
2. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all must pass
3. Follow the Kiro requirements-first workflow: read `.kiro/specs/devyard/` before implementing
4. UI components import from `theme/semantic.ts` and `theme/icons.ts` only
5. Atomic writes only — never write directly to target paths; use `.tmp.{pid}` + rename

---

## Performance Budgets

| Operation | Budget |
|-----------|--------|
| Cold start to first paint | ≤ 500ms |
| Vault scan (50 projects) | ≤ 100ms |
| Keystroke latency | ≤ 50ms p95 |
| Project navigation | ≤ 200ms |
| Skill launch (execvp) | ≤ 500ms |
| Doctor full run | ≤ 5s |
| Doctor `--hooks-deep` | ≤ 15s |

---

## License

MIT
