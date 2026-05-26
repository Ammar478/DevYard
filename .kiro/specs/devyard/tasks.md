# Implementation Plan: DevYard — Personal Engineering OS

## Overview

DevYard is built in four phases over 12 weeks. Each phase produces a runnable, verifiable system. Tasks follow the design's module boundaries (`src/`) and the four-layer enforcement model (Skills → Roles → Rules → Hooks). All code is TypeScript strict-mode ESM; tests use Vitest + fast-check.

## Tasks

- [x] 1. Phase A — Foundation: Project scaffold and toolchain
  - Initialise the pnpm workspace: `package.json` with `"type": "module"`, `tsconfig.json` with all required compiler options (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `jsx: react-jsx`), `.nvmrc` pinned to `20.11.0`, `biome.json`, `vitest.config.ts`, and `tsup.config.ts`
  - Add runtime dependencies: `ink@5`, `react@18`, `@modelcontextprotocol/sdk`, `yaml`, `gray-matter`, `fuse.js`, `zod`, `ajv`, `commander`, `p-limit`
  - Add dev dependencies: `typescript@5.4`, `tsx`, `tsup`, `biome@1.8`, `vitest@1.6`, `fast-check`, `@types/react`, `@types/node`
  - Create `src/` directory tree matching the design's module boundaries
  - Add `pnpm build`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm link` scripts
  - _Requirements: 20.1–20.11_


- [x] 2. Phase A — Foundation: Theme module
  - [x] 2.1 Implement `src/theme/catppuccin.ts` — define all 26 Catppuccin Mocha palette tokens as a `const` object with hex values; mark file as internal (no re-export from index)
    - _Requirements: 11.1, 11.2_
  - [x] 2.2 Implement `src/theme/semantic.ts` — map all 23 semantic token names (`focus`, `selection`, `prompt`, `success`, `warning`, `error`, `info`, `inProgress`, `parked`, `project`, `code`, `highlight`, `body`, `secondary`, `muted`, `placeholder`, `disabled`, `background`, `panelBg`, `outerBg`, `border`, `divider`, `hoverBg`, `selectedBg`) to palette values; export as `semantic` const
    - _Requirements: 11.2, 11.4_
  - [x] 2.3 Implement `src/theme/icons.ts` — export `icons` const with all Unicode-only icon constants (no Nerd Font); include spinner frames array
    - _Requirements: 11.5_
  - [x] 2.4 Implement `src/theme/index.ts` — re-export `semantic` and `icons` only; never re-export `catppuccin`
    - _Requirements: 11.3_
  - [x] 2.5 Write property test for semantic token coverage
    - **Property 10: Semantic Token Coverage** — for any semantic token name exported from `theme/semantic.ts`, the resolved hex value should be a valid 7-character hex color string matching a Catppuccin Mocha palette value
    - **Validates: Requirements 11.2, 11.4**
    - _Test file: `tests/theme/semantic.test.ts`_


- [x] 3. Phase A — Foundation: Configuration loader
  - [x] 3.1 Define `src/config/types.ts` — `Config` interface with all sections: `vault`, `ollama`, `claude`, `mcp`, `ui`, `performance`, `logging`, `env`, `portfolio`; define `ConfigValidationError` typed error class
    - _Requirements: 13.3_
  - [x] 3.2 Implement `src/config/defaults.ts` — `DEFAULT_CONFIG: Config` with all default values from the design (vault path, Ollama URL, panel widths, performance budgets, log level, etc.)
    - _Requirements: 13.2_
  - [x] 3.3 Implement `src/config/load.ts` — `readConfig(): Config`; reads `~/.devyard/config.yaml` using `yaml` package, merges with defaults, validates against Zod schema; throws `ConfigValidationError` with specific failing field and suggested fix on parse or validation failure; never reads tokens from file
    - _Requirements: 13.1, 13.4, 13.5, 13.6_
  - [x] 3.4 Write unit tests for config loader
    - Test valid config, missing optional fields (defaults applied), invalid YAML (error with field name), split-mode missing roots (error), token fields absent from file
    - _Requirements: 13.1–13.6_
    - _Test file: `tests/config/load.test.ts`_


- [x] 4. Phase A — Foundation: Data types, Zod schemas, and JSON schema files
  - [x] 4.1 Define all 14 frontmatter interfaces in `src/data/types.ts`: `ProjectFrontmatter`, `BrdFrontmatter`, `DesignFrontmatter`, `AgdrFrontmatter`, `TasksFrontmatter`, `SessionFrontmatter`, `IdeaFrontmatter`, `HandoverFrontmatter`, `RoadmapFrontmatter`, `StakeholderUpdateFrontmatter`, `InvestigationFrontmatter`, `SpikeMemoFrontmatter`, `FeatureInventoryFrontmatter`, `AuditResultFrontmatter`; define typed error classes `FrontmatterValidationError`, `McpConnectionError`, `SkillNotFoundError`
    - _Requirements: 8.1–8.13_
  - [x] 4.2 Implement Zod schemas for all 14 entity types in `src/data/schemas.ts`; export one named schema per type (e.g., `projectFrontmatterSchema`)
    - _Requirements: 2.3, 8.10_
  - [x] 4.3 Write 15 JSON schema files to `assets/schemas/` (one per artifact type plus `config`); schemas must be valid JSON Schema draft-07 and align with the Zod schemas
    - _Requirements: 8.2, 9.3_
  - [x] 4.4 Write 15 template markdown files to `assets/templates/` (one per artifact type); each template must include the correct frontmatter keys with placeholder values
    - _Requirements: 8.3, 9.3_


- [x] 5. Phase A — Foundation: Frontmatter module
  - [x] 5.1 Implement `src/data/frontmatter.ts` — `readFrontmatter(path)`, `updateProjectFrontmatter(path, update)`, and `atomicWrite(path, content)`; atomic write uses `.tmp.{pid}` intermediate file + rename; validate against Zod schema before writing; throw `FrontmatterValidationError` on validation failure
    - _Requirements: 2.3, 2.8, 8.10, 8.11_
  - [x] 5.2 Write property test for frontmatter round-trip (all 14 types)
    - **Property 1: Frontmatter Round-Trip** — for any valid `ProjectFrontmatter` object, serializing to YAML frontmatter string then parsing back should produce a deeply equal object
    - **Property 2: All Frontmatter Types Round-Trip** — for any valid frontmatter object of any of the 14 entity types, serializing then parsing should produce an equivalent object
    - **Validates: Requirements 2.3, 2.9, 8.10**
    - _Test file: `tests/data/frontmatter.test.ts`_
  - [x] 5.3 Write property test for frontmatter validation rejection
    - **Property 9: Frontmatter Validation Rejects Invalid Data** — for any frontmatter object missing a required field or with an invalid type, the write operation should throw `FrontmatterValidationError` rather than writing
    - **Validates: Requirements 8.10, 8.11**
    - _Test file: `tests/data/frontmatter.test.ts`_


- [x] 6. Phase A — Foundation: Vault scanner and project matcher
  - [x] 6.1 Implement `src/input/matcher.ts` — `ProjectMatcher` class with trie built from project names at construction time; `match(input): Project | null` for exact match; `suggest(prefix): string[]` for prefix search returning up to 5 results; all lookups case-insensitive
    - _Requirements: 1.7, 2.7_
  - [x] 6.2 Implement `src/data/vault-scanner.ts` — `scanVault(config): Promise<ScanResult>`; lists `Projects/*/` directories, reads `README.md` in parallel with `p-limit(16)`, parses frontmatter with `gray-matter`, validates against `projectFrontmatterSchema`; adds warning entries for missing README, invalid YAML, or schema failures; builds `ProjectMatcher` trie; returns `ScanResult { projects, matcher }`
    - _Requirements: 2.1–2.7, 2.10_
  - [x] 6.3 Write property test for trie completeness
    - **Property 7: Trie Completeness** — for any set of project names used to build the trie, every name in the set should be exactly matchable by `match()`
    - **Validates: Requirements 2.7, 1.7**
    - _Test file: `tests/input/matcher.test.ts`_
  - [x] 6.4 Write unit tests for vault scanner
    - Test: missing README → warning entry; invalid YAML → warning entry; schema failure → warning entry with field name; 50 projects complete within 100ms; `ScanResult` contains both `projects` and `matcher`
    - _Requirements: 2.1–2.6, 2.10_
    - _Test file: `tests/data/vault-scanner.test.ts`_


- [x] 7. Phase A — Foundation: MCP client
  - [x] 7.1 Implement `src/mcp/types.ts` — MCP response types: `IdeaSummary`, `McpStatus`, `McpConfig`
    - _Requirements: 12.1–12.7_
  - [x] 7.2 Implement `src/mcp/client.ts` — `ObsidianMcpClient` class wrapping `@modelcontextprotocol/sdk`; `connect(config)` spawns stdio subprocess with 2-second timeout; `disconnect()` calls `client.close()`; throws `McpConnectionError` with message "MCP not connected" when a tool call is attempted without a live connection
    - _Requirements: 12.1, 12.4, 12.5, 12.6_
  - [x] 7.3 Implement `src/mcp/obsidian-client.ts` — typed wrappers: `listRecentIdeas(limit)` calls `obsidian_get_recent_changes` with `directory: "Ideas"`; `putContent(path, content)` calls `obsidian_put_content`; filters results to only items tagged `#idea`
    - _Requirements: 12.2, 12.3, 12.7_
  - [x] 7.4 Write unit tests for MCP client
    - Test: connect timeout → `McpConnectionError`; call without connect → typed error; disconnect closes subprocess
    - _Requirements: 12.5, 12.6_
    - _Test file: `tests/mcp/client.test.ts`_


- [x] 8. Phase A — Foundation: Utility modules
  - [x] 8.1 Implement `src/utils/fs.ts` — `atomicWrite(path, content)` (`.tmp.{pid}` + rename), `ensureDir(path)`, `fileExists(path)`
    - _Requirements: 2.8_
  - [x] 8.2 Implement `src/utils/paths.ts` — `opsRoot()` → `~/.devyard/`, `vaultPath(config)`, `hookPath(name)`, `skillPath(id)`, `rolePath(dept, name)`, `agentPath(name)`, `rulePath(name)`
    - _Requirements: 10.4_
  - [x] 8.3 Implement `src/utils/async.ts` — `withTimeout<T>(promise, ms)`, `retry<T>(fn, attempts)`, re-export `pLimit` from `p-limit`
    - _Requirements: 9.13, 15.3_
  - [x] 8.4 Implement `src/utils/logger.ts` — structured logger writing to `~/.devyard/logs/devyard.log` at configured level; supports `debug`, `info`, `warn`, `error`
    - _Requirements: 22.6_
  - [x] 8.5 Implement `src/data/history.ts` — `loadHistory(): string[]`, `saveHistory(entries: string[])` capped at 100 entries; quietly recreates `~/.devyard/history.json` as empty array if missing or corrupted
    - _Requirements: 1.10, 17.7_


- [x] 9. Phase A — Foundation: Doctor module (24 checks)
  - [x] 9.1 Define `src/doctor/check.ts` — `CheckResult` type (`{ id, category, label, status: 'pass'|'warn'|'fail', message?, remediation? }`), `CheckReport` type, `runDoctor(ctx, opts): Promise<CheckReport>`; run independent checks in parallel with `p-limit` and 2-second per-check timeout; exit 0 if all required checks pass, exit 1 otherwise
    - _Requirements: 9.1, 9.8, 9.9, 9.11, 9.13_
  - [x] 9.2 Implement the 24 individual check modules in `src/doctor/checks/` — env (7): Node version ≥ 20.11, `claude` binary in PATH, `config.yaml` valid, `onboarding.yaml` no placeholders, portfolio config valid, upstream version drift, `~/.devyard/` writable; vault (4): vault path exists, 9 top-level folders present, 15 schemas present, 15 templates present; integration (4): MCP installable, MCP reachable within 2s, Ollama HTTP 200, GitLab token set (warn if missing); hooks (3): 28 hooks exist + executable, Claude settings wired, audit log writable; engine (5): 49 skills present, 19 roles present, 5 agents present, 11 rules present, 7 pipelines present; deps (1): GitHub CLI authenticated
    - _Requirements: 9.2–9.7_
  - [x] 9.3 Implement `src/doctor/render.ts` — `renderReport(report)` prints Catppuccin-colored checklist using `semantic.success` (`✓`), `semantic.warning` (`!`), `semantic.error` (`✗`) per check; prints remediation instruction for each failed check
    - _Requirements: 9.1, 9.8_
  - [x] 9.4 Implement `src/doctor/hooks-deep/` — 7 synthetic check modules (D1–D7): fire synthetic bad inputs against `block-main-push.sh`, `check-secrets.sh`, `block-git-add-all.sh`, `brd-validator.sh`, `design-validator.sh`, `require-active-ticket.sh`; verify each exits non-zero; complete within 15 seconds total
    - _Requirements: 9.10, 9.12_
  - [x] 9.5 Write unit tests for doctor check result types
    - Test: `CheckResult` shape, parallel execution, 2s timeout per check, exit code mapping
    - _Requirements: 9.1, 9.8, 9.9, 9.13_
    - _Test file: `tests/doctor/check.test.ts`_


- [x] 10. Phase A — Foundation: Installer (`devyard init`)
  - [x] 10.1 Implement `src/installer/scaffold-vault.ts` — create vault skeleton: 9 top-level directories (`_System/`, `_Inbox/`, `Projects/`, `Ideas/`, `Decisions/`, `Handovers/`, `Roadmaps/`, `Stakeholder-Updates/`, `Audit-History/`), `_System/schemas/`, `_System/templates/`; idempotent (check exists before creating)
    - _Requirements: 10.3, 10.9, 10.10_
  - [x] 10.2 Implement `src/installer/copy-templates.ts` — copy 15 JSON schema files and 15 template markdown files from `assets/` to vault `_System/schemas/` and `_System/templates/`; skip if already present and correct
    - _Requirements: 10.3_
  - [x] 10.3 Implement `src/installer/write-config.ts` — read or create `~/.devyard/config.yaml` with default values; never overwrite existing correct config
    - _Requirements: 10.2, 10.9_
  - [x] 10.4 Implement `src/installer/install-hooks.ts` — create `~/.devyard/` skeleton with `logs/`; create symlinks for `roles/`, `rules/`, `skills/`, `agents/`, `hooks/`, `schemas/`, `templates/`, `workflows/` pointing to bundled `assets/`; set executable bit on all 28 hook scripts
    - _Requirements: 10.4, 10.5_
  - [x] 10.5 Implement `src/installer/merge-claude-settings.ts` — merge DevYard hook entries into `~/.claude/settings.json` without overwriting existing user content; idempotent
    - _Requirements: 10.6_
  - [x] 10.6 Implement `src/installer/install-mcp-servers.ts` — run `npx -y obsidian-mcp-server --version` to install the Obsidian MCP server
    - _Requirements: 10.7_
  - [x] 10.7 Implement `src/installer/init.ts` — `runInit(config)` orchestrates all installer steps in sequence; runs `devyard doctor` at the end and exits non-zero if any required check fails
    - _Requirements: 10.1, 10.8_
  - [x] 10.8 Write `install.sh` bootstrap script — installs pnpm, runs `pnpm install`, `pnpm build`, `pnpm link --global`, then `devyard init`
    - _Requirements: 10.1, 10.11_


- [x] 11. Phase A — Checkpoint
  - Ensure `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass
  - Run `devyard doctor` on a fresh install and verify all required checks are green
  - Ask the user if questions arise before proceeding to Phase B

- [x] 12. Phase B — Navigator: Skill resolver and launcher
  - [x] 12.1 Write 49 `assets/skills/<id>/SKILL.md` stub files — each stub must include `id`, `role`, `description`, and `usage` frontmatter fields; stubs are placeholders that will be replaced with full content in Phase C
    - _Requirements: 3.1_
  - [x] 12.2 Implement `src/skills/types.ts` — `SkillDefinition` interface (`id`, `role`, `description`, `usage`), `SkillInput` type
    - _Requirements: 3.1, 3.2_
  - [x] 12.3 Implement `src/skills/resolver.ts` — `resolveSkill(id): SkillDefinition | null`; reads `~/.devyard/skills/<id>/SKILL.md`, parses frontmatter; returns `null` for unknown IDs; validates against skill Zod schema
    - _Requirements: 3.1, 3.11_
  - [x] 12.4 Implement `src/skills/env.ts` — `buildEnv(skill, project, config): Record<string, string>`; sets all 5 required env vars: `DEVYARD_VAULT`, `DEVYARD_ROLE`, `DEVYARD_SKILL`, `DEVYARD_PROJECT` (empty string if no active project), `DEVYARD_OPS_ROOT`
    - _Requirements: 3.2, 3.3_
  - [x] 12.5 Implement `src/skills/launcher.ts` — `launchSkill(skill, project, config): Promise<number>`; pauses Ink rendering, spawns Claude Code via `execvp` with correct env and cwd; resumes Ink on child exit; throws typed error if Claude binary not found
    - _Requirements: 3.2, 3.3, 3.4, 17.6_
  - [x] 12.6 Write property test for skill environment variables
    - **Property 8: Skill Environment Variables** — for any combination of valid skill definition and optional active project, `buildEnv()` should contain all 5 required keys with non-empty string values
    - **Validates: Requirements 3.2**
    - _Test file: `tests/skills/resolver.test.ts`_
  - [x] 12.7 Write unit tests for skill resolver
    - Test: all 49 skill IDs resolvable; unknown ID returns null; `SkillNotFoundError` thrown by dispatcher; env vars all present with/without active project
    - _Requirements: 3.1, 3.11_
    - _Test file: `tests/skills/resolver.test.ts`_


- [x] 13. Phase B — Navigator: Input dispatcher and history
  - [x] 13.1 Implement `src/input/dispatcher.ts` — `dispatch(input, ctx): Promise<Action>`; classify input into `noop` (empty), `navigate` (project name match), `launch-skill` (`/` prefix + known skill), `error` (`/` prefix + unknown skill), `freeform-query` (everything else); trim whitespace before classification
    - _Requirements: 1.4–1.8, 3.11_
  - [x] 13.2 Implement `src/input/autocomplete.ts` — `getAutocompleteSuggestion(prefix, matcher): string | null`; returns top suggestion from trie prefix search; returns null if no match
    - _Requirements: 1.7, 14.2_
  - [x] 13.3 Implement `src/input/history.ts` — `navigateHistory(entries, currentIdx, direction): { entry, newIdx }`; wraps `loadHistory` and `saveHistory` from `src/data/history.ts`
    - _Requirements: 1.9, 1.10_
  - [x] 13.4 Write property tests for input dispatcher routing
    - **Property 3: Input Dispatcher — Project Navigation** — for any project name in the registry, dispatching that exact name returns a `navigate` action
    - **Property 4: Input Dispatcher — Skill Launch** — for any of the 49 skill IDs, dispatching `/<id>` returns a `launch-skill` action
    - **Property 5: Input Dispatcher — Freeform Fallback** — for any non-empty string not matching a project and not starting with `/`, dispatcher returns `freeform-query` with original trimmed text
    - **Property 6: Input Dispatcher — Unknown Skill Error** — for any `/`-prefixed string not matching a registered skill, dispatcher returns `error` action (not crash, not freeform)
    - **Validates: Requirements 1.4–1.6, 3.11**
    - _Test file: `tests/input/dispatcher.test.ts`_


- [x] 14. Phase B — Navigator: Ink TUI scaffold and panels
  - [x] 14.1 Implement `src/cli.ts` — Commander entry point; `devyard` (no args) → launch TUI; `devyard doctor` → run doctor; `devyard doctor --hooks-deep` → run doctor with deep checks; `devyard init` → run installer
    - _Requirements: 1.1, 9.1, 10.1_
  - [x] 14.2 Implement `src/app.tsx` — Ink app root; parallel startup using `Promise.allSettled([scanVault, mcpClient.connect, checkOllama, loadHistory])`; render skeleton at ~80ms; fill panels as each promise settles; provide `AppContext` with `config`, `scanResult`, `mcpStatus`, `ollamaStatus`, `history`, `skills`
    - _Requirements: 1.1, 15.1, 15.2_
  - [x] 14.3 Implement `src/panels/ProjectsPanel.tsx` — renders project list with status icons (`●`/`◌`/`▢`), tier badge, last ticket; shows `⚠` for projects with warnings; respects `show_parked_projects` and `show_archived_projects` config; uses `semantic` colors only
    - _Requirements: 1.2, 1.15, 2.4–2.6, 11.1–11.4, 21.5_
  - [x] 14.4 Implement `src/panels/StatusPanel.tsx` — renders Ollama status (online/offline with `semantic.warning` if offline), Claude binary status, active project summary; uses `semantic` colors only
    - _Requirements: 1.2, 17.3_
  - [x] 14.5 Implement `src/panels/IdeasPanel.tsx` — renders up to 5 recent ideas from MCP; shows yellow `! MCP unreachable` warning if MCP connection failed; uses `semantic` colors only
    - _Requirements: 1.2, 1.14, 12.2, 17.2_
  - [x] 14.6 Implement `src/panels/Spinner.tsx` — animated spinner using `icons.spinner` frames; configurable style from `config.ui.spinner_style`
    - _Requirements: 11.5_
  - [x] 14.7 Implement `src/panels/InputBox.tsx` — full-width input box with `surface0` border, `❯` prompt in `mauve`, placeholder in `overlay2`; implements the 7-state machine (idle → typing → autocompleting → history → submitting → dispatched → idle) using Ink's `useInput`; 30ms debounce; Up/Down history navigation; Tab autocomplete; Escape returns to idle; responds within 50ms p95
    - _Requirements: 1.3, 1.9, 14.1–14.10, 15.4_


- [x] 15. Phase B — Navigator: Screens and wiring
  - [x] 15.1 Implement `src/screens/LandingScreen.tsx` — three-panel layout (Projects left, Status top-right, Ideas bottom-right) with `InputBox` at bottom; panel widths from `config.ui.panel_widths`; panel borders `surface0`, 1-char padding; Escape from sub-screens returns here; Ctrl+C exits cleanly and persists history
    - _Requirements: 1.2, 1.3, 1.12, 1.13, 11.8_
  - [x] 15.2 Implement `src/screens/ProjectScreen.tsx` — displays repos, current branch per repo, last ticket, last session, recent decisions; renders within 200ms; Escape returns to LandingScreen
    - _Requirements: 1.11, 1.12, 15.5_
  - [x] 15.3 Wire `InputBox` → `dispatch()` → action handlers in `app.tsx`: `navigate` → render `ProjectScreen`; `launch-skill` → call `launchSkill()`; `freeform-query` → spawn Claude Code with freeform text; `error` → display error in input area; `noop` → no-op
    - _Requirements: 1.4–1.6, 1.8_
  - [x] 15.4 Implement `src/data/ollama.ts` — `checkOllama(config): Promise<OllamaStatus>`; `GET /api/tags` with `config.ollama.timeout_ms` timeout; returns `{ online: boolean }`
    - _Requirements: 9.4, 17.3_

- [x] 16. Phase B — Checkpoint
  - Ensure `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass
  - Run `devyard` and verify: landing screen renders with 3 panels, input accepts text, project navigation works, history persists across sessions, Escape returns to landing, Ctrl+C exits cleanly
  - Ask the user if questions arise before proceeding to Phase C


- [x] 17. Phase C Week 5 — First 10 skills (SKILL.md content)
  - [x] 17.1 Write full `assets/skills/status/SKILL.md` — role: `hisham`; prompt instructs Claude to read active project frontmatter and last session, summarise current branch, open tickets, and recent decisions; output to stdout
    - _Requirements: 3.1, 3.2_
  - [x] 17.2 Write full `assets/skills/inbox/SKILL.md` — role: `mariam`; prompt instructs Claude to list all `_Inbox/` vault items and open GitHub issues assigned to the user; output formatted list
    - _Requirements: 3.1_
  - [x] 17.3 Write full `assets/skills/projects/SKILL.md` — role: `khalid`; prompt instructs Claude to list all projects from vault with tier, status, last ticket, and last session
    - _Requirements: 3.1_
  - [x] 17.4 Write full `assets/skills/tasks/SKILL.md` — role: `hisham`; prompt instructs Claude to list open GitHub issues for the active project filtered by milestone or label
    - _Requirements: 3.1_
  - [x] 17.5 Write full `assets/skills/start-ticket/SKILL.md` — role: `hisham`; prompt instructs Claude to write marker file at `.claude/session/tickets/<project>` with active ticket number before any code edits; create or checkout branch matching `{type}/{TICKET-ID}-{description}`
    - _Requirements: 3.5, 18.3_
  - [x] 17.6 Write full `assets/skills/feature/SKILL.md` — role: `mariam`; prompt instructs Claude to gather feature description, write BRD to `Projects/<Name>/BRDs/<feature>.md` with `type: brd` frontmatter, then write Design to `Projects/<Name>/Designs/<feature>.md` with `linked_brd` field
    - _Requirements: 3.1, 8.4, 8.5_
  - [x] 17.7 Write full `assets/skills/bug/SKILL.md` — role: `karim`; prompt instructs Claude to create a GitHub issue with Bug type structure via Idris agent, then invoke `/start-ticket`
    - _Requirements: 3.1_
  - [x] 17.8 Write full `assets/skills/task/SKILL.md` — role: `hisham`; prompt instructs Claude to create a GitHub issue with Task type structure via Idris agent
    - _Requirements: 3.1_
  - [x] 17.9 Write full `assets/skills/idea/SKILL.md` — role: `mariam`; prompt instructs Claude to assign `IDEA-NNN` identifier, write idea to `Ideas/<title>.md` with `type: idea` frontmatter and `verdict: null`
    - _Requirements: 3.1, 8.8_
  - [x] 17.10 Write full `assets/skills/validate-idea/SKILL.md` — role: `omar`; prompt instructs Claude to evaluate the idea against market, technical, and strategic criteria; update `verdict` field to GREEN, YELLOW, or RED in idea frontmatter
    - _Requirements: 3.7_


- [x] 18. Phase C Week 6 — 19 roles, 5 agents, 11 rules
  - [x] 18.1 Write all 19 role files in `assets/roles/` — Engineering dept: `khalid.md` (Head of Engineering), `hisham.md` (Tech Lead), `karim.md` (Backend Engineer), `yasmin.md` (Frontend Engineer), `salim.md` (QA Engineer), `adel.md` (Platform Engineer), `saif.md` (SRE); Product dept: `omar.md` (Head of Product), `mariam.md` (Product Manager), `hanan.md` (Product Analyst); Design dept: `maha.md` (Head of Design), `nour.md` (UI Designer), `iman.md` (UX Designer); Security dept: `faisal.md` (Head of Security), `hakim.md` (Security Auditor), `hamza.md` (Penetration Tester); Data dept: `khalil.md` (Head of Data), `nadia.md` (Data Analyst), `anwar.md` (Data Engineer); each file defines persona, responsibilities, trigger patterns, and authority level
    - _Requirements: 4.1, 4.2_
  - [x] 18.2 Write 5 agent definition files in `assets/agents/` — `rex-code-reviewer.md`: tools `[Read, Grep, Glob, Bash(read-only)]`, `tools_denied: [Write, Edit, MultiEdit]`, writes approval marker with 40-char SHA; `hatim-security-reviewer.md`: same tool restrictions, classifies findings as CRITICAL/HIGH/MEDIUM/LOW, blocks merge on CRITICAL; `tariq-pr-manager.md`: tools `[Bash, Read, Grep, Glob]`, full PR lifecycle; `idris-ticket-manager.md`: tools `[Bash, Read]`, creates GitHub issues with required section structure; `munir-dependency-auditor.md`: tools `[Bash, Read, Grep, Glob]`, auto-creates issues for Critical/High vulns, flags GPL/AGPL licenses
    - _Requirements: 5.1–5.11_
  - [x] 18.3 Write all 11 rule files in `assets/rules/` — `ticket-vocabulary.md`, `workflow-gates.md` (6 SDLC gates), `agdr-decisions.md` (HARD STOP before arch decisions), `git-conventions.md` (branch + commit format), `parallel-work.md`, `code-standards.md` (strict TS, no bare `any`, AAA pattern, >80% coverage), `role-triggers.md`, `pr-workflow.md`, `plan-mode.md` (4+ dependent steps), `pr-quality.md`, `leak-protection.md` (scan against `private-names.yaml`)
    - _Requirements: 6.1–6.9_


- [x] 19. Phase C Week 7 — 28 hooks, audit log, hooks-deep doctor mode
  - [x] 19.1 Write shared library scripts in `assets/hooks/` — `_lib-audit-log.sh` (append record, rotate at 10MB), `_lib-detect-bash-write.sh`, `_lib-detect-deprecated-config.sh`, `_lib-extract-pr.sh`, `_lib-extract-push-ref.sh`, `_lib-multi-repo-trace.sh`, `_lib-ops-root.sh`, `_lib-portfolio-paths.sh`, `_lib-read-config.sh`, `_lib-audit-history.sh`; all libs must be sourced by hooks, not executed directly
    - _Requirements: 7.19, 7.20, 22.1, 22.2_
  - [x] 19.2 Write 6 Session Start hooks — `onboarding-check.sh`, `check-upstream-drift.sh`, `check-portfolio-config.sh`, `clear-bootstrap-marker.sh`, `clear-issue-skill-marker.sh`, `link-custom-skills.sh`; each sources `_lib-audit-log.sh` and appends audit record on every execution
    - _Requirements: 7.1–7.3, 21.2_
  - [x] 19.3 Write 5 Ticket & Workflow hooks — `require-active-ticket.sh` (blocks Write/Edit/MultiEdit/Bash-write unless marker exists, exempts `.claude/`, `docs/`, `*.md`), `require-skill-for-issue-create.sh`, `suggest-ticket-template.sh`, `require-migration-ticket.sh`, `validate-issue-structure.sh`
    - _Requirements: 7.4, 7.5, 7.23, 7.24_
  - [x] 19.4 Write 8 Git hooks — `block-git-add-all.sh`, `block-main-push.sh`, `validate-branch-name.sh` (regex `^(feat|fix|refactor|chore|test|docs|perf|spike)/[A-Z]+-\d+-[a-z0-9-]+$`), `validate-commit-format.sh` (conventional commits regex), `verify-commit-refs.sh` (validates `Closes #N` points to open issue), `check-secrets.sh` (AWS/GitHub/Slack/PEM patterns), `pre-push-gate.sh` (runs lint + typecheck + test + build), `require-agdr-for-arch-changes.sh`
    - _Requirements: 7.6–7.13_
  - [x] 19.5 Write 8 PR hooks — `auto-code-review.sh` (writes pending marker after `gh pr create`, instructs Rex invocation), `validate-pr-create.sh`, `require-agdr-for-arch-pr.sh`, `require-design-review-for-ui.sh`, `block-merge-on-red-ci.sh`, `block-unreviewed-merge.sh` (validates both SHA markers match HEAD), `warn-stale-review-markers.sh`, `block-private-refs-in-public-repos.sh`
    - _Requirements: 7.14–7.18, 7.21, 7.22_
  - [x] 19.6 Write 1 Role & Advisory hook — `detect-role-trigger.sh` (matches file path, issue label, or prompt against role trigger tables; displays advisory banner; exits 0 always)
    - _Requirements: 4.3_
  - [x] 19.7 Implement `src/hooks/audit-log.ts` — TypeScript wrapper `appendAuditLog(entry: AuditEntry): void` for use by the TypeScript layer; `AuditEntry` has `timestamp`, `hookName`, `result`, `input`
    - _Requirements: 7.19, 22.1_
  - [x] 19.8 Write property test for audit log record completeness
    - **Property 11: Audit Log Record Completeness** — for any hook execution event (hook name, result, input), the appended record should contain all 4 required fields: ISO 8601 timestamp, hook name, result (blocked/allowed), triggering input
    - **Validates: Requirements 7.19, 22.1**
    - _Test file: `tests/hooks/audit-log.test.ts`_
  - [x] 19.9 Write property test for secret pattern detection
    - **Property 12: Secret Pattern Detection** — for any string containing a known secret pattern (AWS `AKIA[0-9A-Z]{16}`, GitHub `ghp_[A-Za-z0-9]{36}`, Slack `xox[baprs]-`, PEM header), `check-secrets.sh` should exit non-zero; for strings without these patterns, exit zero
    - **Validates: Requirements 7.11, 16.1**
    - _Test file: `tests/hooks/secrets.test.ts`_
  - [x] 19.10 Write property test for SHA marker validation
    - **Property 13: SHA Marker Validation** — for any pair of SHA values where marker SHA ≠ PR HEAD SHA, `block-unreviewed-merge.sh` should block; when both SHAs match and both marker files exist, allow
    - **Validates: Requirements 7.15, 16.7**
    - _Test file: `tests/hooks/merge-guard.test.ts`_


- [x] 20. Phase C Week 7 — Checkpoint
  - Ensure all 28 hook scripts have the executable bit set
  - Run `devyard doctor` and verify the `hooks-exist` check is green
  - Run `devyard doctor --hooks-deep` and verify all 7 synthetic checks pass (D1–D7)
  - Verify audit log entries appear in `~/.devyard/logs/hook-audit.log` after hook executions
  - Ask the user if questions arise before proceeding to Week 8

- [x] 21. Phase C Week 8 — 12 decision-related skills
  - [x] 21.1 Write full `assets/skills/decide/SKILL.md` — role: `hisham`; produces AgDR at `docs/agdr/AgDR-NNNN-slug.md` with Y-statement, Context, Options, Decision, Consequences, Status sections; mirrors to `Projects/<Name>/Decisions/`
    - _Requirements: 3.6, 19.1_
  - [x] 21.2 Write full `assets/skills/agdr/SKILL.md` — role: `hisham`; supports `browse` (list all AgDRs sorted by ID), `search` (fuzzy over titles + Y-statements), `stats` (counts by status)
    - _Requirements: 19.4–19.6_
  - [x] 21.3 Write full `assets/skills/c4/SKILL.md` — role: `hisham`; generates C4 Level 1 and Level 2 diagrams as Mermaid in a Design artifact
    - _Requirements: 3.1_
  - [x] 21.4 Write full `assets/skills/dfd/SKILL.md` — role: `hisham`; generates Data Flow Diagram as Mermaid in a Design artifact
    - _Requirements: 3.1_
  - [x] 21.5 Write full `assets/skills/threat-model/SKILL.md` — role: `faisal`; generates threat model with STRIDE categories; writes to `Projects/<Name>/Designs/threat-model.md`
    - _Requirements: 3.1_
  - [x] 21.6 Write full `assets/skills/tech-vision/SKILL.md` — role: `khalid`; writes tech vision document with `type: tech-vision` frontmatter
    - _Requirements: 3.1_
  - [x] 21.7 Write full `assets/skills/write-spec/SKILL.md` — role: `mariam`; produces BRD + Design pair; validates BRD has `## Problem` section; validates Design has `linked_brd` field
    - _Requirements: 3.1, 8.12, 8.13_
  - [x] 21.8 Write full `assets/skills/migration/SKILL.md` — role: `adel`; enforces Gate 3a (active ticket with `migration` label + AgDR reference); writes migration plan
    - _Requirements: 3.1, 18.2_
  - [x] 21.9 Write full `assets/skills/spike/SKILL.md` — role: `hisham`; creates Spike GitHub issue with hypothesis, budget hours, and kill criteria
    - _Requirements: 3.1_
  - [x] 21.10 Write full `assets/skills/spike-close/SKILL.md` — role: `hisham`; PROMOTE disposition → creates new feature ticket; DISCARD disposition → writes spike memo to `Projects/<Name>/spike-memos/<slug>.md`
    - _Requirements: 3.8_
  - [x] 21.11 Write full `assets/skills/investigation/SKILL.md` — role: `saif`; creates investigation document with `type: investigation` frontmatter, `INV-NNN` ID, severity, hypotheses, and evidence
    - _Requirements: 3.1_
  - [x] 21.12 Write full `assets/skills/tickets-batch/SKILL.md` — role: `hisham`; invokes Idris agent to create multiple GitHub issues in one session from a structured list
    - _Requirements: 3.1_


- [x] 22. Phase C Week 9 — 12 review and audit skills
  - [x] 22.1 Write full `assets/skills/code-review/SKILL.md` — role: `hisham`; invokes Rex agent; Rex writes approval marker at `.claude/session/reviews/<N>-rex.approved` with 40-char HEAD SHA on approval, or posts change-request review on GitHub PR on rejection
    - _Requirements: 3.1, 5.3, 5.4, 18.3_
  - [x] 22.2 Write full `assets/skills/security-review/SKILL.md` — role: `faisal`; invokes Hatim agent; Hatim classifies findings as CRITICAL/HIGH/MEDIUM/LOW; CRITICAL findings notify Faisal role and block merge
    - _Requirements: 3.1, 5.5, 5.6_
  - [x] 22.3 Write full `assets/skills/approve-merge/SKILL.md` — role: `khalid`; writes `<N>-ceo.approved` marker with current HEAD SHA; executes `gh pr merge --squash --delete-branch`
    - _Requirements: 3.1, 18.4_
  - [x] 22.4 Write full `assets/skills/approve-design/SKILL.md` — role: `maha`; writes `<N>-design.approved` marker with current HEAD SHA for UI PRs
    - _Requirements: 3.1_
  - [x] 22.5 Write full `assets/skills/audit-deps/SKILL.md` — role: `hakim`; invokes Munir agent; Munir runs `npm audit`, auto-creates GitHub issues for Critical/High vulns, flags GPL/AGPL licenses, creates blocker issue for UNLICENSED packages
    - _Requirements: 3.1, 5.8–5.10_
  - [x] 22.6 Write full `assets/skills/launch-check/SKILL.md` — role: `khalid`; runs comprehensive pre-launch checklist; produces verdict GO/GO_WITH_WARNINGS/CONDITIONAL_GO/NO_GO; persists result to `Audit-History/launch-<date>.md` with `type: audit` frontmatter
    - _Requirements: 3.9, 8.9_
  - [x] 22.7 Write full `assets/skills/accessibility-audit/SKILL.md` — role: `iman`; audits UI for WCAG AA compliance; writes audit result to `Audit-History/accessibility-<date>.md`
    - _Requirements: 3.1_
  - [x] 22.8 Write full `assets/skills/compliance-check/SKILL.md` — role: `faisal`; checks regulatory compliance requirements; writes audit result to `Audit-History/compliance-<date>.md`
    - _Requirements: 3.1_
  - [x] 22.9 Write full `assets/skills/analytics-audit/SKILL.md` — role: `nadia`; audits analytics instrumentation coverage; writes audit result to `Audit-History/analytics-<date>.md`
    - _Requirements: 3.1_
  - [x] 22.10 Write full `assets/skills/seo-audit/SKILL.md` — role: `yasmin`; audits SEO metadata and structure; writes audit result to `Audit-History/seo-<date>.md`
    - _Requirements: 3.1_
  - [x] 22.11 Write full `assets/skills/performance-audit/SKILL.md` — role: `saif`; audits performance budgets and bottlenecks; writes audit result to `Audit-History/performance-<date>.md`
    - _Requirements: 3.1_
  - [x] 22.12 Write full `assets/skills/monitoring-audit/SKILL.md` — role: `saif`; audits monitoring coverage (alerts, dashboards, on-call); writes audit result to `Audit-History/monitoring-<date>.md`
    - _Requirements: 3.1_


- [x] 23. Phase C Week 10 — Remaining 15 skills
  - [x] 23.1 Write full `assets/skills/roadmap/SKILL.md` — role: `omar`; generates roadmap document with `type: roadmap` frontmatter, audience field, and milestone timeline
    - _Requirements: 3.1_
  - [x] 23.2 Write full `assets/skills/stakeholder-update/SKILL.md` — role: `mariam`; generates stakeholder update with `type: stakeholder-update` frontmatter, audience, cadence, period fields
    - _Requirements: 3.1_
  - [x] 23.3 Write full `assets/skills/process/SKILL.md` — role: `khalid`; documents an engineering process as a structured markdown file
    - _Requirements: 3.1_
  - [x] 23.4 Write full `assets/skills/journey/SKILL.md` — role: `iman`; maps user journey with stages, touchpoints, and pain points
    - _Requirements: 3.1_
  - [x] 23.5 Write full `assets/skills/fan-out/SKILL.md` — role: `hisham`; spawns at most 5 concurrent sub-agents via Claude Code's Agent tool for parallel work
    - _Requirements: 3.12_
  - [x] 23.6 Write full `assets/skills/docs-audit/SKILL.md` — role: `hisham`; audits documentation coverage and freshness; writes audit result to `Audit-History/docs-<date>.md`
    - _Requirements: 3.1_
  - [x] 23.7 Write full `assets/skills/release/SKILL.md` — role: `khalid`; bumps semver version, updates `CHANGELOG.md`, creates release PR
    - _Requirements: 3.1, 18.5_
  - [x] 23.8 Write full `assets/skills/setup/SKILL.md` — role: `adel`; scaffolds a new project repo with DevYard conventions (branch protection, CI, labels, milestones)
    - _Requirements: 3.1_
  - [x] 23.9 Write full `assets/skills/handover/SKILL.md` — role: `khalid`; produces `handover-assessment.md` in project vault folder; registers project in `~/.devyard/projects.yaml`
    - _Requirements: 3.1, 18.7_
  - [x] 23.10 Write full `assets/skills/update/SKILL.md` — role: `hisham`; updates project frontmatter fields (status, tier, last_branch, last_ticket) in vault README
    - _Requirements: 3.1_
  - [x] 23.11 Write full `assets/skills/split-portfolio/SKILL.md` — role: `khalid`; creates public and private repos, migrates existing content, updates `~/.devyard/config.yaml` with new roots
    - _Requirements: 3.1, 21.4_
  - [x] 23.12 Write full `assets/skills/onboard/SKILL.md` — role: `khalid`; redirects user to `/setup` or `/handover` and displays deprecation notice
    - _Requirements: 3.10_
  - [x] 23.13 Write full `assets/skills/extract-features/SKILL.md` — role: `hanan`; generates `feature-inventory.md` with `type: feature-inventory` frontmatter by scanning HTTP routes, data models, async jobs, test names, UI screens, and documented features
    - _Requirements: 3.1_
  - [x] 23.14 Write full `assets/skills/debug/SKILL.md` — role: `karim`; structured debugging session: hypothesis, evidence gathering, root cause, fix, regression test
    - _Requirements: 3.1_
  - [x] 23.15 Write full `assets/skills/cli-builder/SKILL.md` — role: `karim`; scaffolds a new CLI tool with Commander, argument parsing, help text, and tests
    - _Requirements: 3.1_


- [x] 24. Phase C Week 10 — 7 CI pipeline YAML files and workflow documents
  - [x] 24.1 Write 7 golden-path CI pipeline YAML files in `assets/golden-paths/pipelines/` — `node-api.yml`, `react-app.yml`, `python-service.yml`, `go-service.yml`, `rust-service.yml`, `docker-build.yml`, `release.yml`; each must be a valid GitHub Actions workflow ready to drop into `.github/workflows/`; include lint, typecheck, test, build, and coverage steps
    - _Requirements: 18.9, 23.5_
  - [x] 24.2 Write 3 workflow documents in `assets/workflows/` — `sdlc.md` (7-phase SDLC from idea to handover), `code-review.md` (Rex + human review responsibilities), `deployment.md` (11-stage deployment pipeline)
    - _Requirements: 18.8_

- [x] 25. Phase C — Checkpoint
  - Ensure `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass
  - Run `devyard doctor` and verify all engine checks are green (49 skills, 19 roles, 5 agents, 11 rules, 7 pipelines)
  - Run a full SDLC flow end-to-end: `/idea` → `/validate-idea` → `/feature` → `/start-ticket` → `/code-review` → `/approve-merge` → `/launch-check`
  - Ask the user if questions arise before proceeding to Phase D


- [x] 26. Phase D — Hardening: Performance pass
  - [x] 26.1 Instrument cold start timeline in `src/app.tsx` — add `performance.now()` markers at process start, config load, skeleton render, vault scan complete, panels filled; log to `devyard.log` in debug mode; verify cold start ≤ 500ms averaged over 10 runs
    - _Requirements: 15.1, 15.2_
  - [x] 26.2 Instrument vault scanner in `src/data/vault-scanner.ts` — log scan duration; verify 50 projects complete within 100ms on warm cache; if over budget, profile and optimize (reduce per-file overhead, tune `p-limit` concurrency)
    - _Requirements: 15.3_
  - [x] 26.3 Instrument keystroke latency in `src/panels/InputBox.tsx` — measure time from `useInput` callback to state update; verify p95 ≤ 50ms; if over budget, check for unnecessary re-renders and memoize expensive computations
    - _Requirements: 15.4_
  - [x] 26.4 Instrument project navigation in `src/screens/ProjectScreen.tsx` — measure time from navigation action to screen render; verify ≤ 200ms; optimize frontmatter reads if needed
    - _Requirements: 15.5_
  - [x] 26.5 Instrument skill launcher in `src/skills/launcher.ts` — measure time from `launchSkill()` call to `execvp` spawn; verify ≤ 500ms; pre-resolve all paths at startup if needed
    - _Requirements: 15.6_
  - [x] 26.6 Verify doctor run time — run `devyard doctor` 3 times and confirm all 24 checks complete within 5 seconds; run `devyard doctor --hooks-deep` and confirm within 15 seconds
    - _Requirements: 15.8, 15.9_


- [x] 27. Phase D — Hardening: Fresh install testing and final validation
  - [x] 27.1 Run `install.sh` on a clean macOS environment (or a clean user account) — verify the full sequence (pnpm install → build → link → `devyard init`) completes without errors and `devyard doctor` exits 0 with all required checks green; total time must be under 15 minutes
    - _Requirements: 10.1, 10.11, 23.1_
  - [x] 27.2 Run `devyard doctor --hooks-deep` and verify all 7 deep checks (D1–D7) are green — force-push blocked, AWS key pattern blocked, `git add -A` blocked, `git push origin main` blocked, BRD with empty `## Problem` blocked, Design without `linked_brd` blocked, edit without active ticket blocked
    - _Requirements: 9.10, 23.4_
  - [x] 27.3 Run `/launch-check` against the DevYard repository itself — verify the verdict is GO; fix any blockers or warnings found; persist the audit result to `Audit-History/launch-devyard-<date>.md`
    - _Requirements: 3.9, 23.4_
  - [x] 27.4 Write `README.md` for the DevYard repository — cover installation, quick start, the four-layer model, skill catalog, and contribution guide; write `CHANGELOG.md` with v1.0 entry
    - _Requirements: 23.4_
  - [x] 27.5 Create the `v1.0` git tag — bump `package.json` version to `1.0.0`, update `CHANGELOG.md`, run `/release` skill to create the release PR, merge after Rex + human approval
    - _Requirements: 23.4_

- [x] 28. Final checkpoint — Ensure all tests pass
  - Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` — all must pass
  - Run `devyard doctor` — all required checks green
  - Run `devyard doctor --hooks-deep` — all 7 deep checks green
  - Ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all property-based and unit tests are optional sub-tasks
- Each task references specific requirements for traceability
- Checkpoints (tasks 11, 16, 20, 25, 28) ensure incremental validation at each phase boundary
- Property tests use Vitest + fast-check with a minimum of 100 iterations per property
- All 13 correctness properties from the design are covered by property test sub-tasks (Properties 1–13)
- The four build phases map directly to the four task groups: Phase A (tasks 1–11), Phase B (tasks 12–16), Phase C (tasks 17–25), Phase D (tasks 26–28)
- Hook scripts are bash; all other implementation is TypeScript strict-mode ESM
- UI components must import from `theme/semantic.ts` and `theme/icons.ts` only — never from `theme/catppuccin.ts` directly

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "4.2", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 3, "tasks": ["2.4", "3.3", "4.3", "4.4", "5.1", "8.5"] },
    { "id": 4, "tasks": ["2.5", "3.4", "5.2", "5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "7.1"] },
    { "id": 6, "tasks": ["6.3", "6.4", "7.2", "9.1"] },
    { "id": 7, "tasks": ["7.3", "7.4", "9.2", "9.3"] },
    { "id": 8, "tasks": ["9.4", "9.5", "10.1", "10.2", "10.3"] },
    { "id": 9, "tasks": ["10.4", "10.5", "10.6"] },
    { "id": 10, "tasks": ["10.7", "10.8"] },
    { "id": 11, "tasks": ["12.1", "12.2"] },
    { "id": 12, "tasks": ["12.3", "12.4"] },
    { "id": 13, "tasks": ["12.5", "13.1", "13.2", "13.3"] },
    { "id": 14, "tasks": ["12.6", "12.7", "13.4", "14.1"] },
    { "id": 15, "tasks": ["14.2", "14.3", "14.4", "14.5", "14.6"] },
    { "id": 16, "tasks": ["14.7", "15.4"] },
    { "id": 17, "tasks": ["15.1", "15.2"] },
    { "id": 18, "tasks": ["15.3"] },
    { "id": 19, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6", "17.7", "17.8", "17.9", "17.10"] },
    { "id": 20, "tasks": ["18.1", "18.2", "18.3"] },
    { "id": 21, "tasks": ["19.1"] },
    { "id": 22, "tasks": ["19.2", "19.3", "19.4", "19.5", "19.6"] },
    { "id": 23, "tasks": ["19.7", "19.8", "19.9", "19.10"] },
    { "id": 24, "tasks": ["21.1", "21.2", "21.3", "21.4", "21.5", "21.6", "21.7", "21.8", "21.9", "21.10", "21.11", "21.12"] },
    { "id": 25, "tasks": ["22.1", "22.2", "22.3", "22.4", "22.5", "22.6", "22.7", "22.8", "22.9", "22.10", "22.11", "22.12"] },
    { "id": 26, "tasks": ["23.1", "23.2", "23.3", "23.4", "23.5", "23.6", "23.7", "23.8", "23.9", "23.10", "23.11", "23.12", "23.13", "23.14", "23.15"] },
    { "id": 27, "tasks": ["24.1", "24.2"] },
    { "id": 28, "tasks": ["26.1", "26.2", "26.3", "26.4", "26.5", "26.6"] },
    { "id": 29, "tasks": ["27.1", "27.2", "27.3"] },
    { "id": 30, "tasks": ["27.4"] },
    { "id": 31, "tasks": ["27.5"] }
  ]
}
```
