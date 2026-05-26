---
title: DevYard — Low Level Design
version: 2.0
status: draft
linked_brd: BRD-v2.0.md
linked_hld: HLD.md
supersedes: LLD.md
created: 2026-05-24
last_updated: 2026-05-24
tags: [lld, devyard, v2, implementation]
---

# DevYard — Low Level Design (v2.0 — Implementation Blueprint)

This document is the complete implementation blueprint for DevYard v1.0. Every file, type, schema, hook, skill, role, agent, rule, and pipeline is specified here with Mermaid diagrams where flow matters.

## 1. Repository Layout

```
devyard/
├── README.md
├── LICENSE                          # MIT
├── CHANGELOG.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── biome.json
├── .gitignore
├── .nvmrc                           # 20.11.0
├── install.sh                       # first-time bootstrap
├── docs/
│   ├── BRD-v2.0.md
│   ├── HLD.md
│   ├── LLD.md
│   └── decisions/
│       ├── 0001-vault-as-source-of-truth.md
│       ├── 0002-typescript-ink.md
│       ├── ...
│       └── 0020-semantic-theme-tokens.md
├── src/
│   ├── cli.ts                       # entry point, command router
│   ├── app.tsx                      # Ink app root
│   ├── config/
│   │   ├── load.ts                  # read ~/.devyard/config.yaml
│   │   ├── defaults.ts
│   │   └── types.ts
│   ├── theme/
│   │   ├── catppuccin.ts            # palette tokens
│   │   ├── semantic.ts              # semantic role mapping
│   │   ├── icons.ts                 # unicode icons
│   │   └── index.ts
│   ├── data/
│   │   ├── vault-scanner.ts
│   │   ├── frontmatter.ts
│   │   ├── project-repo.ts
│   │   ├── artifact-repo.ts
│   │   ├── history.ts
│   │   ├── ollama.ts
│   │   ├── github.ts                # gh CLI wrapper
│   │   └── types.ts
│   ├── mcp/
│   │   ├── client.ts                # typed MCP wrapper
│   │   ├── obsidian-client.ts
│   │   └── types.ts
│   ├── panels/
│   │   ├── ProjectsPanel.tsx
│   │   ├── StatusPanel.tsx
│   │   ├── IdeasPanel.tsx
│   │   ├── InputBox.tsx
│   │   └── Spinner.tsx
│   ├── screens/
│   │   ├── LandingScreen.tsx
│   │   ├── ProjectScreen.tsx
│   │   ├── ConfigScreen.tsx
│   │   └── IdeasScreen.tsx
│   ├── input/
│   │   ├── dispatcher.ts
│   │   ├── matcher.ts
│   │   ├── history.ts
│   │   └── autocomplete.ts
│   ├── skills/
│   │   ├── launcher.ts              # execvp into Claude Code
│   │   ├── resolver.ts              # /name → skill file
│   │   ├── env.ts                   # build env vars for child
│   │   └── types.ts
│   ├── doctor/
│   │   ├── check.ts
│   │   ├── checks/
│   │   │   ├── 01-node-version.ts
│   │   │   ├── 02-claude-binary.ts
│   │   │   ├── 03-config-valid.ts
│   │   │   ├── 04-vault-path.ts
│   │   │   ├── 05-vault-structure.ts
│   │   │   ├── 06-vault-schemas.ts
│   │   │   ├── 07-vault-templates.ts
│   │   │   ├── 08-obsidian-mcp-installed.ts
│   │   │   ├── 09-obsidian-mcp-reachable.ts
│   │   │   ├── 10-ollama-reachable.ts
│   │   │   ├── 11-gitlab-token.ts
│   │   │   ├── 12-github-cli.ts
│   │   │   ├── 13-hooks-exist.ts
│   │   │   ├── 14-claude-settings.ts
│   │   │   ├── 15-audit-log-writable.ts
│   │   │   ├── 16-skills-present.ts
│   │   │   ├── 17-roles-present.ts
│   │   │   ├── 18-agents-present.ts
│   │   │   ├── 19-rules-present.ts
│   │   │   ├── 20-pipelines-present.ts
│   │   │   ├── 21-onboarding-config.ts
│   │   │   ├── 22-portfolio-config.ts
│   │   │   ├── 23-upstream-drift.ts
│   │   │   └── 24-disk-writable.ts
│   │   ├── hooks-deep/
│   │   │   ├── force-push.ts
│   │   │   ├── secrets-scan.ts
│   │   │   ├── git-add-all.ts
│   │   │   ├── main-push.ts
│   │   │   ├── brd-validator.ts
│   │   │   ├── design-validator.ts
│   │   │   └── active-ticket.ts
│   │   └── render.ts
│   ├── installer/
│   │   ├── init.ts
│   │   ├── scaffold-vault.ts
│   │   ├── copy-templates.ts
│   │   ├── install-mcp-servers.ts
│   │   ├── install-hooks.ts
│   │   ├── merge-claude-settings.ts
│   │   └── write-config.ts
│   ├── hooks/
│   │   ├── audit-log.ts
│   │   └── disable-flags.ts
│   ├── utils/
│   │   ├── paths.ts
│   │   ├── async.ts
│   │   ├── fs.ts
│   │   └── logger.ts
│   └── types/
│       └── global.d.ts
├── assets/
│   ├── templates/                   # frontmatter+section templates per artifact type
│   │   ├── project-README.md
│   │   ├── brd.md
│   │   ├── design.md
│   │   ├── agdr.md
│   │   ├── tasks.md
│   │   ├── session.md
│   │   ├── idea.md
│   │   ├── handover.md
│   │   ├── roadmap.md
│   │   ├── stakeholder-update.md
│   │   ├── investigation.md
│   │   ├── spike-memo.md
│   │   ├── feature-inventory.md
│   │   ├── tech-vision.md
│   │   └── audit-result.md
│   ├── roles/                       # 19 persona files
│   │   ├── engineering/
│   │   │   ├── khalid-head-of-engineering.md
│   │   │   ├── hisham-tech-lead.md
│   │   │   ├── karim-backend-engineer.md
│   │   │   ├── yasmin-frontend-engineer.md
│   │   │   ├── salim-qa-engineer.md
│   │   │   ├── adel-platform-engineer.md
│   │   │   └── saif-sre.md
│   │   ├── product/
│   │   │   ├── omar-head-of-product.md
│   │   │   ├── mariam-product-manager.md
│   │   │   └── hanan-product-analyst.md
│   │   ├── design/
│   │   │   ├── maha-head-of-design.md
│   │   │   ├── nour-ui-designer.md
│   │   │   └── iman-ux-designer.md
│   │   ├── security/
│   │   │   ├── faisal-head-of-security.md
│   │   │   ├── hakim-security-auditor.md
│   │   │   └── hamza-penetration-tester.md
│   │   └── data/
│   │       ├── khalil-head-of-data.md
│   │       ├── nadia-data-analyst.md
│   │       └── anwar-data-engineer.md
│   ├── agents/                      # 5 agent specs
│   │   ├── rex-code-reviewer.md
│   │   ├── hatim-security-reviewer.md
│   │   ├── tariq-pr-manager.md
│   │   ├── idris-ticket-manager.md
│   │   └── munir-dependency-auditor.md
│   ├── rules/                       # 11 behavioral rules
│   │   ├── ticket-vocabulary.md
│   │   ├── workflow-gates.md
│   │   ├── agdr-decisions.md
│   │   ├── git-conventions.md
│   │   ├── parallel-work.md
│   │   ├── code-standards.md
│   │   ├── role-triggers.md
│   │   ├── pr-workflow.md
│   │   ├── plan-mode.md
│   │   ├── pr-quality.md
│   │   └── leak-protection.md
│   ├── skills/                      # 49 skill definitions
│   │   ├── status/SKILL.md
│   │   ├── inbox/SKILL.md
│   │   ├── projects/SKILL.md
│   │   ├── tasks/SKILL.md
│   │   ├── roadmap/SKILL.md
│   │   ├── stakeholder-update/SKILL.md
│   │   ├── feature/SKILL.md
│   │   ├── bug/SKILL.md
│   │   ├── task/SKILL.md
│   │   ├── spike/SKILL.md
│   │   ├── spike-close/SKILL.md
│   │   ├── investigation/SKILL.md
│   │   ├── idea/SKILL.md
│   │   ├── validate-idea/SKILL.md
│   │   ├── tickets-batch/SKILL.md
│   │   ├── migration/SKILL.md
│   │   ├── start-ticket/SKILL.md
│   │   ├── write-spec/SKILL.md
│   │   ├── decide/SKILL.md
│   │   ├── agdr/SKILL.md
│   │   ├── c4/SKILL.md
│   │   ├── dfd/SKILL.md
│   │   ├── threat-model/SKILL.md
│   │   ├── tech-vision/SKILL.md
│   │   ├── process/SKILL.md
│   │   ├── journey/SKILL.md
│   │   ├── fan-out/SKILL.md
│   │   ├── code-review/SKILL.md
│   │   ├── security-review/SKILL.md
│   │   ├── approve-merge/SKILL.md
│   │   ├── approve-design/SKILL.md
│   │   ├── audit-deps/SKILL.md
│   │   ├── launch-check/SKILL.md
│   │   ├── accessibility-audit/SKILL.md
│   │   ├── compliance-check/SKILL.md
│   │   ├── analytics-audit/SKILL.md
│   │   ├── seo-audit/SKILL.md
│   │   ├── performance-audit/SKILL.md
│   │   ├── monitoring-audit/SKILL.md
│   │   ├── docs-audit/SKILL.md
│   │   ├── release/SKILL.md
│   │   ├── setup/SKILL.md
│   │   ├── handover/SKILL.md
│   │   ├── update/SKILL.md
│   │   ├── split-portfolio/SKILL.md
│   │   ├── onboard/SKILL.md
│   │   ├── extract-features/SKILL.md
│   │   ├── debug/SKILL.md
│   │   └── cli-builder/SKILL.md
│   ├── hooks/                       # 28 bash scripts
│   │   ├── _lib-audit-log.sh
│   │   ├── _lib-detect-bash-write.sh
│   │   ├── _lib-detect-deprecated-config.sh
│   │   ├── _lib-extract-pr.sh
│   │   ├── _lib-extract-push-ref.sh
│   │   ├── _lib-multi-repo-trace.sh
│   │   ├── _lib-ops-root.sh
│   │   ├── _lib-portfolio-paths.sh
│   │   ├── _lib-read-config.sh
│   │   ├── _lib-audit-history.sh
│   │   ├── onboarding-check.sh
│   │   ├── check-upstream-drift.sh
│   │   ├── check-portfolio-config.sh
│   │   ├── clear-bootstrap-marker.sh
│   │   ├── clear-issue-skill-marker.sh
│   │   ├── link-custom-skills.sh
│   │   ├── require-active-ticket.sh
│   │   ├── require-skill-for-issue-create.sh
│   │   ├── suggest-ticket-template.sh
│   │   ├── require-migration-ticket.sh
│   │   ├── validate-issue-structure.sh
│   │   ├── block-git-add-all.sh
│   │   ├── block-main-push.sh
│   │   ├── validate-branch-name.sh
│   │   ├── validate-commit-format.sh
│   │   ├── verify-commit-refs.sh
│   │   ├── check-secrets.sh
│   │   ├── pre-push-gate.sh
│   │   ├── require-agdr-for-arch-changes.sh
│   │   ├── auto-code-review.sh
│   │   ├── validate-pr-create.sh
│   │   ├── require-agdr-for-arch-pr.sh
│   │   ├── require-design-review-for-ui.sh
│   │   ├── block-merge-on-red-ci.sh
│   │   ├── block-unreviewed-merge.sh
│   │   ├── warn-stale-review-markers.sh
│   │   ├── block-private-refs-in-public-repos.sh
│   │   └── detect-role-trigger.sh
│   ├── schemas/                     # JSON schemas for frontmatter
│   │   ├── project.schema.json
│   │   ├── brd.schema.json
│   │   ├── design.schema.json
│   │   ├── agdr.schema.json
│   │   ├── tasks.schema.json
│   │   ├── session.schema.json
│   │   ├── idea.schema.json
│   │   ├── handover.schema.json
│   │   ├── roadmap.schema.json
│   │   ├── stakeholder-update.schema.json
│   │   ├── investigation.schema.json
│   │   ├── spike-memo.schema.json
│   │   ├── feature-inventory.schema.json
│   │   ├── tech-vision.schema.json
│   │   └── audit.schema.json
│   ├── workflows/                   # 3 process map docs
│   │   ├── sdlc.md
│   │   ├── code-review.md
│   │   └── deployment.md
│   ├── golden-paths/pipelines/      # 7 GitHub Actions YAML
│   │   ├── ci.yml
│   │   ├── code-quality.yml
│   │   ├── security.yml
│   │   ├── dependency-audit.yml
│   │   ├── pr-title-check.yml
│   │   ├── review-check.yml
│   │   └── seo-check.yml
│   └── claude-settings.json         # Claude Code hook wiring template
└── tests/
    ├── data/
    │   ├── frontmatter.test.ts
    │   ├── vault-scanner.test.ts
    │   └── matcher.test.ts
    ├── input/
    │   └── dispatcher.test.ts
    ├── skills/
    │   └── resolver.test.ts
    └── doctor/
        └── check.test.ts
```

