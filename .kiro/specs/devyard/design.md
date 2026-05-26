---
title: DevYard — Technical Design
version: 1.0
status: draft
linked_requirements: requirements.md
linked_brd: BRD-v2.0.md
linked_hld: HLD-v2.0.md
linked_lld: LLD-v2.0.md
created: 2026-05-24
last_updated: 2026-05-24
tags: [design, devyard, v1, architecture]
---

# DevYard — Technical Design

## Overview

DevYard is a single-user, terminal-based personal engineering OS built in TypeScript. It runs on macOS, presents a TUI control plane styled with the Catppuccin Mocha theme, and orchestrates a complete software-development lifecycle through structured AI personas (roles), deterministic safety hooks, and a library of 49 slash-command skills.

The system integrates with Claude Code as its LLM engine, an Obsidian vault as the single source of truth for all artifacts, Ollama for local model status, and GitHub via the `gh` CLI.

### Design Goals

- **G1** Cold start to first paint under 500ms via parallel I/O and skeleton rendering.
- **G2** Single entry point (`devyard`) for navigation, status, and skill invocation.
- **G3** Obsidian vault as the canonical, human-readable source of truth for all artifacts.
- **G4** Deterministic hook enforcement that cannot be bypassed by the LLM.
- **G5** Strict Catppuccin Mocha visual identity via semantic token indirection.
- **G6** TypeScript strict mode throughout; no bare `any`; ESM-only.

### Key Constraints

- macOS only for v1.0; Node 20.11.0 LTS; ESM modules.
- DevYard never calls LLMs directly — all LLM work is delegated to Claude Code child processes.
- Agents (Rex, Hatim, Tariq, Idris, Munir) are read-only; they cannot write or edit code files.
- All hook executions are audit-logged; hooks cannot be silently bypassed.


---

## Architecture

### C4 Level 1 — System Context

```mermaid
C4Context
  title DevYard System Context

  Person(user, "Developer", "Single-user maintainer on macOS")

  System(devyard, "DevYard", "Personal engineering OS\nTUI + Engine on macOS")

  System_Ext(claude, "Claude Code", "LLM development tool\nroles, rules, skills, hooks")
  System_Ext(obsidian, "Obsidian Vault", "Source of truth\nartifacts + state")
  System_Ext(ollama, "Ollama", "Local LLM runtime\nstatus only")
  System_Ext(github, "GitHub", "Code, issues, PRs, CI")
  System_Ext(mcp_obs, "Obsidian MCP Server", "stdio vault read/write")

  Rel(user, devyard, "runs `devyard`\ntypes skills, navigates")
  Rel(devyard, claude, "spawns with role+cwd+env")
  Rel(devyard, mcp_obs, "stdio MCP protocol")
  Rel(mcp_obs, obsidian, "reads/writes .md files")
  Rel(devyard, ollama, "HTTP GET /api/tags")
  Rel(devyard, github, "via `gh` CLI\nissues, PRs, reviews")
  Rel(claude, github, "via `gh` CLI\nduring skill execution")
```

### C4 Level 2 — Container View

```mermaid
graph TB
  subgraph Terminal["User's Terminal"]
    direction TB
    UI[DevYard TUI\nInk + React + Catppuccin]
    DOCTOR[Doctor\n24 health checks]
    INSTALLER[Installer\ndevyard init]
  end

  subgraph Engine["DevYard Engine (assets/)"]
    direction TB
    SKILLS[49 Skills\nslash commands]
    ROLES[19 Roles\npersona prompts]
    AGENTS[5 Agents\nRex, Hatim, Tariq, Idris, Munir]
    RULES[11 Rules\nsession-start advisory]
    HOOKS[28 Hooks\npre/post/session bash]
  end

  subgraph Stores["State Stores"]
    direction TB
    VAULT[(Obsidian Vault\n~/Documents/DevYard-Vault)]
    LOCAL[(~/.devyard\nconfig, history, logs)]
    REPOS[(Git Repos\ncode + AgDRs)]
  end

  subgraph External["External Systems"]
    direction TB
    CLAUDE[Claude Code]
    MCP[Obsidian MCP server]
    OLLAMA[Ollama :11434]
    GH[GitHub API via gh]
  end

  UI -->|execvp spawn| CLAUDE
  CLAUDE -.->|loads| SKILLS
  CLAUDE -.->|loads| ROLES
  CLAUDE -.->|loads| RULES
  CLAUDE -.->|invokes| AGENTS
  CLAUDE -.->|fires| HOOKS

  UI -->|stdio| MCP
  MCP -->|fs| VAULT
  UI -->|HTTP| OLLAMA
  UI -->|reads| LOCAL
  CLAUDE -->|gh CLI| GH

  HOOKS -->|writes| LOCAL
  SKILLS -->|writes| VAULT
  SKILLS -->|writes| REPOS

  DOCTOR -.->|verifies| UI
  DOCTOR -.->|verifies| MCP
  DOCTOR -.->|verifies| OLLAMA
  DOCTOR -.->|verifies| HOOKS
  INSTALLER -->|scaffolds| VAULT
  INSTALLER -->|scaffolds| LOCAL
```


### Four-Layer Enforcement Model

DevYard's engine is built on four orthogonal layers. Each answers a different question and is enforced at a different time.

```mermaid
graph LR
  subgraph WHO["WHO am I right now?"]
    R[Roles\n19 personas]
  end

  subgraph WHAT["WHAT is allowed?"]
    RU[Rules\n11 laws]
  end

  subgraph HOW["HOW do I do this?"]
    S[Skills\n49 commands]
  end

  subgraph BACKSTOP["DETERMINISTIC backstop"]
    H[Hooks\n28 scripts]
  end

  USER[User] -->|"invokes /skill"| S
  S -->|"activates"| R
  R -->|"reads"| RU
  S -->|"calls tool"| TOOL[Claude tool call]
  TOOL -->|"intercepted by"| H
  H -->|"block or allow"| TOOL
  TOOL -->|"if allowed"| EFFECT[Effect: file edit, git, gh, MCP]
```

| Layer | Enforced by | When | Bypassable? |
|-------|-------------|------|-------------|
| Rules | Claude reading them | Session start (advisory) | Yes — Claude can ignore |
| Roles | Claude adopting persona | Skill invocation / trigger | Yes — Claude can resist |
| Skills | User invoking slash command | User-driven | N/A — user choice |
| Hooks | Claude Code harness | Tool call (deterministic) | Only by explicit user override |

Rules and roles shape behavior for the 99% case. Hooks are the deterministic backstop for the 1% where the LLM drifts.

### Cold Launch Data Flow

```mermaid
flowchart TD
  START([user runs devyard])
  LOAD_CFG[Load ~/.devyard/config.yaml]
  SCAN[Scan Projects/*/README.md\np-limit 16 parallel reads]
  PING_OBS[Ping Obsidian MCP\nstdio connect]
  PING_OLL[Ping Ollama HTTP\nGET /api/tags]
  LOAD_HIST[Load history.json]
  RENDER[Render LandingScreen\nskeleton at 80ms]
  FILL[Fill panels async\nas data arrives]
  READY([first paint < 500ms])

  START --> LOAD_CFG
  LOAD_CFG --> SCAN
  LOAD_CFG --> PING_OBS
  LOAD_CFG --> PING_OLL
  LOAD_CFG --> LOAD_HIST
  SCAN --> RENDER
  PING_OBS --> RENDER
  PING_OLL --> RENDER
  LOAD_HIST --> RENDER
  RENDER --> READY
  READY --> FILL
```