## 2. Toolchain

| Concern | Choice |
|---------|--------|
| Language | TypeScript 5.4+ |
| Runtime | Node 20.11.0 LTS (`.nvmrc`) |
| Module system | ESM (`"type": "module"`) |
| Package manager | pnpm 9+ |
| Bundler | tsup |
| Dev runner | tsx |
| Linter + formatter | Biome 1.8+ |
| Tests | Vitest 1.6+ |
| TUI | Ink 5 + React 18 |
| MCP | `@modelcontextprotocol/sdk` |
| YAML | `yaml` (eemeli/yaml) |
| Frontmatter | `gray-matter` |
| Fuzzy | `fuse.js` (decide vs fzf benchmark in week 3) |
| Schema | `zod` (TS) + `ajv` (JSON Schema runtime) |
| Args | `commander` |
| Git/GitHub | `gh` CLI (shell-out) |

## 3. TypeScript Configuration

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
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 4. User Filesystem Layout

```
~/
├── .devyard/
│   ├── config.yaml
│   ├── onboarding.yaml              # /setup output
│   ├── projects.yaml                # /handover registry
│   ├── history.json
│   ├── disabled-hooks.yaml
│   ├── roles/                       # symlink → assets/roles
│   ├── rules/                       # symlink → assets/rules
│   ├── skills/                      # symlink → assets/skills
│   ├── agents/                      # symlink → assets/agents
│   ├── hooks/                       # symlink → assets/hooks (executable)
│   ├── schemas/                     # symlink → assets/schemas
│   ├── templates/                   # symlink → assets/templates
│   ├── workflows/                   # symlink → assets/workflows
│   └── logs/
│       ├── hook-audit.log
│       ├── doctor.log
│       └── devyard.log
├── .claude/
│   ├── settings.json                # references DevYard hook scripts
│   ├── session/                     # per-session markers
│   │   ├── tickets/                 # active-ticket markers
│   │   ├── reviews/                 # PR review markers (PR-NN-rex.approved etc)
│   │   └── active-issue-skill       # prevents raw issue creation during skill
│   └── agents/                      # symlink → ~/.devyard/agents
└── Documents/
    └── DevYard-Vault/               # default vault (configurable)
        └── ... (see HLD §4.2)
```

## 5. Configuration Schema

`~/.devyard/config.yaml`:

```yaml
vault:
  path: ~/Documents/DevYard-Vault
  obsidian_app: /Applications/Obsidian.app

ollama:
  url: http://localhost:11434
  timeout_ms: 1000

claude:
  binary: claude
  default_role: hisham

mcp:
  obsidian:
    command: npx
    args: ["-y", "obsidian-mcp-server"]
    env:
      OBSIDIAN_VAULT_PATH: ~/Documents/DevYard-Vault

ui:
  panel_widths: [30, 70]
  show_parked_projects: false
  show_archived_projects: false
  spinner_style: dots

performance:
  cold_start_budget_ms: 500
  keystroke_budget_ms: 50
  vault_scan_budget_ms: 100
  hook_budget_ms: 200

logging:
  level: info
  path: ~/.devyard/logs/devyard.log

env:
  github_token_var: GITHUB_TOKEN
  gitlab_token_var: GITLAB_TOKEN

portfolio:
  mode: single                       # or "split" for public+private setup
  public_root: null                  # set in split mode
  private_root: null
```

## 6. Type Definitions

### 6.1 `data/types.ts`

```typescript
// ───────── Common ─────────
export type ArtifactStatus = 'draft' | 'approved' | 'done';
export type ProjectStatus = 'created' | 'active' | 'parked' | 'archived';
export type Tier = 'P0' | 'P1' | 'P2';
export type IdeaVerdict = 'GREEN' | 'YELLOW' | 'RED';
export type LaunchVerdict = 'GO' | 'GO_WITH_WARNINGS' | 'CONDITIONAL_GO' | 'NO_GO';
export type SpikeDisposition = 'PROMOTE' | 'DISCARD';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// ───────── Project ─────────
export interface ProjectFrontmatter {
  name: string;
  type: 'project';
  status: ProjectStatus;
  tier: Tier;
  repos: string[];          // git URLs
  last_branch: string | null;
  last_ticket: string | null;
  last_session: string | null;
  stack: string[];
  created: string;
  team: string | null;
}

// ───────── BRD ─────────
export interface BrdFrontmatter {
  title: string;
  type: 'brd';
  version: string;          // /^\d+\.\d+$/
  status: ArtifactStatus;
  linked_tasks: string[];
  linked_mr: string | null;
  linked_idea: string | null;
  created: string;
  approved_at: string | null;
  author: string;
}

// ───────── Design ─────────
export interface DesignFrontmatter {
  title: string;
  type: 'design';
  version: string;
  status: ArtifactStatus;
  linked_brd: string;
  created: string;
  approved_at: string | null;
}

// ───────── AgDR ─────────
export interface AgdrFrontmatter {
  id: string;               // "AgDR-0042"
  title: string;
  type: 'agdr';
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  date: string;
  supersedes: string | null;
  superseded_by: string | null;
  context_tags: string[];   // arch, security, data, infra, etc.
  y_statement: string;      // single line summary
}

// ───────── Tasks ─────────
export interface TasksFrontmatter {
  type: 'tasks';
  linked_brd: string;
  linked_design: string | null;
  generated: string;
  count: number;
}

// ───────── Session ─────────
export interface SessionFrontmatter {
  type: 'session';
  project: string;
  date: string;
  ticket: string | null;
  branch: string | null;
  outcome: 'success' | 'blocked' | 'wip';
  role: string;
}

// ───────── Idea ─────────
export interface IdeaFrontmatter {
  id: string;               // "IDEA-042"
  title: string;
  type: 'idea';
  tags: string[];
  created: string;
  verdict: IdeaVerdict | null;
  promoted_to: string | null;
  archived: boolean;
}

// ───────── Handover ─────────
export interface HandoverFrontmatter {
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

// ───────── Roadmap ─────────
export interface RoadmapFrontmatter {
  type: 'roadmap';
  project: string;
  updated: string;
  audience: 'team' | 'leadership' | 'public';
}

// ───────── Stakeholder Update ─────────
export interface StakeholderUpdateFrontmatter {
  type: 'stakeholder-update';
  audience: 'team' | 'leadership' | 'public' | 'launch';
  cadence: 'weekly' | 'monthly' | 'launch' | 'ad-hoc';
  project: string | null;   // null = portfolio rollup
  date: string;
  period_start: string;
  period_end: string;
}

// ───────── Investigation ─────────
export interface InvestigationFrontmatter {
  id: string;               // "INV-007"
  title: string;
  type: 'investigation';
  status: 'open' | 'follow-ups-filed' | 'closed';
  opened: string;
  severity: Severity;
  hypothesis_count: number;
  evidence_count: number;
}

// ───────── Spike Memo ─────────
export interface SpikeMemoFrontmatter {
  id: string;
  title: string;
  type: 'spike-memo';
  disposition: SpikeDisposition;
  hypothesis: string;
  budget_hours: number;
  actual_hours: number;
  kill_criteria_met: boolean;
  closed: string;
}

// ───────── Feature Inventory ─────────
export interface FeatureInventoryFrontmatter {
  type: 'feature-inventory';
  project: string;
  generated: string;
  axes: ('http-routes' | 'data-models' | 'async-jobs' | 'test-names' | 'ui-screens' | 'documented-features')[];
}

// ───────── Tech Vision ─────────
export interface TechVisionFrontmatter {
  type: 'tech-vision';
  project: string;
  version: string;
  status: ArtifactStatus;
  review_cadence: string;   // "quarterly", "annually", etc.
}

// ───────── Audit Result ─────────
export interface AuditResultFrontmatter {
  type: 'audit';
  audit_name: string;       // "launch-check" | "accessibility" | "compliance" | ...
  project: string;
  date: string;
  verdict: LaunchVerdict | string;
  blocker_count: number;
  warning_count: number;
}

// ───────── Project view aggregate ─────────
export interface Project {
  frontmatter: ProjectFrontmatter;
  path: string;
  warnings: string[];
}
```

### 6.2 `config/types.ts`

```typescript
export interface Config {
  vault: { path: string; obsidian_app: string | null };
  ollama: { url: string; timeout_ms: number };
  claude: { binary: string; default_role: string };
  mcp: { obsidian: { command: string; args: string[]; env: Record<string, string> } };
  ui: {
    panel_widths: [number, number];
    show_parked_projects: boolean;
    show_archived_projects: boolean;
    spinner_style: 'dots' | 'line' | 'arc';
  };
  performance: {
    cold_start_budget_ms: number;
    keystroke_budget_ms: number;
    vault_scan_budget_ms: number;
    hook_budget_ms: number;
  };
  logging: { level: 'debug' | 'info' | 'warn' | 'error'; path: string };
  env: { github_token_var: string; gitlab_token_var: string };
  portfolio: { mode: 'single' | 'split'; public_root: string | null; private_root: string | null };
}
```

### 6.3 `doctor/check.ts`

```typescript
export type CheckResult =
  | { status: 'pass'; message: string; duration_ms?: number }
  | { status: 'warn'; message: string; remediation: string; duration_ms?: number }
  | { status: 'fail'; message: string; remediation: string; duration_ms?: number };

export interface Check {
  id: string;
  label: string;
  category: 'env' | 'deps' | 'vault' | 'integration' | 'hooks' | 'engine';
  required: boolean;        // if true and fails, doctor exits non-zero
  run: (ctx: DoctorContext) => Promise<CheckResult>;
}

export interface DoctorContext {
  config: Config;
  homeDir: string;
  opsRoot: string;
}
```

### 6.4 `skills/types.ts`

```typescript
export interface SkillDefinition {
  id: string;               // "feature"
  description: string;
  role: string;             // "mariam"
  agent: string | null;     // "rex" | "hatim" | null
  inputs: SkillInput[];
  outputs: string[];        // path templates
  pre_hooks: string[];
  post_hooks: string[];
  category: SkillCategory;
  deprecated: boolean;
  body: string;             // prompt template
}

export type SkillCategory =
  | 'planning'
  | 'tickets'
  | 'architecture'
  | 'coordination'
  | 'review'
  | 'audits'
  | 'system'
  | 'docs';

export interface SkillInput {
  name: string;
  required: boolean;
  type: 'string' | 'issue-ref' | 'path' | 'enum';
  enum?: string[];
}
```

## 7. Theme Module

### 7.1 `theme/catppuccin.ts`

```typescript
export const palette = {
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
} as const;

export type PaletteToken = keyof typeof palette;
```

### 7.2 `theme/semantic.ts`

```typescript
import { palette } from './catppuccin.js';

export const semantic = {
  focus: palette.mauve,
  selection: palette.mauve,
  prompt: palette.mauve,
  success: palette.green,
  warning: palette.yellow,
  error: palette.red,
  info: palette.sapphire,
  inProgress: palette.peach,
  parked: palette.pink,
  project: palette.blue,
  code: palette.teal,
  highlight: palette.sky,
  body: palette.text,
  secondary: palette.subtext1,
  muted: palette.subtext0,
  placeholder: palette.overlay2,
  disabled: palette.overlay1,
  background: palette.base,
  panelBg: palette.mantle,
  outerBg: palette.crust,
  border: palette.surface0,
  divider: palette.overlay0,
  hoverBg: palette.surface2,
  selectedBg: palette.surface1,
} as const;
```

### 7.3 `theme/icons.ts`

```typescript
export const icons = {
  projectActive: '●',
  projectParked: '◌',
  projectArchived: '▢',
  statusApproved: '✓',
  statusDraft: '◐',
  statusBlocked: '✗',
  promptArrow: '❯',
  selectionArrow: '▶',
  doctorPass: '✓',
  doctorFail: '✗',
  doctorWarn: '!',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const,
  bullet: '•',
  arrow: '→',
  separator: '·',
} as const;
```

**Strict rule:** components import `semantic` and `icons` only. Never `palette` directly.

## 8. Vault Scanner

```mermaid
flowchart TD
  START([scanVault]) --> LIST[List Projects/* directories]
  LIST --> LOOP{for each project dir}
  LOOP --> CHECK[Check README.md exists]
  CHECK -->|missing| WARN1[Warning: no README]
  CHECK -->|present| READ[Read README.md]
  READ --> PARSE[Parse frontmatter with gray-matter]
  PARSE -->|invalid YAML| WARN2[Warning: malformed frontmatter]
  PARSE -->|valid| VALIDATE[Validate against project schema with zod]
  VALIDATE -->|fail| WARN3[Warning: missing field X]
  VALIDATE -->|pass| PUSH[Push Project to result]
  WARN1 --> PUSH_W[Push with warnings]
  WARN2 --> PUSH_W
  WARN3 --> PUSH_W
  PUSH --> NEXT[next project]
  PUSH_W --> NEXT
  NEXT --> LOOP
  LOOP -->|done| TRIE[Build Trie of project names]
  TRIE --> RETURN([return Project array + matcher])
```

### Performance characteristics

- Reads only `README.md` per project; ignores subfolders.
- Parallel reads with `p-limit(16)`.
- Frontmatter parse via `gray-matter` (~50µs/file).
- 50 projects: ~50ms warm cache.

## 9. Frontmatter Module

```typescript
import matter from 'gray-matter';
import { projectFrontmatterSchema } from './schemas.js';

export async function readProject(path: string): Promise<ProjectFrontmatter> {
  const raw = await fs.readFile(path, 'utf8');
  const { data } = matter(raw);
  return projectFrontmatterSchema.parse(data);
}

export async function updateProjectFrontmatter(
  path: string,
  update: Partial<ProjectFrontmatter>,
): Promise<void> {
  const raw = await fs.readFile(path, 'utf8');
  const parsed = matter(raw);
  const merged = { ...parsed.data, ...update };
  projectFrontmatterSchema.parse(merged);
  const next = matter.stringify(parsed.content, merged);
  await atomicWrite(path, next);
}

async function atomicWrite(path: string, content: string): Promise<void> {
  const tmp = `${path}.tmp.${process.pid}`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, path);
}
```

## 10. Input Box State Machine

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> typing: keypress
  typing --> typing: keypress (debounce 30ms)
  typing --> autocompleting: keypress matches prefix
  autocompleting --> typing: another keypress
  autocompleting --> idle: Esc
  typing --> history: Up arrow
  history --> history: Up/Down
  history --> typing: any key
  history --> idle: Esc
  typing --> submitting: Enter
  history --> submitting: Enter
  autocompleting --> submitting: Tab + Enter
  submitting --> dispatched: dispatcher resolves
  dispatched --> idle: action complete (navigate / skill / freeform)
```

The dispatcher:

```typescript
export async function dispatch(input: string, ctx: AppContext): Promise<Action> {
  const t = input.trim();
  if (!t) return { kind: 'noop' };

  const project = ctx.matcher.match(t);
  if (project) return { kind: 'navigate', project };

  if (t.startsWith('/')) {
    const skill = ctx.skills.resolve(t);
    if (skill) return { kind: 'launch-skill', skill };
    return { kind: 'error', message: `unknown skill: ${t}` };
  }

  return { kind: 'freeform-query', text: t };
}
```

## 11. Skill Launcher

```typescript
import { spawn } from 'node:child_process';
import { useApp } from 'ink';

export async function launchSkill(args: {
  skill: SkillDefinition;
  project: Project | null;
  config: Config;
  extraArgs: string[];
  pauseInk: () => void;
  resumeInk: () => void;
}): Promise<number> {
  const cwd = args.project?.path
    ? path.dirname(args.project.path)
    : process.cwd();

  const env = {
    ...process.env,
    DEVYARD_VAULT: args.config.vault.path,
    DEVYARD_ROLE: args.skill.role,
    DEVYARD_SKILL: args.skill.id,
    DEVYARD_PROJECT: args.project?.frontmatter.name ?? '',
    DEVYARD_OPS_ROOT: process.env.DEVYARD_OPS_ROOT ?? path.join(os.homedir(), '.devyard'),
  };

  args.pauseInk();

  return new Promise((resolve, reject) => {
    const child = spawn(
      args.config.claude.binary,
      ['--skill', args.skill.id, ...args.extraArgs],
      { stdio: 'inherit', cwd, env },
    );

    child.on('exit', (code) => {
      args.resumeInk();
      resolve(code ?? 0);
    });
    child.on('error', (err) => {
      args.resumeInk();
      reject(err);
    });
  });
}
```

## 12. MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class ObsidianMcpClient {
  private client: Client | null = null;

  async connect(c: Config['mcp']['obsidian']): Promise<void> {
    const transport = new StdioClientTransport({ command: c.command, args: c.args, env: c.env });
    this.client = new Client({ name: 'devyard', version: '1.0.0' }, { capabilities: {} });
    await this.client.connect(transport);
  }

  async listRecentIdeas(limit = 5): Promise<IdeaSummary[]> {
    if (!this.client) throw new Error('MCP not connected');
    const result = await this.client.callTool({
      name: 'obsidian_get_recent_changes',
      arguments: { directory: 'Ideas', limit },
    });
    return parseIdeas(result);
  }

  async writeIdea(path: string, content: string): Promise<void> {
    if (!this.client) throw new Error('MCP not connected');
    await this.client.callTool({
      name: 'obsidian_put_content',
      arguments: { path, content },
    });
  }

  async disconnect(): Promise<void> {
    await this.client?.close();
    this.client = null;
  }
}
```

## 13. Doctor — All 24 Required Checks