---

## Components and Interfaces

### Module Boundaries

```
src/
├── cli.ts                  # entry point, commander routing
├── app.tsx                 # Ink app root, context providers
├── config/                 # Config loading and validation
│   ├── load.ts             # readConfig(): Config
│   ├── defaults.ts         # DEFAULT_CONFIG: Config
│   └── types.ts            # Config interface
├── theme/                  # Catppuccin Mocha theme system
│   ├── catppuccin.ts       # palette tokens (internal only)
│   ├── semantic.ts         # semantic role mapping (public)
│   ├── icons.ts            # unicode icon constants (public)
│   └── index.ts            # re-exports semantic + icons
├── data/                   # Vault data layer
│   ├── vault-scanner.ts    # scanVault(): ScanResult
│   ├── frontmatter.ts      # read/write/validate frontmatter
│   ├── project-repo.ts     # project CRUD operations
│   ├── artifact-repo.ts    # generic artifact CRUD
│   ├── history.ts          # input history persistence
│   ├── ollama.ts           # Ollama HTTP status check
│   ├── github.ts           # gh CLI wrapper
│   └── types.ts            # all frontmatter interfaces
├── mcp/                    # MCP client layer
│   ├── client.ts           # ObsidianMcpClient class
│   ├── obsidian-client.ts  # typed Obsidian MCP calls
│   └── types.ts            # MCP response types
├── panels/                 # Ink panel components
│   ├── ProjectsPanel.tsx
│   ├── StatusPanel.tsx
│   ├── IdeasPanel.tsx
│   ├── InputBox.tsx
│   └── Spinner.tsx
├── screens/                # Ink screen components
│   ├── LandingScreen.tsx
│   ├── ProjectScreen.tsx
│   ├── ConfigScreen.tsx
│   └── IdeasScreen.tsx
├── input/                  # Input handling
│   ├── dispatcher.ts       # dispatch(input, ctx): Action
│   ├── matcher.ts          # Trie-based project name matching
│   ├── history.ts          # history navigation
│   └── autocomplete.ts     # autocomplete suggestion engine
├── skills/                 # Skill resolution and launch
│   ├── launcher.ts         # launchSkill(args): Promise<number>
│   ├── resolver.ts         # resolveSkill(id): SkillDefinition
│   ├── env.ts              # buildEnv(skill, project, config): Env
│   └── types.ts            # SkillDefinition, SkillInput
├── doctor/                 # Health check system
│   ├── check.ts            # runDoctor(ctx): CheckReport
│   ├── checks/             # 24 individual check modules
│   ├── hooks-deep/         # 7 deep hook verification modules
│   └── render.ts           # renderReport(report): void
├── installer/              # Setup and scaffolding
│   ├── init.ts             # runInit(config): Promise<void>
│   ├── scaffold-vault.ts
│   ├── copy-templates.ts
│   ├── install-mcp-servers.ts
│   ├── install-hooks.ts
│   ├── merge-claude-settings.ts
│   └── write-config.ts
├── hooks/                  # Hook support modules
│   ├── audit-log.ts        # appendAuditLog(entry): void
│   └── disable-flags.ts    # isHookDisabled(name): boolean
└── utils/
    ├── paths.ts            # path resolution helpers
    ├── async.ts            # p-limit, retry, timeout
    ├── fs.ts               # atomicWrite, ensureDir
    └── logger.ts           # structured logger
```

**Import rule:** UI components import from `theme/semantic.ts` and `theme/icons.ts` only. Never from `theme/catppuccin.ts` directly.

### Input Dispatcher

The dispatcher classifies user input into one of four action types:

```typescript
export type Action =
  | { kind: 'noop' }
  | { kind: 'navigate'; project: Project }
  | { kind: 'launch-skill'; skill: SkillDefinition }
  | { kind: 'error'; message: string }
  | { kind: 'freeform-query'; text: string };

export async function dispatch(input: string, ctx: AppContext): Promise<Action> {
  const t = input.trim();
  if (!t) return { kind: 'noop' };

  const project = ctx.matcher.match(t);
  if (project) return { kind: 'navigate', project };

  if (t.startsWith('/')) {
    const skill = ctx.skills.resolve(t.slice(1));
    if (skill) return { kind: 'launch-skill', skill };
    return { kind: 'error', message: `unknown skill: ${t}` };
  }

  return { kind: 'freeform-query', text: t };
}
```

**Dispatch routing logic:**

```mermaid
flowchart TD
  INPUT([user input string])
  TRIM[trim whitespace]
  EMPTY{empty?}
  NOOP[return noop]
  MATCH{matches project name?}
  NAV[return navigate]
  SLASH{starts with /?}
  RESOLVE[resolve skill by ID]
  EXISTS{skill found?}
  LAUNCH[return launch-skill]
  ERROR[return error: unknown skill]
  FREEFORM[return freeform-query]

  INPUT --> TRIM --> EMPTY
  EMPTY -->|yes| NOOP
  EMPTY -->|no| MATCH
  MATCH -->|yes| NAV
  MATCH -->|no| SLASH
  SLASH -->|yes| RESOLVE --> EXISTS
  EXISTS -->|yes| LAUNCH
  EXISTS -->|no| ERROR
  SLASH -->|no| FREEFORM
```


### Input Box State Machine

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> typing: keypress
  typing --> typing: keypress (debounce 30ms)
  typing --> autocompleting: input matches project prefix
  autocompleting --> typing: another keypress
  autocompleting --> idle: Esc
  typing --> history: Up arrow
  history --> history: Up/Down
  history --> typing: any other key
  history --> idle: Esc
  typing --> submitting: Enter
  history --> submitting: Enter
  autocompleting --> submitting: Tab + Enter
  submitting --> dispatched: dispatcher resolves action
  dispatched --> idle: action complete