| # | id | Category | What | Pass criterion | Remediation |
|---|----|----------|------|----------------|-------------|
| 1 | `node-version` | env | Node ≥ 20.11 | `process.version` parses ≥ 20.11 | `nvm install 20.11.0` |
| 2 | `claude-binary` | deps | Claude in PATH | `which claude` returns 0 | Install from docs.claude.com |
| 3 | `config-valid` | env | Config parses | YAML parses + zod schema validates | Show field, suggest fix |
| 4 | `vault-path` | vault | Vault exists | Configured path exists, is directory | `devyard init` |
| 5 | `vault-structure` | vault | Top-level folders | `_System`, `Projects`, `Ideas`, `_Inbox`, `Handovers`, `Decisions`, `Roadmaps`, `Stakeholder-Updates`, `Audit-History` all present | `devyard init` |
| 6 | `vault-schemas` | vault | Schemas in vault `_System/schemas/` | All 15 schema files present | `devyard init` |
| 7 | `vault-templates` | vault | Templates in vault `_System/templates/` | All 15 templates present | `devyard init` |
| 8 | `obsidian-mcp-installed` | deps | MCP installable | `npx -y obsidian-mcp-server --version` works | Show npm install command |
| 9 | `obsidian-mcp-reachable` | integration | MCP responds | Connect stdio, list tools, disconnect; < 2s | Restart MCP, verify env |
| 10 | `ollama-reachable` | integration | Ollama up | GET `${url}/api/tags` returns 200 | `ollama serve` |
| 11 | `gitlab-token` | integration | GitLab token (optional) | If `GITLAB_TOKEN` set, non-empty | Optional — set in shell rc |
| 12 | `github-cli` | deps | gh CLI authenticated | `gh auth status` succeeds | `gh auth login` |
| 13 | `hooks-exist` | hooks | Hook scripts present | All 28 in `~/.devyard/hooks/`, exec bit set | `devyard init` |
| 14 | `claude-settings` | hooks | Claude settings wired | `~/.claude/settings.json` has DevYard entries | `devyard init` |
| 15 | `audit-log-writable` | hooks | Log writable | `~/.devyard/logs/` writable | `chmod u+w` |
| 16 | `skills-present` | engine | All 49 skills present | Every skill file in `~/.devyard/skills/<id>/SKILL.md` | `devyard init` |
| 17 | `roles-present` | engine | All 19 roles present | Every role file in `~/.devyard/roles/<dept>/` | `devyard init` |
| 18 | `agents-present` | engine | All 5 agents present | Every agent file in `~/.devyard/agents/` | `devyard init` |
| 19 | `rules-present` | engine | All 11 rules present | Every rule file in `~/.devyard/rules/` | `devyard init` |
| 20 | `pipelines-present` | engine | All 7 pipelines present | Every YAML in `~/.devyard/golden-paths/pipelines/` | `devyard init` |
| 21 | `onboarding-config` | env | `onboarding.yaml` filled | No placeholder values | `/setup` |
| 22 | `portfolio-config` | env | Portfolio config valid | Single mode OK; split mode has both roots resolvable | Reconfigure |
| 23 | `upstream-drift` | env | Up to date | Compare local tag to upstream latest | `/update` |
| 24 | `disk-writable` | env | Disk writable | `~/.devyard/` and vault writable | `chmod` |

### `--hooks-deep` additions (7 checks)

| # | Hook | Synthetic input | Expected |
|---|------|-----------------|----------|
| D1 | `pre-bash-block-force-push` | `git push --force origin main` | Exit ≠ 0 |
| D2 | `pre-write-secrets-scan` | content with `AKIAIOSFODNN7EXAMPLE` | Exit ≠ 0 |
| D3 | `block-git-add-all` | `git add -A` | Exit ≠ 0 |
| D4 | `block-main-push` | `git push origin main` | Exit ≠ 0 |
| D5 | `pre-skill-brd-validator` | BRD with empty `## Problem` | Exit ≠ 0 with missing-items report |
| D6 | `pre-skill-design-validator` | Design without `linked_brd:` | Exit ≠ 0 |
| D7 | `require-active-ticket` | Edit without marker file | Exit ≠ 0 |

### Doctor output format (Catppuccin colored)

```
DevYard doctor

Environment
  ✓ Node 20.11.1
  ✓ Claude binary at /opt/homebrew/bin/claude
  ✓ Config valid
  ✓ GitHub CLI authenticated as me2resh

Vault
  ✓ Vault path: ~/Documents/DevYard-Vault
  ✓ Top-level structure complete (9 folders)
  ✓ Schemas present (15)
  ✓ Templates present (15)

Integrations
  ✓ Obsidian MCP reachable (412ms)
  ✓ Ollama up at http://localhost:11434
  ! GitLab token not set (optional)
       → export GITLAB_TOKEN=... in your shell rc

Hooks
  ✓ 28 hooks installed, all executable
  ✓ Claude settings wired
  ✓ Audit log writable

Engine
  ✓ 49 skills present
  ✓ 19 roles present
  ✓ 5 agents present
  ✓ 11 rules present
  ✓ 7 pipelines present

System
  ✓ Onboarding config complete
  ✓ Portfolio: single mode
  ✓ Up to date (v1.0.0)
  ✓ Disk writable

24 required checks passed. 1 optional warning.
```

## 14. The 19 Roles — Specifications

Each role is a markdown file with this frontmatter and a system-prompt body. Below is the spec for each. Bodies are abbreviated; full versions live in `assets/roles/`.

### Engineering Department

```mermaid
graph TD
  KH[Khalid<br/>Head of Engineering] -->|escalates from| HI[Hisham<br/>Tech Lead]
  HI -->|hands off to| KA[Karim<br/>Backend]
  HI -->|hands off to| YA[Yasmin<br/>Frontend]
  HI -->|hands off to| SA[Salim<br/>QA]
  HI -->|hands off to| AD[Adel<br/>Platform]
  HI -->|hands off to| SF[Saif<br/>SRE]
```

**Khalid — Head of Engineering**
- Frontmatter: `name: Khalid`, `dept: engineering`, `tools_allowed: all read tools + Bash + Write (docs only)`, `focus: architecture decisions, cross-team escalations, release sign-off`
- Activates: AgDR escalation, `/release`, `/launch-check` review, cross-project arch reviews
- Authority: final call on architecture; signs off on launches

**Hisham — Tech Lead**
- `focus: design reviews, AgDR creation, sprint planning, PR mentoring`
- Activates: `/decide`, `/c4`, `/tech-vision`, `/stakeholder-update`, `/tasks`, `/agdr`
- Authority: technical-design approval; AgDR author

**Karim — Backend Engineer**
- `focus: API work, database changes, service implementation`
- Activates: paths under `src/api/`, `src/services/`, `migrations/`, `src/domain/`
- Tools: read, write, edit, bash (git, npm/pnpm, gh)

**Yasmin — Frontend Engineer**
- `focus: UI components, state management, performance`
- Activates: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.css`, `design-tokens`

**Salim — QA Engineer**
- `focus: test strategy, AC verification, bug triage`
- Activates: `tests/**`, `*.test.ts`, `*.spec.ts`, `/bug`, post-merge QA gate

**Adel — Platform Engineer**
- `focus: CI/CD, infra, Docker, cloud config`
- Activates: `.github/workflows/`, `Dockerfile`, `docker-compose*`, `terraform/`, `k8s/`

**Saif — SRE**
- `focus: incidents, observability, reliability`
- Activates: `monitoring/`, `runbooks/`, `alerts/`, `/investigation`, `/monitoring-audit`

### Product Department

**Omar — Head of Product**
- `focus: roadmap prioritization, stakeholder comms, launch decisions`
- Activates: `/roadmap` (final call), `/launch-check` (go/no-go), `/stakeholder-update` (audience: leadership)

**Mariam — Product Manager**
- `focus: specs, user stories, AC, backlog grooming`
- Activates: `/feature`, `/write-spec`, `/validate-idea`, `/roadmap` (proposals)

**Hanan — Product Analyst**
- `focus: events, funnels, success metrics`
- Activates: `/analytics-audit`, success-metric sections in specs

### Design Department

**Maha — Head of Design**
- `focus: design system, cross-product consistency`
- Activates: design-system changes, design escalation

**Nour — UI Designer**
- `focus: component design, visual specs, tokens`
- Activates: `*.tsx`, `*.css`, design-tokens, `/approve-design`

**Iman — UX Designer**
- `focus: user flows, IA, journey maps`
- Activates: `/journey`, `/process`, IA reviews

### Security Department

**Faisal — Head of Security**
- `focus: security policy, CRITICAL escalations`
- Activates: any CRITICAL finding in `/security-review` or `/compliance-check`

**Hakim — Security Auditor**
- `focus: threat modeling, compliance reviews`
- Activates: `/dfd`, `/threat-model`, `/compliance-check`, paths under `auth/`, `crypto/`

**Hamza — Penetration Tester**
- `focus: active security testing, vuln validation`
- Activates: explicit invocation for pen-test sessions

### Data Department

**Khalil — Head of Data**
- `focus: data architecture, governance`
- Activates: data-arch decisions, schema changes (with AgDR)

**Nadia — Data Analyst**
- `focus: querying, reporting, metrics`
- Activates: `/analytics-audit` data-side, metric definitions

**Anwar — Data Engineer**
- `focus: pipelines, schema design, data infra`
- Activates: `data-pipelines/`, `dbt/`, `migrations/` (data-side)

### Role-trigger table (machine-readable)

`assets/rules/role-triggers.md` contains a YAML block consumed by `detect-role-trigger.sh`:

```yaml
- role: hakim
  triggers:
    paths: ['src/auth/**', 'src/crypto/**']
    labels: ['security', 'auth']
    prompts: ['act as hakim', 'security review', 'threat model']

- role: salim
  triggers:
    paths: ['tests/**', '**/*.test.ts', '**/*.spec.ts']
    labels: ['qa', 'testing']
    prompts: ['act as salim', 'qa gate', 'test plan']

# ... (one entry per role)
```

## 15. The 5 Agents — Specifications

### 15.1 Rex (Code Reviewer)

```mermaid
sequenceDiagram
  participant U as User
  participant C as Claude (skill /code-review)
  participant R as Rex (sub-agent)
  participant G as GitHub
  participant FS as Filesystem

  U->>C: /code-review (after gh pr create)
  C->>R: invoke Agent tool with code-reviewer.md
  R->>G: gh pr view <N> --json files,body,baseRefName,headRefSha
  R->>G: gh pr diff <N>
  G-->>R: diff content + SHA
  R->>R: 8-criterion checklist<br/>(arch, quality, tests, security, perf, PR desc, AgDR, handbooks)
  alt all pass
    R->>G: gh pr review <N> --approve --body "..."
    R->>FS: write .claude/session/reviews/<N>-rex.approved (contains SHA)
  else issues found
    R->>G: gh pr review <N> --request-changes --body "..."
  end
  R-->>C: review report
  C-->>U: review summary
```

**Frontmatter:**
```yaml
name: Rex
description: Senior code reviewer
tools_allowed: [Read, Grep, Glob, Bash]
tools_denied: [Write, Edit, MultiEdit]
output: GitHub PR review + marker file
focus: architecture, quality, tests, security, performance, PR description, AgDR linkage
```

**8 review criteria (mandatory):**

1. Architecture & Design — matches approved design?
2. Code Quality — naming, structure, no swallowed errors, no bare `any`
3. Testing — coverage > 80% domain, AAA pattern, edge cases
4. Security — auth, secrets, injection, XSS basics
5. Performance — N+1 queries, bundle impact, unnecessary work
6. PR Description — Summary, Testing, Glossary present
7. Technical Decisions — AgDR linked if arch decision made
8. Adopter handbooks — followed if applicable

**Marker file format (`<N>-rex.approved`):**
```
SHA: 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b
```
Bare 40-char SHA on one line, validated by `block-unreviewed-merge.sh`.

### 15.2 Hatim (Security Reviewer)

```yaml
name: Hatim
description: Security-focused PR reviewer
tools_allowed: [Read, Grep, Glob, Bash]
output: GitHub PR review with CRITICAL/HIGH/MEDIUM/LOW findings
focus: secrets, injection, XSS, auth, data protection, API security
```

**6 security criteria:**

1. Secrets/Credentials — no hardcoded keys, tokens, passwords
2. Injection Prevention — parameterized queries, escaped inputs
3. XSS — output encoding, CSP
4. Auth/Authz — every endpoint checked
5. Data Protection — PII handling, encryption at rest where required
6. API Security — rate limits, input validation, error message sanitization

**Severity policy:**
- CRITICAL → blocks merge, notifies Faisal
- HIGH → blocks merge
- MEDIUM → must be addressed before launch
- LOW → captured in follow-up issue

### 15.3 Tariq (PR Manager)

```yaml
name: Tariq
description: End-to-end PR lifecycle coordinator
tools_allowed: [Bash, Read, Grep, Glob]
output: PR created, reviewed, merged, ticket closed
focus: ensuring every step happens in order
```

**Workflow:**

1. Verify active ticket exists; verify branch has ticket ID
2. Run pre-push gate (lint/typecheck/test/build)
3. Push branch
4. `gh pr create` with structured body
5. Invoke Rex via Agent
6. Notify human for `/approve-merge`
7. Verify SHA match
8. `gh pr merge --squash --delete-branch`
9. Update ticket to Done; close

### 15.4 Idris (Ticket Manager)

```yaml
name: Idris
description: Structured GitHub issue creator
tools_allowed: [Bash, Read]
output: GitHub issues with correct format, labels, links
focus: ticket discipline
```

**Invoked by:** `/feature`, `/bug`, `/task`, `/spike`, `/migration`, `/tickets-batch`, `/investigation`

**Per-type structure (validated by `validate-issue-structure.sh`):**

| Type | Required sections |
|------|------------------|
| Feature | User Story (As a / I want / So that), Acceptance Criteria (≥3) |
| Bug | Given/When/Then, Repro Steps, Expected vs Actual, Severity |
| Task | Driver, Scope, Done Criteria |
| Spike | Hypothesis, Budget, Kill Criteria, Disposition |
| Migration | Affected Tables, Rollback Plan, Observability, AgDR ref |
| Investigation | Symptom, Initial Hypotheses, Evidence Plan |

### 15.5 Munir (Dependency Auditor)

```yaml
name: Munir
description: Dependency auditor — vulnerabilities, outdated, license, health
tools_allowed: [Bash, Read, Grep, Glob]
output: report + auto-created issues for Critical/High
focus: npm audit, npm outdated, license compliance, package health
```

**Weekly schedule:** `golden-paths/pipelines/dependency-audit.yml` cron `0 9 * * 1` (Monday 09:00).

**Action policy:**
- Critical/High vuln → create GitHub Issue immediately, label `security`, assign Hisham
- Moderate vuln → add to weekly report
- Outdated major → flag in report, requires AgDR before update
- License GPL/AGPL → flag for legal review
- License UNLICENSED → block (issue created with `blocker` label)

## 16. The 11 Rules — Specifications

Each rule lives in `assets/rules/`. Bodies abbreviated; full text shipped.

### 16.1 `ticket-vocabulary.md`
Defines: `Ticket`, `#N`, `blocked by`, `closes #N` refer ONLY to real GitHub issues. For plan items, use `Step 1`, `Task 1`, `Item A`, plain bullets.

### 16.2 `workflow-gates.md`
Six sequential SDLC gates:
1. **Gate 1 — Validated Idea:** idea has been through `/validate-idea` with GREEN or YELLOW
2. **Gate 2 — Approved Spec:** BRD `status: approved`
3. **Gate 3 — Active Ticket:** `/start-ticket` declared; branch has ticket ID; design approved for UI
   - **Gate 3a — Migration:** ticket has `migration` label + AgDR ref
4. **Gate 4 — PR Ready:** tests pass, coverage > 80%, AgDR linked if decisions, Glossary present
5. **Gate 5 — Merge Ready:** Rex approved (SHA match), human approved (SHA match), CI green, design approved (if UI)
6. **Gate 6 — Launch Ready:** `/launch-check` returns GO

### 16.3 `agdr-decisions.md`
HARD STOP. Before any technical decision: run `/decide`, create AgDR. Trigger patterns: "should we use X or Y", "let's go with Z", "I'll switch the approach", any library choice, any architecture choice.

### 16.4 `git-conventions.md`
- Branch: `{type}/{TICKET-ID}-{description}` — types: feat, fix, refactor, chore, test, docs, perf, spike
- PR title: `type(TICKET-ID): description`
- Commit: `type[(scope)]: subject` — body explains why
- Never `git add -A` / `git add .` / `git add --all`
- Never commit directly to main, master, dev, develop
- Never hardcode secrets

### 16.5 `parallel-work.md`
Fan-out when: ≥ 2 file-independent items, each ≥ 5 min, no shared state.
Do NOT fan out: shared state, sequential deps, architecture decisions, refactoring touching shared code.

### 16.6 `code-standards.md`
- TS strict, no bare `any`, no swallowed errors
- DDD layer separation (domain / application / infrastructure / interface)
- Naming: PascalCase types, camelCase vars/funcs, kebab-case files
- Tests: AAA pattern, 70/20/10 unit/integration/e2e, >80% coverage for domain
- No top-level side effects in modules

### 16.7 `role-triggers.md`
Activation table (see §14 above). Format: YAML list of `{role, triggers: {paths, labels, prompts}}`.

### 16.8 `pr-workflow.md`
Hard stops:
- Before push: lint/typecheck/test/build all green
- Before PR create: Glossary section in body, ticket linked, Testing section
- After PR create: invoke Rex
- Before merge: Rex SHA match + human SHA match + CI green + design (if UI)

**WRONG approval:** "I said go ahead in chat" — this is NOT approval
**RIGHT approval:** `/approve-merge` skill run, structured marker written

### 16.9 `plan-mode.md`
Enter plan mode when: ≥ 4 dependent steps, unclear path, hard-to-reverse, cross-file refactor.
Don't enter for: single-step, obvious action, trivial work.

### 16.10 `pr-quality.md`
Mandatory:
- Glossary section in every PR body (defines unfamiliar terms)
- SHA verification before merge
- Design review marker for UI changes
- QA gate checklist completion
- No red CI before merge

### 16.11 `leak-protection.md`
Prevent private project names from leaking into public-repo issues/PRs. Maintained list in `~/.devyard/private-names.yaml`. Hook scans bodies before issue/pr create/comment.

## 17. The 28 Hooks — Specifications

Each hook is a bash script. Below: exact behavior, exit codes, and a representative implementation outline.

### Lib hooks (used by others)

**`_lib-audit-log.sh`** — appends `timestamp | hook | result | input` to `~/.devyard/logs/hook-audit.log`. Rotates at 10MB.

**`_lib-detect-bash-write.sh`** — detects if a bash command performs writes (`>`, `>>`, `tee`, `sed -i`, `mv`, `cp` to outside cwd).

**`_lib-detect-deprecated-config.sh`** — checks `onboarding.yaml` for old key names.

**`_lib-extract-pr.sh`** — extracts PR number from `gh pr create` output.

**`_lib-extract-push-ref.sh`** — extracts pushed branch from git push args.

**`_lib-multi-repo-trace.sh`** — traces ops root and project config across repos.

**`_lib-ops-root.sh`** — finds the DevYard ops root (looks for `.devyard-ops` marker).

**`_lib-portfolio-paths.sh`** — resolves public/private roots in split mode.

**`_lib-read-config.sh`** — reads `~/.devyard/config.yaml` from bash.

**`_lib-audit-history.sh`** — persists audit results to `Audit-History/` for trend tracking.

### Session-start hooks

```mermaid
sequenceDiagram
  participant CC as Claude Code session start
  participant H1 as onboarding-check.sh
  participant H2 as check-upstream-drift.sh
  participant H3 as check-portfolio-config.sh
  participant H4 as clear-bootstrap-marker.sh
  participant H5 as clear-issue-skill-marker.sh
  participant H6 as link-custom-skills.sh

  CC->>H1: SessionStart event
  H1-->>CC: banner if placeholders found
  CC->>H2: SessionStart
  H2-->>CC: banner if upstream drift
  CC->>H3: SessionStart
  H3-->>CC: warn if portfolio invalid
  CC->>H4: SessionStart
  H4-->>CC: removed stale marker
  CC->>H5: SessionStart
  H5-->>CC: removed stale marker
  CC->>H6: SessionStart (split mode only)
  H6-->>CC: symlinks created
```

**`onboarding-check.sh`** (advisory):
```bash
if grep -qE 'COMPANY_NAME_HERE|PROJECT_NAME_HERE' ~/.devyard/onboarding.yaml 2>/dev/null; then
  echo "[devyard] onboarding.yaml contains placeholders — run /setup" >&2
fi
exit 0
```

**`check-upstream-drift.sh`** (advisory): compares local git tag to upstream; banners if behind.

**`check-portfolio-config.sh`** (advisory): validates split-mode paths resolve.

**`clear-bootstrap-marker.sh`** (silent): removes stale `~/.claude/session/active-bootstrap` if older than 24h.

**`clear-issue-skill-marker.sh`** (silent): removes stale `~/.claude/session/active-issue-skill` if older than 1h.

**`link-custom-skills.sh`** (silent): in split mode, symlinks private `custom-skills/` into `.claude/skills/`.

### Ticket & workflow hooks

**`require-active-ticket.sh`** (PreToolUse on Write/Edit/MultiEdit/Bash):
```mermaid
flowchart TD
  A[Tool call: Write/Edit/Bash-write] --> B{Path in exempt list?}
  B -->|.claude/ docs/ *.md *bootstrap*| ALLOW[exit 0]
  B -->|no| C{Active ticket marker exists?}
  C -->|.claude/session/tickets/<project>| ALLOW
  C -->|missing| BLOCK[exit 2: 'Run /start-ticket NN first']
```

**`require-skill-for-issue-create.sh`** (PreToolUse on Bash):
```
if cmd matches `gh issue create`:
  if marker .claude/session/active-issue-skill exists: exit 0
  elif APEXYARD_ALLOW_RAW_TICKET_CREATE=1: exit 0
  else: exit 2 "Use /feature, /bug, or /task"
```

**`suggest-ticket-template.sh`** (PreToolUse, advisory): non-blocking reminder when bare `gh issue create` is seen.

**`require-migration-ticket.sh`** (PreToolUse on Edit/Write):
```mermaid
flowchart TD
  A[Edit/Write call] --> B{Path matches migration?<br/>migrations/** or */migrations/**}
  B -->|no| ALLOW
  B -->|yes| C{Active ticket exists?}
  C -->|no| BLOCK1[exit 2: 'No active ticket']
  C -->|yes| D[gh issue view to check labels]
  D --> E{Has 'migration' label?}
  E -->|no| BLOCK2[exit 2: 'Ticket missing migration label']
  E -->|yes| F[grep ticket body for AgDR-NNNN]
  F -->|missing| BLOCK3[exit 2: 'Migration AgDR required']
  F -->|present| ALLOW
```

**`validate-issue-structure.sh`** (PreToolUse on `gh issue create`): reads the `--body` or `--body-file` argument; validates required sections per type prefix.

### Git hooks

**`block-git-add-all.sh`**:
```bash
if [[ "$CMD" =~ git\ add\ (-A|\.|--all)$ ]]; then
  echo "[devyard] git add -A / . / --all blocked. Stage specific files." >&2
  /usr/bin/env bash "$DEVYARD_HOOKS/_lib-audit-log.sh" "git-add-all" "blocked" "$CMD"
  exit 2
fi
exit 0
```

**`block-main-push.sh`**: blocks `git push` to main/master/dev/develop (configurable list).

**`validate-branch-name.sh`**: on `git push`, requires `^(feat|fix|refactor|chore|test|docs|perf|spike)\/[A-Z]+-\d+-[a-z0-9-]+$`.

**`validate-commit-format.sh`**: on `git commit`, requires `^(feat|fix|refactor|chore|test|docs|perf|spike|build|ci)(\([^)]+\))?:\s.+$`.

**`verify-commit-refs.sh`**: on `git commit`, parses `Closes #N` / `Fixes #N`; verifies each is a real open issue via `gh issue view`.

**`check-secrets.sh`**: on `git commit`, runs grep over staged diff for AWS/GitHub/Slack/private-key patterns.

**`pre-push-gate.sh`**: runs configured commands in sequence: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Any non-zero blocks.

**`require-agdr-for-arch-changes.sh`**: see flowchart in §HLD 8.5.

### PR hooks

**`auto-code-review.sh`** (PostToolUse on `gh pr create`):
```
1. Extract PR number from tool output
2. Write .claude/session/reviews/<N>-pending
3. Echo "Invoke Rex immediately: use Agent tool with code-reviewer.md"
4. Exit 2 (advisory block to surface the instruction)
```

**`validate-pr-create.sh`** (PreToolUse on `gh pr create`): validates title pattern, body has `## Testing` and `## Glossary` sections, `Closes #N` present and ticket is open.

**`require-agdr-for-arch-pr.sh`** (PreToolUse on `gh pr create`): if changed-files intersect arch paths, require `AgDR-\d+` in body.

**`require-design-review-for-ui.sh`** (PreToolUse on `gh pr merge`): if PR touches UI paths, check `<N>-design.approved` exists with SHA matching HEAD.

**`block-merge-on-red-ci.sh`** (PreToolUse on `gh pr merge`): runs `gh pr checks <N>`; any failing/pending/cancelled blocks.

**`block-unreviewed-merge.sh`** (PreToolUse on `gh pr merge`): see HLD §8.4 sequence. Requires both `<N>-rex.approved` and `<N>-ceo.approved` with SHAs matching `gh pr view --json headRefSha`.

**`warn-stale-review-markers.sh`** (PostToolUse on `git push`): scans `.claude/session/reviews/*.approved` for stale SHAs; warns or deletes per config (`stale_policy: warn | delete`).

**`block-private-refs-in-public-repos.sh`** (PreToolUse on `gh issue create`, `gh pr create`, `gh issue comment`, `gh pr comment`): if target repo is in public-repo list, scans body for names in `~/.devyard/private-names.yaml`.

### Role hook

**`detect-role-trigger.sh`** (PreToolUse/UserPromptSubmit, advisory): parses prompt for "act as X", inspects file paths for trigger matches, banners suggested role. Never blocks.

## 18. The 49 Skills — Per-Skill Specifications

Each skill is `assets/skills/<id>/SKILL.md` with this shape:

```markdown
---
id: feature
description: Generate a structured feature request GitHub issue
role: mariam
agent: idris
inputs:
  - name: title
    required: true
    type: string
outputs:
  - GitHub issue in current project repo
  - Projects/<Project>/BRDs/<title>.md
pre_hooks: []
post_hooks: [post-skill-update-state]
category: tickets
---

# Skill: /feature

[prompt body...]
```

The remainder of this section specifies each skill's purpose, inputs, outputs, role, agent (if any), pre/post hooks, and category. Full prompt bodies are shipped in assets.

### Planning & Discovery (6)

| Skill | Role | Agent | Inputs | Outputs | Hooks |
|-------|------|-------|--------|---------|-------|
| `/status` | hisham | — | none / `--briefing` | stdout summary | post: update-state |
| `/inbox` | hisham | — | optional `--project` | stdout attention queue | none |
| `/projects` | hisham | — | `--status` (active/parked/archived) | stdout portfolio table | none |
| `/tasks` | hisham | — | none | stdout prioritized action list | none |
| `/roadmap` | mariam | — | op: show/add/remove/reorder/move/close | `Projects/<P>/roadmap.md` | none |
| `/stakeholder-update` | hisham | — | `--project --type weekly/monthly/launch` | `Stakeholder-Updates/<date>.md` | none |

### Ticket Creation (12)

| Skill | Role | Agent | Inputs | Outputs | Pre-hooks |
|-------|------|-------|--------|---------|-----------|
| `/feature` | mariam | idris | title | GH issue + `BRDs/<title>.md` | validate-issue-structure |
| `/bug` | salim | idris | summary | GH issue with Given/When/Then | validate-issue-structure |
| `/task` | hisham | idris | driver, scope | GH issue with task prefix | validate-issue-structure |
| `/spike` | hisham | idris | hypothesis, budget hours | GH issue with kill criteria | validate-issue-structure |
| `/spike-close` | spike runner | idris | spike id, disposition | issue closed; PROMOTE→ new feature; DISCARD → `spike-memos/<slug>.md` | none |
| `/investigation` | saif | idris | symptom | GH issue + `investigations/<slug>.md` live doc | validate-issue-structure |
| `/idea` | anyone | — | description | `Ideas/<title>.md` with IDEA-NNN; optional GH issue | none |
| `/validate-idea` | mariam | — | IDEA-NNN or description | verdict GREEN/YELLOW/RED; updates Ideas frontmatter | none |
| `/tickets-batch` | hisham | idris | shared context + per-ticket details | 5–20 GH issues | validate-issue-structure |
| `/migration` | karim | idris | scope, tables, rollback | GH issue with migration label + AgDR | validate-issue-structure |
| `/start-ticket` | any engineer | — | ticket number | `.claude/session/tickets/<project>` marker; branch suggestion | none |
| `/write-spec` | mariam | — | problem statement | `Designs/<spec>.md` (P0/P1/P2) | none |

### Architecture & Design (8)

| Skill | Role | Inputs | Outputs |
|-------|------|--------|---------|
| `/decide` | hisham | decision context, options | `docs/agdr/AgDR-NNNN-slug.md` |
| `/agdr` | hisham | op: browse/search/show/stats | stdout |
| `/c4` | hisham | level (1/2/both) | Mermaid markdown in `Designs/c4-<level>.md` |
| `/dfd` | hakim | none | Mermaid + optional Threat Dragon JSON |
| `/threat-model` | hakim | none (requires DFD) | `Designs/threat-model.md` (STRIDE) |
| `/tech-vision` | khalid | 7 sections interactively | `Designs/tech-vision.md` |
| `/process` | mariam | anchor flow name | `.bpmn` + `.process-source.md` |
| `/journey` | iman | journey description | HTML + YAML source |

### Coordination (1)

`/fan-out` — spawns N parallel sub-agents via Agent tool, optionally in worktrees. Cap at 5 concurrent. Role: hisham.

### Code Review & Quality (5)

| Skill | Role | Agent | Output |
|-------|------|-------|--------|
| `/code-review` | hisham | **rex** | GH PR review + `<N>-rex.approved` marker |
| `/security-review` | hakim | **hatim** | GH PR review with severity tags |
| `/approve-merge` | the human | — | `<N>-ceo.approved` marker + `gh pr merge --squash` |
| `/approve-design` | nour | — | `<N>-design.approved` marker |
| `/audit-deps` | adel | **munir** | weekly report + auto-issues for Critical/High |

### Audits & Launch (9)

| Skill | Role | Inputs | Outputs | Persistence |
|-------|------|--------|---------|-------------|
| `/launch-check` | khalid | none | 8-dim verdict GO/WARN/CONDITIONAL/NO-GO | `Audit-History/launch-<date>.md` |
| `/accessibility-audit` | nour | none | WCAG findings table | `Audit-History/accessibility-<date>.md` |
| `/compliance-check` | faisal | none (requires DFD) | GDPR + ePrivacy findings | `Audit-History/compliance-<date>.md` |
| `/analytics-audit` | hanan | none | SDK + events + funnels report | `Audit-History/analytics-<date>.md` |
| `/seo-audit` | mariam | none | technical SEO score 0–100 | `Audit-History/seo-<date>.md` |
| `/performance-audit` | yasmin | none | bundle + images + CWV report | `Audit-History/performance-<date>.md` |
| `/monitoring-audit` | saif | none | observability gap report | `Audit-History/monitoring-<date>.md` |
| `/docs-audit` | hisham | none | Diataxis coverage + staleness | `Audit-History/docs-<date>.md` |
| `/release` | maintainer | none | semver bump + CHANGELOG + release PR | tag |

### System Management (5)

| Skill | Role | Inputs | Outputs |
|-------|------|--------|---------|
| `/setup` | new user | conversational | `~/.devyard/onboarding.yaml` + `.devyard-fork` marker |
| `/handover` | hisham | repo URL | `Projects/<Name>/handover-assessment.md` + register in `projects.yaml` |
| `/update` | maintainer | none | sync branch from upstream |
| `/split-portfolio` | maintainer | `--dry-run` / `--verify` | public+private repos created |
| `/onboard` (DEPRECATED) | — | none | redirects to `/setup` or `/handover` |

### Documentation & Operations (3)

| Skill | Role | Inputs | Outputs |
|-------|------|--------|---------|
| `/extract-features` | hisham | none | `Projects/<P>/feature-inventory.md` (6 axes) |
| `/debug` | any | symptom | stdout hypothesis ladder |
| `/cli-builder` | any | CLI description | stdout structured guidance |

## 19. The 3 Workflows

### 19.1 `workflows/sdlc.md`

```mermaid
flowchart LR
  P1[Phase 1<br/>Planning<br/>Mariam, Omar] -->|PRD approved| P2[Phase 2<br/>Tech Design<br/>Hisham, Karim]
  P2 -->|Design approved<br/>AgDRs written| P3[Phase 3<br/>Build<br/>Karim, Yasmin]
  P3 -->|Migration sub-flow| P3a[Phase 3a<br/>Migration<br/>Karim]
  P3a -->|Migration tested| P3
  P3 -->|All ACs met<br/>PR created| P4[Phase 4<br/>Code Review<br/>Rex + Hisham]
  P4 -->|Rex approved<br/>human approved| P5[Phase 5<br/>QA<br/>Salim]
  P5 -->|Coverage > 80%<br/>No Critical bugs| P6[Phase 6<br/>Deploy<br/>Adel, Saif]
  P6 -->|Deployed<br/>Rollback tested| P7[Phase 7<br/>Monitor<br/>Saif]
```

Each phase has entry / exit criteria specified in the BRD §7.

### 19.2 `workflows/code-review.md`

Author responsibilities → reviewer responsibilities → anti-patterns Rex blocks. Mirrors agent §15.1 spec.

### 19.3 `workflows/deployment.md`

```mermaid
flowchart TD
  S1[1. Lint + typecheck] --> S2[2. Unit tests + coverage]
  S2 --> S3[3. Build]
  S3 --> S4[4. Security scan<br/>Semgrep + TruffleHog]
  S4 --> S5[5. Dependency audit<br/>Munir]
  S5 --> S6[6. Integration tests]
  S6 --> S7[7. E2E tests<br/>critical paths]
  S7 --> S8[8. Docker build + push]
  S8 --> S9[9. Deploy dev<br/>auto]
  S9 --> S10[10. Deploy staging<br/>auto]
  S10 --> S11[11. Deploy prod<br/>MANUAL approval]

  S11 -->|Error rate > 1%| RB[Rollback]
  S11 -->|Latency p99 > 2x| RB
  S11 -->|Data corruption| RB
```

## 20. The 7 Golden-Path Pipelines

YAML templates dropped into `.github/workflows/` in any DevYard-managed project.

### 20.1 `ci.yml`

Combined pipeline: Rex (code quality), Hatim (security), Munir (deps) as parallel jobs. Posts a summary comment on PR.

```yaml
name: CI
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  rex-review:
    name: Rex — Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20.11, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --coverage
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with: { name: rex-report, path: coverage/ }

  shield-review:
    name: Hatim — Security
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
      - run: npm audit --audit-level=high
      - uses: trufflesecurity/trufflehog@main
        with: { path: ./, base: ${{ github.event.pull_request.base.sha }} }

  guardian-audit:
    name: Munir — Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --json > audit.json
      - run: npm outdated --json > outdated.json
      - uses: actions/upload-artifact@v4
        with: { name: munir-report, path: '*.json' }

  ci-summary:
    name: CI Summary
    needs: [rex-review, shield-review, guardian-audit]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/download-artifact@v4
      - uses: actions/github-script@v7
        with:
          script: |
            const body = `## CI Summary\n... aggregated from artifacts ...`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body,
            });
```

### 20.2–20.7

| Pipeline | Trigger | Jobs |
|----------|---------|------|
| `code-quality.yml` | pull_request | lint, typecheck, prettier check, test, build, Rex comment |
| `security.yml` | pull_request | Semgrep, npm audit, TruffleHog, CodeQL, ESLint security plugin, Hatim comment |
| `dependency-audit.yml` | schedule `0 9 * * 1` + workflow_dispatch | npm audit, outdated, license check; Munir issue creation |
| `pr-title-check.yml` | pull_request title edit | regex check `type(TICKET): description`; auto-label |
| `review-check.yml` | pull_request synchronize + check_run | verify Rex marker matches HEAD SHA |
| `seo-check.yml` | pull_request paths `**.md` `**.mdx` | meta, heading hierarchy, word count, links; scoring 0–100 |

## 21. Vault Frontmatter Schemas (JSON Schema excerpts)

`assets/schemas/project.schema.json` (illustrative):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "type", "status", "tier", "repos", "stack", "created"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "type": { "const": "project" },
    "status": { "enum": ["created", "active", "parked", "archived"] },
    "tier": { "enum": ["P0", "P1", "P2"] },
    "repos": { "type": "array", "items": { "type": "string", "format": "uri" } },
    "last_branch": { "type": ["string", "null"] },
    "last_ticket": { "type": ["string", "null"] },
    "last_session": { "type": ["string", "null"], "format": "date" },
    "stack": { "type": "array", "items": { "type": "string" } },
    "created": { "type": "string", "format": "date" },
    "team": { "type": ["string", "null"] }
  },
  "additionalProperties": false
}
```

Similar schemas exist for: brd, design, agdr, tasks, session, idea, handover, roadmap, stakeholder-update, investigation, spike-memo, feature-inventory, tech-vision, audit. Total: **15 schemas**.

## 22. Installer

### 22.1 `install.sh` (first-time)

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "DevYard installer"

# 1. Node ≥ 20
if ! command -v node >/dev/null; then
  echo "Install Node 20.11+ first" >&2; exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [[ $NODE_MAJOR -lt 20 ]]; then
  echo "Node 20+ required (have $NODE_MAJOR)" >&2; exit 1
fi

# 2. pnpm
command -v pnpm >/dev/null || npm install -g pnpm

# 3. Build
pnpm install --frozen-lockfile
pnpm build

# 4. Link binary
pnpm link --global

# 5. Idempotent init
devyard init

echo "✓ DevYard ready. Run 'devyard' to start."
```

### 22.2 `devyard init` flow

```mermaid
flowchart TD
  START([devyard init]) --> CFG{~/.devyard/config.yaml exists?}
  CFG -->|no| ASK[Prompt: vault path<br/>Ollama URL<br/>Obsidian app path]
  ASK --> WRITE_CFG[Write config.yaml with defaults]
  CFG -->|yes| READ_CFG[Read existing config]
  WRITE_CFG --> SYS[Create ~/.devyard/ skeleton<br/>logs/, schemas/, ...]
  READ_CFG --> SYS
  SYS --> SYMLINK[Symlink bundled assets<br/>roles, rules, skills, agents, hooks, schemas, templates, workflows]
  SYMLINK --> CHMOD[chmod +x hooks/*.sh]
  CHMOD --> VAULT{Vault path exists?}
  VAULT -->|no| MKVAULT[Create vault top-level folders]
  VAULT -->|yes| CHECKVAULT[Check vault structure complete]
  MKVAULT --> COPY_VAULT[Copy schemas + templates to _System/]
  CHECKVAULT --> COPY_VAULT
  COPY_VAULT --> CLAUDE{~/.claude/settings.json exists?}
  CLAUDE -->|no| WRITE_CLAUDE[Write fresh settings.json]
  CLAUDE -->|yes| MERGE[Merge DevYard hook entries preserving user content]
  WRITE_CLAUDE --> MCP[Install Obsidian MCP via npx]
  MERGE --> MCP
  MCP --> DOCTOR[Run devyard doctor]
  DOCTOR -->|all required pass| DONE([exit 0])
  DOCTOR -->|required fail| FAIL[Print remediation, exit 1]
```

## 23. Claude Settings Wiring

`assets/claude-settings.json` (merged into `~/.claude/settings.json`):

```json
{
  "hooks": {
    "SessionStart": [
      { "script": "~/.devyard/hooks/onboarding-check.sh" },
      { "script": "~/.devyard/hooks/check-upstream-drift.sh" },
      { "script": "~/.devyard/hooks/check-portfolio-config.sh" },
      { "script": "~/.devyard/hooks/clear-bootstrap-marker.sh" },
      { "script": "~/.devyard/hooks/clear-issue-skill-marker.sh" },
      { "script": "~/.devyard/hooks/link-custom-skills.sh" }
    ],
    "PreToolUse": {
      "Bash": [
        { "script": "~/.devyard/hooks/block-git-add-all.sh" },
        { "script": "~/.devyard/hooks/block-main-push.sh" },
        { "script": "~/.devyard/hooks/validate-branch-name.sh" },
        { "script": "~/.devyard/hooks/validate-commit-format.sh" },
        { "script": "~/.devyard/hooks/verify-commit-refs.sh" },
        { "script": "~/.devyard/hooks/check-secrets.sh" },
        { "script": "~/.devyard/hooks/pre-push-gate.sh" },
        { "script": "~/.devyard/hooks/require-agdr-for-arch-changes.sh" },
        { "script": "~/.devyard/hooks/require-active-ticket.sh" },
        { "script": "~/.devyard/hooks/require-skill-for-issue-create.sh" },
        { "script": "~/.devyard/hooks/suggest-ticket-template.sh" },
        { "script": "~/.devyard/hooks/validate-issue-structure.sh" },
        { "script": "~/.devyard/hooks/validate-pr-create.sh" },
        { "script": "~/.devyard/hooks/require-agdr-for-arch-pr.sh" },
        { "script": "~/.devyard/hooks/require-design-review-for-ui.sh" },
        { "script": "~/.devyard/hooks/block-merge-on-red-ci.sh" },
        { "script": "~/.devyard/hooks/block-unreviewed-merge.sh" },
        { "script": "~/.devyard/hooks/block-private-refs-in-public-repos.sh" }
      ],
      "Write": [
        { "script": "~/.devyard/hooks/require-active-ticket.sh" },
        { "script": "~/.devyard/hooks/check-secrets.sh" },
        { "script": "~/.devyard/hooks/require-migration-ticket.sh" }
      ],
      "Edit": [
        { "script": "~/.devyard/hooks/require-active-ticket.sh" },
        { "script": "~/.devyard/hooks/require-migration-ticket.sh" }
      ],
      "MultiEdit": [
        { "script": "~/.devyard/hooks/require-active-ticket.sh" },
        { "script": "~/.devyard/hooks/require-migration-ticket.sh" }
      ]
    },
    "PostToolUse": {
      "Bash": [
        { "script": "~/.devyard/hooks/auto-code-review.sh" },
        { "script": "~/.devyard/hooks/warn-stale-review-markers.sh" }
      ]
    },
    "UserPromptSubmit": [
      { "script": "~/.devyard/hooks/detect-role-trigger.sh" }
    ]
  }
}
```

## 24. CLI Commands

| Command | Effect |
|---------|--------|
| `devyard` | Open landing screen |
| `devyard init` | Idempotent setup |
| `devyard doctor` | Run 24 required + 1 optional checks |
| `devyard doctor --hooks-deep` | Doctor + 7 hook firing tests |
| `devyard add <name>` | Scaffold new project in vault |
| `devyard hooks list` | List all 28 hooks + enabled state |
| `devyard hooks disable <name>` | Disable a hook |
| `devyard hooks enable <name>` | Enable a hook |
| `devyard hooks log [--tail N]` | Tail hook-audit.log |
| `devyard skills list` | List all 49 skills |
| `devyard roles list` | List all 19 roles |
| `devyard agents list` | List all 5 agents |
| `devyard --version` | Print version |
| `devyard --help` | Help |

## 25. Performance Implementation Notes

- **Vault scan:** `Promise.all` with `p-limit(16)`.
- **Autocomplete:** Trie indexed at scan time; lookup O(prefix length).
- **First-paint:** render skeleton at 80ms, replace panels async.
- **Input box:** `useState` for value, `useDeferredValue` for suggestions.
- **MCP calls:** session-scoped singletons; never reconnect per call.
- **Hook execution:** pure bash where possible; avoid `python`, `jq` external calls.

## 26. Testing Strategy

Required tests (Vitest):

| File | Coverage |
|------|----------|
| `tests/data/frontmatter.test.ts` | Parse/serialize round-trips for all 15 entity types |
| `tests/data/vault-scanner.test.ts` | Fixture vault with 3 valid + 2 malformed projects; assert warnings vs failures |
| `tests/data/matcher.test.ts` | Fuzzy match: exact, prefix, substring, miss, special chars |
| `tests/input/dispatcher.test.ts` | All three buckets; ambiguity cases |
| `tests/skills/resolver.test.ts` | Skill name resolution; strict matching for skills, fuzzy for projects |
| `tests/doctor/check.test.ts` | Each check runs and reports expected shape (mocked world) |

Not tested in v1.0: Ink components (manual smoke + doctor), hooks (covered by `--hooks-deep`), installer (manual fresh-machine test).

## 27. Build Order — Day by Day

### Phase A: Foundation (Weeks 1–2, ~10 days)

| Day | Deliverable |
|-----|-------------|
| 1 | Repo scaffold, tsconfig, biome, package.json, install.sh stub |
| 2 | Theme module (palette + semantic + icons); unit test |
| 3 | Config loader + defaults + zod schema |
| 4 | Doctor framework + 5 basic checks (1–5) |
| 5 | Frontmatter module + project schema + vault scanner |
| 6 | MCP client wrapper + Obsidian integration; doctor checks 8–9 |
| 7 | Ollama HTTP client; doctor check 10 |
| 8 | Remaining doctor checks (6–7, 11–24) |
| 9 | Installer skeleton (vault scaffold, symlinks, Claude settings merge) |
| 10 | Phase A integration test: fresh install → doctor green |

### Phase B: Navigator (Weeks 3–4, ~10 days)

| Day | Deliverable |
|-----|-------------|
| 11 | Ink scaffold; app component; screen router |
| 12 | LandingScreen with three panel placeholders |
| 13 | ProjectsPanel wired to vault scanner |
| 14 | StatusPanel wired to Ollama + Claude version |
| 15 | IdeasPanel wired to Obsidian MCP |
| 16 | InputBox component + state machine |
| 17 | Dispatcher + autocomplete (trie + fuzzy) |
| 18 | History persistence + Up/Down navigation |
| 19 | ProjectScreen + back navigation |
| 20 | Phase B integration: `devyard` opens, navigates, returns |

### Phase C: Engine (Weeks 5–10, ~30 days)

**Week 5 (days 21–25): First 10 skills + skill infrastructure**
- Day 21: Skill resolver + launcher + env builder
- Day 22: `/status`, `/inbox`
- Day 23: `/projects`, `/tasks`
- Day 24: `/start-ticket`, `/feature`, `/bug`
- Day 25: `/task`, `/idea`, `/validate-idea`

**Week 6 (days 26–30): 19 roles + 5 agents + 11 rules**
- Day 26: 7 engineering roles
- Day 27: 6 product + design roles
- Day 28: 6 security + data roles
- Day 29: 5 agents (Rex, Hatim, Tariq, Idris, Munir)
- Day 30: 11 rules + role-trigger YAML

**Week 7 (days 31–35): 28 hooks**
- Day 31: 10 lib hooks + 6 session-start hooks
- Day 32: 5 ticket/workflow hooks
- Day 33: 8 git hooks
- Day 34: 8 PR hooks
- Day 35: 1 role hook + audit-log + hooks-deep doctor mode

**Week 8 (days 36–40): Next 12 skills (decision-related)**
- Day 36: `/decide`, `/agdr`
- Day 37: `/c4`, `/dfd`
- Day 38: `/threat-model`, `/tech-vision`
- Day 39: `/write-spec`, `/migration`
- Day 40: `/spike`, `/spike-close`, `/investigation`, `/tickets-batch`

**Week 9 (days 41–45): Next 12 skills (review + audits)**
- Day 41: `/code-review`, `/security-review`
- Day 42: `/approve-merge`, `/approve-design`, `/audit-deps`
- Day 43: `/launch-check`, `/accessibility-audit`
- Day 44: `/compliance-check`, `/analytics-audit`, `/seo-audit`
- Day 45: `/performance-audit`, `/monitoring-audit`

**Week 10 (days 46–50): Remaining 15 skills + 7 pipelines**
- Day 46: `/docs-audit`, `/roadmap`, `/stakeholder-update`, `/release`
- Day 47: `/setup`, `/handover`, `/update`, `/split-portfolio`
- Day 48: `/extract-features`, `/debug`, `/cli-builder`, `/fan-out`
- Day 49: `/process`, `/journey`, `/onboard` (deprecated stub)
- Day 50: 7 golden-path CI pipelines

### Phase D: Hardening (Weeks 11–12, ~10 days)

| Day | Deliverable |
|-----|-------------|
| 51 | Performance pass: hit all NFR budgets |
| 52 | Fresh-machine install test #1; fix breakages |
| 53 | Fresh-machine install test #2; iterate |
| 54 | `devyard doctor --hooks-deep` all pass |
| 55 | Run `/launch-check` on DevYard itself |
| 56 | Fix all `/launch-check` warnings |
| 57 | README + screenshots + quickstart |
| 58 | ADR write-up (all 20 ADRs in `docs/decisions/`) |
| 59 | BRD `status: approved` cold re-read; CHANGELOG |
| 60 | v1.0 tag + announcement |

## 28. Open Implementation Questions

| Q | Decision deadline | Default if unanswered |
|---|-------------------|----------------------|
| Q1 | Ink pause/resume across `spawn` clean? | Day 21 | Test in `/status` skill |
| Q2 | `fuse.js` vs `fzf` (JS) | Day 17 | Benchmark; pick whichever hits 50ms p95 |
| Q3 | Ship own `obsidian-mcp-server` or upstream npm? | Day 6 | Use upstream; fork if licensing/maintenance issues |
| Q4 | Claude Code settings path on macOS | Day 9 | Hardcode `~/.claude/settings.json` |
| Q5 | Schema validation: zod-only or zod+ajv? | Day 5 | zod for TS, ajv for portable JSON Schema |

## 29. Done Criteria for v1.0

- All FRs in BRD §7 implemented
- All NFR perf budgets met for 2 consecutive weeks of daily use
- `devyard doctor` and `devyard doctor --hooks-deep` green on fresh macOS in < 15 min
- `/launch-check` on DevYard itself returns GO
- BRD `status: approved` after cold re-read
- README + screenshots + quickstart published
- 20 ADRs committed in `docs/decisions/`
- All 49 skills tested in practice (smoke run)
- v1.0 git tag created

## 30. Glossary

(See BRD §13.)