```

State transitions are driven by Ink's `useInput` hook. The 30ms debounce is implemented with `setTimeout` cleared on each keypress. The trie is built once at scan time and reused for all autocomplete lookups.

### Vault Scanner

```mermaid
flowchart TD
  START([scanVault]) --> LIST[List Projects/* directories]
  LIST --> PLIMIT[p-limit 16 concurrent reads]
  PLIMIT --> LOOP{for each project dir}
  LOOP --> CHECK[Check README.md exists]
  CHECK -->|missing| WARN1[Warning: no README]
  CHECK -->|present| READ[Read README.md]
  READ --> PARSE[Parse frontmatter with gray-matter]
  PARSE -->|invalid YAML| WARN2[Warning: malformed frontmatter]
  PARSE -->|valid| VALIDATE[Validate against project Zod schema]
  VALIDATE -->|fail| WARN3[Warning: missing field X]
  VALIDATE -->|pass| PUSH[Push Project to result]
  WARN1 --> PUSH_W[Push with warnings array]
  WARN2 --> PUSH_W
  WARN3 --> PUSH_W
  PUSH --> NEXT[next project]
  PUSH_W --> NEXT
  NEXT --> LOOP
  LOOP -->|done| TRIE[Build Trie of project names]
  TRIE --> RETURN([return ScanResult])
```

**Performance characteristics:**
- Reads only `README.md` per project; ignores all subfolders.
- Parallel reads with `p-limit(16)`.
- Frontmatter parse via `gray-matter` (~50µs/file).
- 50 projects: ~50ms warm cache, well within 100ms budget.

**ScanResult interface:**
```typescript
export interface ScanResult {
  projects: Project[];
  matcher: ProjectMatcher;  // trie-based
}
```

### Skill Launcher

The launcher pauses Ink rendering, spawns Claude Code via `execvp`, and resumes rendering when the child exits.

```mermaid
sequenceDiagram
  participant U as User
  participant D as DevYard TUI
  participant C as Claude Code
  participant H as Hook (pre-bash)
  participant V as Vault

  U->>D: types /feature + Enter
  D->>D: resolve skill → role=mariam
  D->>D: pauseInk()
  D->>C: spawn with env DEVYARD_ROLE=mariam, DEVYARD_SKILL=feature
  C->>C: load roles/product/mariam.md
  C->>C: load skills/feature/SKILL.md
  C->>C: load rules/*.md
  C->>U: "What feature?" (Claude UI)
  U->>C: feature description
  C->>H: pre-bash hook fires on gh issue create
  H-->>C: exit 0 (allow)
  C->>V: write BRD to Projects/<P>/BRDs/feature-47.md
  C->>D: process exit
  D->>D: resumeInk()
  D->>U: resume TUI
```

**Environment variables set on spawn:**

| Variable | Value |
|----------|-------|
| `DEVYARD_VAULT` | configured vault path |
| `DEVYARD_ROLE` | skill's declared role name |
| `DEVYARD_SKILL` | skill ID |
| `DEVYARD_PROJECT` | active project name (or empty) |
| `DEVYARD_OPS_ROOT` | `~/.devyard/` |

### MCP Client

```mermaid
sequenceDiagram
  participant D as DevYard TUI
  participant M as ObsidianMcpClient
  participant S as MCP Server (stdio)
  participant V as Vault FS

  D->>M: connect(config.mcp.obsidian)
  M->>S: spawn stdio subprocess
  M->>S: initialize handshake
  S-->>M: capabilities
  D->>M: listRecentIdeas(limit=5)
  M->>S: obsidian_get_recent_changes(dir="Ideas", limit=5)
  S->>V: read Ideas/*.md
  V-->>S: file list + metadata
  S-->>M: ideas summary
  M-->>D: IdeaSummary[]
  D->>M: disconnect()
  M->>S: close()
```

The client wraps `@modelcontextprotocol/sdk`. If the server fails to respond within 2 seconds during startup, the client marks the connection as failed and the Ideas panel degrades to a yellow warning state.

### Doctor

The doctor runs 24 checks organized into 6 categories. Independent checks run in parallel, capped at 2 seconds each.

```mermaid
flowchart TD
  START([devyard doctor])
  PARALLEL[Run independent checks in parallel\np-limit, 2s timeout each]
  COLLECT[Collect CheckResult array]
  RENDER[Render colored checklist]
  REQUIRED{Any required check failed?}
  EXIT1[exit 1]
  EXIT0[exit 0]

  START --> PARALLEL --> COLLECT --> RENDER --> REQUIRED
  REQUIRED -->|yes| EXIT1
  REQUIRED -->|no| EXIT0
```

**Check categories and counts:**

| Category | Count | Checks |
|----------|-------|--------|
| env | 7 | Node version, Claude binary, config valid, onboarding config, portfolio config, upstream drift, disk writable |
| vault | 4 | vault path, top-level structure, schemas present, templates present |
| integration | 4 | Obsidian MCP installed, MCP reachable, Ollama reachable, GitLab token (optional) |
| hooks | 3 | hooks exist + executable, Claude settings wired, audit log writable |
| engine | 5 | skills present, roles present, agents present, rules present, pipelines present |
| deps | 1 | GitHub CLI authenticated |

**`--hooks-deep` additions (7 synthetic checks):**

| # | Synthetic input | Expected |
|---|-----------------|----------|
| D1 | `git push --force origin main` | exit ≠ 0 |
| D2 | content with `AKIAIOSFODNN7EXAMPLE` | exit ≠ 0 |
| D3 | `git add -A` | exit ≠ 0 |
| D4 | `git push origin main` | exit ≠ 0 |
| D5 | BRD with empty `## Problem` | exit ≠ 0 |
| D6 | Design without `linked_brd:` | exit ≠ 0 |
| D7 | Edit without active ticket marker | exit ≠ 0 |


### Agent Architecture

Five restricted sub-Claude processes invoked by Claude Code via its Agent tool. None can write or edit code files.

```mermaid
graph LR
  subgraph Claude["Claude Code session"]
    SK[Skill: /code-review]
    SK -->|invokes Agent| REX[Rex\nRead/Grep/Glob/Bash\nNO Write/Edit]
  end

  REX -->|reads diff| PR[GitHub PR]
  REX -->|writes review| PR
  REX -->|writes marker| MARKER[.claude/session/reviews/N-rex.approved\ncontains 40-char SHA]

  HOOK[block-unreviewed-merge.sh]
  HOOK -->|reads| MARKER
  HOOK -->|validates SHA matches HEAD| PR
  HOOK -->|blocks merge if mismatch| MERGE[gh pr merge]
```

| Agent | Tools | Output | Can write code? |
|-------|-------|--------|-----------------|
| Rex (code review) | Read, Grep, Glob, Bash (read-only) | GitHub PR review + marker file with SHA | No |
| Hatim (security review) | Read, Grep, Glob, Bash (read-only) | GitHub PR review with CRITICAL/HIGH/MEDIUM/LOW | No |
| Tariq (PR manager) | Bash, Read, Grep, Glob | End-to-end PR coordination | No |
| Idris (ticket manager) | Bash, Read | GitHub issues with labels and structure | No |
| Munir (dep auditor) | Bash, Read, Grep, Glob | npm audit report + auto-created issues for Critical/High | No |

**Rex marker file format:**
```
SHA: 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b
```
Bare 40-char SHA on one line. Validated by `block-unreviewed-merge.sh` against `gh pr view --json headRefSha`.

### Hook Enforcement Architecture

```mermaid
flowchart TD
  TOOL[Claude wants to call tool] --> EVENT{Event type?}
  EVENT -->|PreToolUse| PRE[Run matching pre-hooks]
  EVENT -->|PostToolUse| POST[Run matching post-hooks]
  EVENT -->|SessionStart| SESSION[Run session hooks]
  PRE --> CHECK{All exit 0?}
  CHECK -->|yes| ALLOW[Tool runs]
  CHECK -->|exit 2| BLOCK[Tool blocked\nstderr shown to Claude]
  ALLOW --> EFFECT[Effect happens]
  EFFECT --> POST
  POST --> LOG[All hooks append to audit log]
  SESSION --> LOG
```

**Hook categories:**

| Category | Count | Hooks |
|----------|-------|-------|
| Session Start | 6 | onboarding-check, check-upstream-drift, check-portfolio-config, clear-bootstrap-marker, clear-issue-skill-marker, link-custom-skills |
| Ticket & Workflow | 5 | require-active-ticket, require-skill-for-issue-create, suggest-ticket-template, require-migration-ticket, validate-issue-structure |
| Git | 8 | block-git-add-all, block-main-push, validate-branch-name, validate-commit-format, verify-commit-refs, check-secrets, pre-push-gate, require-agdr-for-arch-changes |
| PR | 8 | auto-code-review, validate-pr-create, require-agdr-for-arch-pr, require-design-review-for-ui, block-merge-on-red-ci, block-unreviewed-merge, warn-stale-review-markers, block-private-refs-in-public-repos |
| Role & Advisory | 1 | detect-role-trigger |
| Lib (shared) | 10 | _lib-audit-log, _lib-detect-bash-write, _lib-detect-deprecated-config, _lib-extract-pr, _lib-extract-push-ref, _lib-multi-repo-trace, _lib-ops-root, _lib-portfolio-paths, _lib-read-config, _lib-audit-history |

**Audit log format** (`~/.devyard/logs/hook-audit.log`):
```
2026-05-24T10:30:00Z | check-secrets | blocked | git commit -m "feat: add auth"
2026-05-24T10:31:00Z | require-active-ticket | allowed | Write src/auth.ts
```
Log rotates at 10MB via `_lib-audit-log.sh`.

**Disable flags** (`~/.devyard/disabled-hooks.yaml`):
```yaml
disabled:
  - suggest-ticket-template   # advisory only, user disabled
```
Only advisory (non-blocking) hooks can be disabled. Blocking hooks cannot be disabled via config.


---

## Data Models

### Vault Schema — 14 Entity Types

All entities live in the Obsidian vault as markdown files with YAML frontmatter. JSON Schema files in `_System/schemas/` and Zod schemas in `src/data/types.ts` enforce structure.

#### Project (`type: project`)

Location: `Projects/<Name>/README.md`

```typescript
interface ProjectFrontmatter {
  name: string;
  type: 'project';
  status: 'created' | 'active' | 'parked' | 'archived';
  tier: 'P0' | 'P1' | 'P2';
  repos: string[];          // git URLs
  last_branch: string | null;
  last_ticket: string | null;
  last_session: string | null;
  stack: string[];
  created: string;          // ISO 8601 date
  team: string | null;
}
```

#### BRD (`type: brd`)

Location: `Projects/<Name>/BRDs/<feature>.md`

```typescript
interface BrdFrontmatter {
  title: string;
  type: 'brd';
  version: string;          // /^\d+\.\d+$/
  status: 'draft' | 'approved' | 'done';
  linked_tasks: string[];
  linked_mr: string | null;
  linked_idea: string | null;
  created: string;
  approved_at: string | null;
  author: string;
}
```

#### Design (`type: design`)

Location: `Projects/<Name>/Designs/<feature>.md`

```typescript
interface DesignFrontmatter {
  title: string;
  type: 'design';
  version: string;
  status: 'draft' | 'approved' | 'done';
  linked_brd: string;       // required — enforced by design-validator.sh
  created: string;
  approved_at: string | null;
}
```

#### AgDR (`type: agdr`)

Location: `docs/agdr/AgDR-NNNN-slug.md` in repo, mirrored to `Projects/<Name>/Decisions/`

```typescript
interface AgdrFrontmatter {
  id: string;               // "AgDR-0042"
  title: string;
  type: 'agdr';
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  date: string;
  supersedes: string | null;
  superseded_by: string | null;
  context_tags: string[];   // arch, security, data, infra, etc.
  y_statement: string;      // single-line Y-statement summary
}
```

#### Tasks (`type: tasks`)

Location: `Projects/<Name>/Tasks/<feature>.md`

```typescript
interface TasksFrontmatter {
  type: 'tasks';
  linked_brd: string;
  linked_design: string | null;
  generated: string;        // ISO 8601 date
  count: number;
}
```

#### Session (`type: session`)

Location: `Projects/<Name>/Sessions/<date>-<topic>.md`

```typescript
interface SessionFrontmatter {
  type: 'session';
  project: string;
  date: string;
  ticket: string | null;
  branch: string | null;
  outcome: 'success' | 'blocked' | 'wip';
  role: string;
}
```

#### Idea (`type: idea`)

Location: `Ideas/<title>.md`

```typescript
interface IdeaFrontmatter {
  id: string;               // "IDEA-042"
  title: string;
  type: 'idea';
  tags: string[];
  created: string;
  verdict: 'GREEN' | 'YELLOW' | 'RED' | null;
  promoted_to: string | null;
  archived: boolean;
}
```

#### Handover (`type: handover`)

Location: `Handovers/<project>-<date>.md`

```typescript
interface HandoverFrontmatter {
  type: 'handover';
  project: string;
  date: string;
  summary_of: string;
  next_owner: string | null;
  state_snapshot: {
    last_branch: string | null;
    last_ticket: string | null;
    open_decisions: string[];
    open_tasks: string[];
  };
}
```

#### Roadmap (`type: roadmap`)

Location: `Projects/<Name>/roadmap.md`

```typescript
interface RoadmapFrontmatter {
  type: 'roadmap';
  project: string;
  updated: string;
  audience: 'team' | 'leadership' | 'public';
}
```

#### Stakeholder Update (`type: stakeholder-update`)

Location: `Stakeholder-Updates/<date>-<project>.md`

```typescript
interface StakeholderUpdateFrontmatter {
  type: 'stakeholder-update';
  audience: 'team' | 'leadership' | 'public' | 'launch';
  cadence: 'weekly' | 'monthly' | 'launch' | 'ad-hoc';
  project: string | null;   // null = portfolio rollup
  date: string;
  period_start: string;
  period_end: string;
}
```

#### Investigation (`type: investigation`)

Location: `Projects/<Name>/investigations/<slug>.md`

```typescript
interface InvestigationFrontmatter {
  id: string;               // "INV-007"
  title: string;
  type: 'investigation';
  status: 'open' | 'follow-ups-filed' | 'closed';
  opened: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  hypothesis_count: number;
  evidence_count: number;
}
```

#### Spike Memo (`type: spike-memo`)

Location: `Projects/<Name>/spike-memos/<slug>.md`

```typescript
interface SpikeMemoFrontmatter {
  id: string;
  title: string;
  type: 'spike-memo';
  disposition: 'PROMOTE' | 'DISCARD';
  hypothesis: string;
  budget_hours: number;
  actual_hours: number;
  kill_criteria_met: boolean;
  closed: string;
}
```

#### Feature Inventory (`type: feature-inventory`)

Location: `Projects/<Name>/feature-inventory.md`

```typescript
interface FeatureInventoryFrontmatter {
  type: 'feature-inventory';
  project: string;
  generated: string;
  axes: ('http-routes' | 'data-models' | 'async-jobs' | 'test-names' | 'ui-screens' | 'documented-features')[];
}
```

#### Audit Result (`type: audit`)

Location: `Audit-History/<audit-name>-<date>.md`

```typescript
interface AuditResultFrontmatter {
  type: 'audit';
  audit_name: string;       // "launch-check" | "accessibility" | "compliance" | ...
  project: string;
  date: string;
  verdict: 'GO' | 'GO_WITH_WARNINGS' | 'CONDITIONAL_GO' | 'NO_GO' | string;
  blocker_count: number;
  warning_count: number;
}
```

### Vault Directory Structure

```
DevYard-Vault/
├── _System/
│   ├── config.md
│   ├── override-log.md         # reviewer-override audit
│   ├── ideas-backlog.md        # IDEA-NNN registry
│   ├── schemas/                # 15 JSON schema files
│   └── templates/              # 15 template .md files
├── _Inbox/                     # quick-capture
├── Projects/
│   └── <ProjectName>/
│       ├── README.md           # project home + frontmatter state
│       ├── BRDs/
│       ├── Designs/
│       ├── Tasks/
│       ├── Sessions/
│       ├── Decisions/          # AgDRs mirrored from repo
│       ├── investigations/
│       ├── spike-memos/
│       ├── feature-inventory.md
│       ├── roadmap.md
│       └── handover-assessment.md
├── Ideas/
├── Decisions/                  # cross-project AgDRs
├── Handovers/
├── Roadmaps/
├── Stakeholder-Updates/
└── Audit-History/
```

### Frontmatter Module — Atomic Write

```typescript
async function atomicWrite(path: string, content: string): Promise<void> {
  const tmp = `${path}.tmp.${process.pid}`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, path);  // atomic on POSIX
}

export async function updateProjectFrontmatter(
  path: string,
  update: Partial<ProjectFrontmatter>,
): Promise<void> {
  const raw = await fs.readFile(path, 'utf8');
  const parsed = matter(raw);
  const merged = { ...parsed.data, ...update };
  projectFrontmatterSchema.parse(merged);  // validate before write
  const next = matter.stringify(parsed.content, merged);
  await atomicWrite(path, next);
}
```


### Configuration Schema

`~/.devyard/config.yaml` — full schema:

```typescript
interface Config {
  vault: {
    path: string;                    // default: ~/Documents/DevYard-Vault
    obsidian_app: string | null;     // default: /Applications/Obsidian.app
  };
  ollama: {
    url: string;                     // default: http://localhost:11434
    timeout_ms: number;              // default: 1000
  };
  claude: {
    binary: string;                  // default: claude
    default_role: string;            // default: hisham
  };
  mcp: {
    obsidian: {
      command: string;               // default: npx
      args: string[];                // default: ["-y", "obsidian-mcp-server"]
      env: Record<string, string>;   // OBSIDIAN_VAULT_PATH injected
    };
  };
  ui: {
    panel_widths: [number, number];  // default: [30, 70]
    show_parked_projects: boolean;   // default: false
    show_archived_projects: boolean; // default: false
    spinner_style: 'dots' | 'line' | 'arc'; // default: dots
  };
  performance: {
    cold_start_budget_ms: number;    // default: 500
    keystroke_budget_ms: number;     // default: 50
    vault_scan_budget_ms: number;    // default: 100
    hook_budget_ms: number;          // default: 200
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'; // default: info
    path: string;                    // default: ~/.devyard/logs/devyard.log
  };
  env: {
    github_token_var: string;        // default: GITHUB_TOKEN
    gitlab_token_var: string;        // default: GITLAB_TOKEN
  };
  portfolio: {
    mode: 'single' | 'split';       // default: single
    public_root: string | null;      // required in split mode
    private_root: string | null;     // required in split mode
  };
}
```

**Security constraint:** GitHub and GitLab tokens are never stored in `config.yaml`. They are read from environment variables named by `env.github_token_var` and `env.gitlab_token_var`.


### Theme System

#### Catppuccin Mocha Palette

All 26 palette tokens are defined in `theme/catppuccin.ts` (internal). UI components never import this file directly.

```typescript
// theme/catppuccin.ts — INTERNAL, do not import from UI components
export const palette = {
  base: '#1e1e2e',      mantle: '#181825',    crust: '#11111b',
  text: '#cdd6f4',      subtext1: '#bac2de',  subtext0: '#a6adc8',
  overlay2: '#9399b2',  overlay1: '#7f849c',  overlay0: '#6c7086',
  surface2: '#585b70',  surface1: '#45475a',  surface0: '#313244',
  rosewater: '#f5e0dc', flamingo: '#f2cdcd',  pink: '#f5c2e7',
  mauve: '#cba6f7',     red: '#f38ba8',       maroon: '#eba0ac',
  peach: '#fab387',     yellow: '#f9e2af',    green: '#a6e3a1',
  teal: '#94e2d5',      sky: '#89dceb',       sapphire: '#74c7ec',
  blue: '#89b4fa',      lavender: '#b4befe',
} as const;
```

#### Semantic Token Mapping

```typescript
// theme/semantic.ts — PUBLIC, import this in UI components
export const semantic = {
  // Interaction
  focus: palette.mauve,       selection: palette.mauve,    prompt: palette.mauve,
  // Status
  success: palette.green,     warning: palette.yellow,     error: palette.red,
  info: palette.sapphire,     inProgress: palette.peach,   parked: palette.pink,
  // Content
  project: palette.blue,      code: palette.teal,          highlight: palette.sky,
  body: palette.text,         secondary: palette.subtext1, muted: palette.subtext0,
  placeholder: palette.overlay2, disabled: palette.overlay1,
  // Surfaces
  background: palette.base,   panelBg: palette.mantle,     outerBg: palette.crust,
  border: palette.surface0,   divider: palette.overlay0,
  hoverBg: palette.surface2,  selectedBg: palette.surface1,
} as const;
```

#### Icon Constants

```typescript
// theme/icons.ts — PUBLIC
export const icons = {
  projectActive: '●',   projectParked: '◌',   projectArchived: '▢',
  statusApproved: '✓',  statusDraft: '◐',     statusBlocked: '✗',
  promptArrow: '❯',     selectionArrow: '▶',
  doctorPass: '✓',      doctorFail: '✗',      doctorWarn: '!',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const,
  bullet: '•',          arrow: '→',           separator: '·',
} as const;
```

#### Layout Primitives

- Panel borders: single-line `surface0`, 1-char padding inside.
- Selected row: `surface1` bg, `text` fg, `▶` prefix in `mauve`.
- Input box: full-width, `surface0` border, `❯` prompt in `mauve`, placeholder in `overlay2`.
- Status badges: 1-char icon + label, padded by single space, color from semantic mapping.
- No Nerd Font dependency — Unicode only.


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The following properties are derived from the prework analysis of the acceptance criteria. Properties are organized by module. Each is suitable for property-based testing with Vitest + `fast-check`.

### Property 1: Frontmatter Round-Trip

*For any* valid `ProjectFrontmatter` object, serializing it to a YAML frontmatter string using `gray-matter` and then parsing it back should produce an object that is deeply equal to the original.

**Validates: Requirements 2.3, 2.9**

### Property 2: All Frontmatter Types Round-Trip

*For any* valid frontmatter object of any of the 14 entity types (project, brd, design, agdr, tasks, session, idea, handover, roadmap, stakeholder-update, investigation, spike-memo, feature-inventory, audit), serializing then parsing should produce an equivalent object.

**Validates: Requirements 2.9, 8.10**

### Property 3: Input Dispatcher — Project Navigation

*For any* project name that exists in the project registry, dispatching that exact name as input should return a `navigate` action pointing to that project.

**Validates: Requirements 1.4, 1.5**

### Property 4: Input Dispatcher — Skill Launch

*For any* skill ID from the 49 registered skills, dispatching `/<skill-id>` as input should return a `launch-skill` action with the matching skill definition.

**Validates: Requirements 1.5, 3.1**

### Property 5: Input Dispatcher — Freeform Fallback

*For any* non-empty string that does not match a project name and does not start with `/`, the dispatcher should return a `freeform-query` action containing the original trimmed text.

**Validates: Requirements 1.6**

### Property 6: Input Dispatcher — Unknown Skill Error

*For any* string starting with `/` that does not match a registered skill ID, the dispatcher should return an `error` action (not a crash, not a freeform query).

**Validates: Requirements 3.11**

### Property 7: Trie Completeness

*For any* set of project names used to build the trie, every name in the set should be exactly matchable by the trie's `match()` function.

**Validates: Requirements 2.7, 1.7**

### Property 8: Skill Environment Variables

*For any* combination of a valid skill definition and an optional active project, the environment object built by `buildEnv()` should contain all five required keys (`DEVYARD_VAULT`, `DEVYARD_ROLE`, `DEVYARD_SKILL`, `DEVYARD_PROJECT`, `DEVYARD_OPS_ROOT`) with non-empty string values.

**Validates: Requirements 3.2**

### Property 9: Frontmatter Validation Rejects Invalid Data

*For any* frontmatter object that is missing a required field or has a field with an invalid type, the Frontmatter_Module's write operation should throw a typed error rather than writing the invalid data.

**Validates: Requirements 8.10, 8.11**

### Property 10: Semantic Token Coverage

*For any* semantic token name exported from `theme/semantic.ts`, the resolved hex value should be a valid 7-character hex color string matching a Catppuccin Mocha palette value.

**Validates: Requirements 11.2, 11.4**

### Property 11: Audit Log Record Completeness

*For any* hook execution event (hook name, result, input), the record appended to `hook-audit.log` should contain all four required fields: timestamp (ISO 8601), hook name, result (blocked/allowed), and triggering input.

**Validates: Requirements 7.19, 22.1**

### Property 12: Secret Pattern Detection

*For any* string containing a known secret pattern (AWS access key `AKIA[0-9A-Z]{16}`, GitHub token `ghp_[A-Za-z0-9]{36}`, Slack token `xox[baprs]-`, PEM header `-----BEGIN .* PRIVATE KEY-----`), the `check-secrets.sh` hook should exit with a non-zero code. For strings not containing any of these patterns, the hook should exit zero.

**Validates: Requirements 7.11, 16.1**

### Property 13: SHA Marker Validation

*For any* pair of SHA values where the marker SHA does not equal the PR HEAD SHA, the `block-unreviewed-merge.sh` hook should block the merge. When both SHAs are equal and both marker files exist, the hook should allow the merge.

**Validates: Requirements 7.15, 16.7**

---

## Error Handling

### Graceful Degradation Strategy

DevYard is designed so that no single external service failure blocks the entire application. Each integration has an isolated failure mode.

| Failure | Behavior | Recovery |
|---------|----------|----------|
| Vault path missing | Doctor red; landing renders with empty Projects panel | `devyard init` |
| Obsidian MCP unreachable | Ideas panel shows `! MCP unreachable` in yellow; all other panels render normally | Restart MCP; check env |
| Ollama unreachable | Status panel shows Ollama offline in yellow; no blocking | `ollama serve` |
| Malformed project frontmatter | Project shown with `⚠` in yellow; clicking shows parse error | Fix frontmatter, re-scan |
| Hook script missing/non-exec | Doctor red on `hooks-exist`; affected op prompts user | `devyard init` to reinstall |
| Claude binary missing | Skill invocation fails with red error; no process spawn attempted | Install Claude Code |
| History file corrupted | Quietly recreated as empty array; no error displayed | None — non-essential |
| GitHub rate limited | Inbox/projects/tasks panels degrade with warning; cached data shown | Wait + retry |
| Hook silently broken | Discovered via `doctor --hooks-deep` or audit-log review | Reinstall hook |
| Panel render error | Error state rendered in that panel; other panels continue | None — isolated |
| Config YAML invalid | Specific failing field displayed; exit with non-zero code | Fix config field |

### Error Types

```typescript
// Typed errors for the data layer
export class FrontmatterValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly reason: string,
    public readonly path: string,
  ) {
    super(`Frontmatter validation failed at '${field}': ${reason} in ${path}`);
  }
}

export class McpConnectionError extends Error {
  constructor(message: string = 'MCP not connected') {
    super(message);
  }
}

export class SkillNotFoundError extends Error {
  constructor(public readonly skillId: string) {
    super(`Unknown skill: /${skillId}`);
  }
}

export class ConfigValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly suggestion: string,
  ) {
    super(`Config invalid at '${field}'. ${suggestion}`);
  }
}
```

### Hook Error Handling

Hooks exit with three possible codes:
- `exit 0` — allow the tool call to proceed.
- `exit 2` — block the tool call; stderr message shown to Claude and user.
- Any other non-zero — error condition; surfaced to user, not silently swallowed.

All hook executions (block or allow) are appended to the audit log regardless of outcome.


---

## Testing Strategy

### Approach

DevYard's test strategy focuses on the data layer, which contains the most complex logic and the highest risk of silent bugs. The TUI layer is not unit-tested in v1.0 (Doctor serves as the integration test for the full system). The hook layer is tested via `devyard doctor --hooks-deep`.

**Dual testing approach:**
- **Unit tests (Vitest):** specific examples, edge cases, error conditions in the data layer.
- **Property-based tests (Vitest + fast-check):** universal properties across all inputs for frontmatter, dispatcher, and trie modules.
- **Integration tests:** Doctor's `--hooks-deep` mode fires synthetic bad inputs against all 7 high-stakes hooks.
- **Smoke tests:** `devyard doctor` on a fresh install verifies the full system.

### Test File Structure

```
tests/
├── data/
│   ├── frontmatter.test.ts     # round-trip PBT + edge cases
│   ├── vault-scanner.test.ts   # scan behavior + error handling
│   └── matcher.test.ts         # trie completeness PBT
├── input/
│   └── dispatcher.test.ts      # dispatch routing PBT
├── skills/
│   └── resolver.test.ts        # skill resolution + env building
└── doctor/
    └── check.test.ts           # check result types + rendering
```

### Property-Based Testing with fast-check

DevYard uses `fast-check` for property-based tests. Each property test runs a minimum of 100 iterations.

**Library choice:** `fast-check` (TypeScript-native, excellent arbitrary combinators, shrinking support).

**Tag format for each property test:**
```typescript
// Feature: devyard, Property 1: Frontmatter Round-Trip
it.prop([fc.record({ name: fc.string(), ... })])('round-trip', (fm) => { ... });
```

#### Frontmatter Round-Trip Tests (`frontmatter.test.ts`)

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import matter from 'gray-matter';
import { projectFrontmatterSchema } from '../../src/data/schemas.js';

// Feature: devyard, Property 1: Frontmatter Round-Trip
describe('ProjectFrontmatter round-trip', () => {
  const arbProject = fc.record({
    name: fc.string({ minLength: 1 }),
    type: fc.constant('project' as const),
    status: fc.constantFrom('created', 'active', 'parked', 'archived'),
    tier: fc.constantFrom('P0', 'P1', 'P2'),
    repos: fc.array(fc.webUrl()),
    last_branch: fc.option(fc.string(), { nil: null }),
    last_ticket: fc.option(fc.string(), { nil: null }),
    last_session: fc.option(fc.string(), { nil: null }),
    stack: fc.array(fc.string()),
    created: fc.date().map(d => d.toISOString().split('T')[0]!),
    team: fc.option(fc.string(), { nil: null }),
  });

  it('serializing then parsing produces equivalent object', () => {
    fc.assert(fc.property(arbProject, (original) => {
      const serialized = matter.stringify('', original);
      const { data: parsed } = matter(serialized);
      const validated = projectFrontmatterSchema.parse(parsed);
      expect(validated).toEqual(original);
    }), { numRuns: 100 });
  });
});
```

#### Dispatcher Routing Tests (`dispatcher.test.ts`)

```typescript
// Feature: devyard, Property 3: Input Dispatcher — Project Navigation
it('dispatches project names to navigate action', () => {
  fc.assert(fc.property(
    fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
    fc.nat(),
    (names, idx) => {
      const projects = names.map(name => makeProject(name));
      const ctx = makeContext(projects);
      const target = projects[idx % projects.length]!;
      const action = dispatch(target.frontmatter.name, ctx);
      expect(action.kind).toBe('navigate');
    }
  ), { numRuns: 100 });
});

// Feature: devyard, Property 4: Input Dispatcher — Skill Launch
it('dispatches /skill-id to launch-skill action', () => {
  fc.assert(fc.property(
    fc.constantFrom(...SKILL_IDS),
    (skillId) => {
      const action = dispatch(`/${skillId}`, makeContext([]));
      expect(action.kind).toBe('launch-skill');
    }
  ), { numRuns: 100 });
});

// Feature: devyard, Property 5: Input Dispatcher — Freeform Fallback
it('dispatches non-project non-skill strings as freeform', () => {
  fc.assert(fc.property(
    fc.string({ minLength: 1 }).filter(s => !s.startsWith('/') && !isProjectName(s)),
    (text) => {
      const action = dispatch(text, makeContext([]));
      expect(action.kind).toBe('freeform-query');
      if (action.kind === 'freeform-query') {
        expect(action.text).toBe(text.trim());
      }
    }
  ), { numRuns: 100 });
});
```

### Unit Test Coverage Targets

| Module | Target | Focus |
|--------|--------|-------|
| `data/frontmatter.ts` | 90% | Round-trip, atomic write, validation errors |
| `data/vault-scanner.ts` | 85% | Missing README, invalid YAML, schema failures |
| `input/dispatcher.ts` | 90% | All four action types, edge cases |
| `input/matcher.ts` | 85% | Trie completeness, fuzzy matching |
| `skills/resolver.ts` | 85% | All 49 skills resolvable, unknown skill error |
| `skills/env.ts` | 90% | All env vars present, with/without project |
| `config/load.ts` | 85% | Valid config, missing fields, invalid YAML |
| `doctor/check.ts` | 80% | Check result types, parallel execution |

### Integration Tests (Doctor)

`devyard doctor --hooks-deep` serves as the integration test suite for the hook layer. It fires 7 synthetic bad inputs and verifies each hook exits non-zero. This runs in CI as part of the Phase D hardening gate.

### Performance Tests

Performance budgets are verified via instrumented `performance.now()` calls in development mode:

| Operation | Budget | Measurement |
|-----------|--------|-------------|
| Cold start to first paint | 500ms | `time devyard` averaged over 10 runs |
| Vault scan (50 projects) | 100ms | Instrumented in `vault-scanner.ts` |
| Keystroke latency | 50ms p95 | `performance.now()` in `InputBox.tsx` |
| Project navigation | 200ms | Instrumented in `ProjectScreen.tsx` |
| Skill launch (execvp) | 500ms | Instrumented in `launcher.ts` |


---

## Performance Design

### Parallel I/O Strategy

Cold start achieves < 500ms by running all I/O operations in parallel after config load:

```typescript
// app.tsx — parallel startup
const [scanResult, mcpStatus, ollamaStatus, history] = await Promise.allSettled([
  scanVault(config),           // ~50ms for 50 projects
  mcpClient.connect(config),   // ~200ms
  checkOllama(config),         // ~100ms
  loadHistory(),               // ~5ms
]);
// Render skeleton at ~80ms, fill panels as each settles
```

### Vault Scanner Concurrency

`p-limit(16)` caps concurrent file reads to avoid overwhelming the filesystem while maximizing throughput:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(16);
const results = await Promise.all(
  projectDirs.map(dir => limit(() => readProjectReadme(dir)))
);
```

### Trie-Based Autocomplete

A trie is built once at scan time from all project names. Autocomplete lookups are O(k) where k is the length of the input prefix, well within the 50ms keystroke budget.

```typescript
export class ProjectMatcher {
  private trie: TrieNode;

  constructor(projects: Project[]) {
    this.trie = buildTrie(projects.map(p => p.frontmatter.name));
  }

  match(input: string): Project | null {
    return this.trie.exactMatch(input.toLowerCase()) ?? null;
  }

  suggest(prefix: string): string[] {
    return this.trie.prefixSearch(prefix.toLowerCase()).slice(0, 5);
  }
}
```

### Skeleton Rendering

The landing screen renders a skeleton layout at ~80ms (before any async data arrives) and fills panels progressively:

```mermaid
timeline
  title Cold Start Timeline
  0ms   : Process start
  10ms  : Config loaded
  80ms  : Skeleton rendered (empty panels with borders)
  100ms : Vault scan complete (50 projects)
  200ms : History loaded, Projects panel filled
  300ms : Ollama status resolved, Status panel filled
  400ms : MCP connected, Ideas panel filled
  500ms : First paint budget deadline
```

### Performance Budgets

| Operation | Budget | Strategy |
|-----------|--------|----------|
| Cold start to first paint | 500ms | Parallel I/O; skeleton at 80ms |
| Vault scan (50 projects) | 100ms | Read only README.md; p-limit(16) |
| Keystroke → autocomplete | 50ms p95 | Trie lookup O(k) |
| Project navigation | 200ms | Read full frontmatter + last 5 session filenames |
| Skill launch (execvp) | 500ms | Pre-resolved paths; no shell wrap |
| Hook execution | 200ms p95 | Pure bash; avoid spawning python/jq |
| Doctor full run | 5s | Parallel checks; 2s cap per check |
| Doctor --hooks-deep | 15s | Sequential synthetic-input firing |

**Kill criterion (Requirement 15.10):** If Ink TUI keystroke latency exceeds 80ms p95 after 2 weeks of use, fall back to an fzf-based plain stdout interface.

---

## Security Design

### Threat Model

| Threat | Controls |
|--------|----------|
| Accidental destruction (force-push, branch delete) | `block-main-push.sh`, `block-git-add-all.sh`, `block-unreviewed-merge.sh` |
| Secret leakage (API keys committed) | `check-secrets.sh` (pre-commit), `block-private-refs-in-public-repos.sh` |
| Prompt injection from MCP responses | Agents read-only; hooks deterministic (no LLM); review markers SHA-locked |
| Process drift (skipped reviews, missing AgDRs) | `require-active-ticket.sh`, `require-agdr-for-arch-changes.sh`, `auto-code-review.sh`, `block-merge-on-red-ci.sh` |

### Secret Scanning Patterns

`check-secrets.sh` scans staged diffs for:

```bash
# AWS Access Key
AKIA[0-9A-Z]{16}

# GitHub Personal Access Token
ghp_[A-Za-z0-9]{36}

# GitHub OAuth Token
gho_[A-Za-z0-9]{36}

# Slack Token
xox[baprs]-[0-9A-Za-z-]+

# PEM Private Key
-----BEGIN .* PRIVATE KEY-----

# Generic high-entropy strings (optional, configurable)
[A-Za-z0-9+/]{40,}={0,2}
```

### SHA-Locked Approval Markers

Review markers contain the exact 40-character commit SHA that was reviewed. `block-unreviewed-merge.sh` validates both markers before allowing merge:

```mermaid
flowchart TD
  MERGE([gh pr merge]) --> READ_SHA[gh pr view --json headRefSha]
  READ_SHA --> READ_REX[read .claude/session/reviews/N-rex.approved]
  READ_REX --> READ_CEO[read .claude/session/reviews/N-ceo.approved]
  READ_CEO --> MATCH{Both SHAs match HEAD?}
  MATCH -->|yes| ALLOW[exit 0 — allow merge]
  MATCH -->|no or missing| BLOCK[exit 2 — Rex must re-review SHA X]
```

### Agent Read-Only Enforcement

All 5 agents are defined with `tools_denied: [Write, Edit, MultiEdit]` in their agent spec files. Claude Code's agent invocation mechanism enforces this at the tool-call level. An agent that attempts to call Write will have the call blocked before execution.

### Token Security

GitHub and GitLab tokens are never written to `~/.devyard/config.yaml`. The config stores only the environment variable *names* (`github_token_var`, `gitlab_token_var`). Tokens are read at runtime from the shell environment.

### Audit Trail

Every hook execution (block or allow) is appended to `~/.devyard/logs/hook-audit.log`. The log is rotated at 10MB. Override events (reviewer role overruled) are logged to `_System/override-log.md` in the vault. This provides a complete audit trail for weekly review.


---

## Build Phases

DevYard is built in four phases over 12 weeks. Each phase produces a runnable, verifiable system.

### Phase A: Foundation (Weeks 1–2)

**Deliverable:** `devyard doctor` green on a fresh install.

**Components built:**
- Doctor module (24 checks)
- Theme module (catppuccin, semantic, icons)
- MCP client (ObsidianMcpClient)
- Vault scanner (scanVault, ProjectMatcher)
- Frontmatter module (read, write, validate, atomic write)
- Installer skeleton (devyard init)
- All 15 JSON schemas in `assets/schemas/`
- All 15 template markdown files in `assets/templates/`
- Config loader with Zod validation
- Logger and utility modules

**Verification:** `devyard doctor` exits 0 with all required checks green.

### Phase B: Navigator (Weeks 3–4)

**Deliverable:** `devyard` opens the landing screen, navigates projects, persists history.

**Components built:**
- Ink app scaffold (app.tsx, cli.ts)
- LandingScreen with 3 panels (Projects, Status, Ideas)
- ProjectScreen (project view)
- InputBox with state machine (idle → typing → autocompleting → submitting)
- Input dispatcher
- History persistence (history.json)
- Skill resolver (reads SKILL.md files)
- Skill launcher (execvp spawn)

**Verification:** `devyard` opens, shows projects, accepts input, navigates to project view, persists history across sessions.

### Phase C: Engine (Weeks 5–10)

**Deliverable:** Full SDLC flow runs end-to-end.

| Week | Deliverable |
|------|-------------|
| 5 | First 10 skills: `/status`, `/inbox`, `/projects`, `/tasks`, `/start-ticket`, `/feature`, `/bug`, `/task`, `/idea`, `/validate-idea` |
| 6 | 19 roles + 5 agents (Rex, Hatim, Tariq, Idris, Munir) + 11 rules |
| 7 | 28 hooks + audit log + hooks-deep doctor mode |
| 8 | 12 decision-related skills: `/decide`, `/agdr`, `/c4`, `/dfd`, `/threat-model`, `/tech-vision`, `/write-spec`, `/migration`, `/spike`, `/spike-close`, `/investigation`, `/tickets-batch` |
| 9 | 12 review + audit skills: `/code-review`, `/security-review`, `/approve-merge`, `/approve-design`, `/audit-deps`, `/launch-check`, `/accessibility-audit`, `/compliance-check`, `/analytics-audit`, `/seo-audit`, `/performance-audit`, `/monitoring-audit` |
| 10 | Remaining 15 skills + 7 CI pipeline YAML files |

**Verification:** Full SDLC flow from `/idea` through `/launch-check` runs end-to-end.

### Phase D: Hardening (Weeks 11–12)

**Deliverable:** All performance budgets met; `devyard doctor --hooks-deep` all green; `/launch-check` returns GO on DevYard itself.

**Work:**
- Performance pass: measure all budgets, optimize hot paths
- Install on 2 fresh macOS machines; verify < 15 minutes to green doctor
- Full `devyard doctor --hooks-deep` green (all 7 deep checks)
- Run `/launch-check` on the DevYard repository itself
- Documentation pass (README, CHANGELOG, ADRs)
- v1.0 tag

**Verification:** `/launch-check` returns GO on DevYard itself.

---

## Toolchain

| Concern | Choice | Version |
|---------|--------|---------|
| Language | TypeScript | 5.4+ |
| Runtime | Node.js LTS | 20.11.0 (`.nvmrc`) |
| Module system | ESM | `"type": "module"` |
| Package manager | pnpm | 9+ |
| Bundler | tsup | latest |
| Dev runner | tsx | latest |
| Linter + formatter | Biome | 1.8+ |
| Tests | Vitest | 1.6+ |
| PBT library | fast-check | latest |
| TUI | Ink + React | 5 + 18 |
| MCP | `@modelcontextprotocol/sdk` | latest |
| YAML | `yaml` (eemeli) | latest |
| Frontmatter | `gray-matter` | latest |
| Fuzzy | `fuse.js` | latest |
| Schema | `zod` + `ajv` | latest |
| Args | `commander` | latest |
| Concurrency | `p-limit` | latest |

### TypeScript Compiler Options

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "resolveJsonModule": true
  }
}
```

### Available Scripts

```json
{
  "scripts": {
    "build": "tsup src/cli.ts --format esm --dts",
    "dev": "tsx src/cli.ts",
    "lint": "biome check src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "link": "pnpm link --global"
  }
}
```

All four of `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` must pass before any PR is merged (enforced by `pre-push-gate.sh`).

