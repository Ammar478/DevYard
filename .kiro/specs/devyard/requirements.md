# Requirements Document

## Introduction

DevYard is a single-user, terminal-based personal engineering operating system built in TypeScript. It runs on macOS, presents a TUI control plane styled with the Catppuccin Mocha theme, and orchestrates a complete software-development lifecycle through structured AI personas (roles), deterministic safety hooks, and a library of 49 slash-command skills. The system integrates with Claude Code as its LLM engine, an Obsidian vault as the single source of truth for all artifacts, Ollama for local model status, and GitHub via the `gh` CLI.

DevYard solves seven compounding frictions for a solo developer: context loss when switching projects, lack of a unified launcher, state fragmentation across tools, workflow inconsistency from AI-assisted shortcuts, decision amnesia, review skipping under time pressure, and launch surprises from missing monitoring or security review.

The build is organized into four phases over 12 weeks: Phase A (Foundation), Phase B (Navigator), Phase C (Engine), and Phase D (Hardening).

---

## Glossary

- **DevYard**: The personal engineering OS described in this document.
- **TUI**: Terminal User Interface — the Ink + React terminal rendering layer.
- **Vault**: The Obsidian vault at `~/Documents/DevYard-Vault/` (configurable) that is the single source of truth for all artifacts.
- **Skill**: A markdown-defined slash command (`/feature`, `/bug`, etc.) that orchestrates a workflow via Claude Code.
- **Role**: A markdown persona file that shapes Claude Code's behavior for a specific engineering function.
- **Agent**: A restricted sub-Claude process (Rex, Hatim, Tariq, Idris, Munir) invoked by Claude Code via its Agent tool; cannot write or edit code.
- **Hook**: A deterministic bash script wired to Claude Code's `PreToolUse`, `PostToolUse`, or `SessionStart` events; exit 2 blocks the tool call.
- **Rule**: A markdown behavioral constraint loaded into every Claude Code session as advisory guidance.
- **AgDR**: Agent Decision Record — a structured markdown file capturing one technical decision under `docs/agdr/AgDR-NNNN-slug.md`.
- **Marker**: A file under `.claude/session/` that records workflow state (active ticket, review approval with SHA).
- **Doctor**: The `devyard doctor` health-check command that verifies all 24 required system conditions.
- **Installer**: The `devyard init` idempotent setup command plus the `install.sh` bootstrap script.
- **Ops Root**: The `~/.devyard/` directory containing config, logs, and symlinks to bundled assets.
- **MCP**: Model Context Protocol — the stdio protocol DevYard uses to communicate with the Obsidian MCP server.
- **Catppuccin_Mocha**: The locked color palette used for all UI surfaces.
- **Semantic_Token**: A named color role (e.g., `semantic.success`) that maps to a Catppuccin palette hex value.
- **Input_Dispatcher**: The module that classifies user input into project navigation, skill launch, or freeform query.
- **Vault_Scanner**: The module that reads `Projects/*/README.md` in parallel and builds the in-memory project registry.
- **Frontmatter_Module**: The module that reads and atomically writes YAML frontmatter in vault markdown files.
- **Skill_Launcher**: The module that spawns Claude Code via `execvp` with the correct environment variables.
- **MCP_Client**: The typed wrapper around `@modelcontextprotocol/sdk` for communicating with the Obsidian MCP server.
- **SDLC**: Software Development Lifecycle — the end-to-end flow from idea to handover enforced by DevYard.
- **Y_Statement**: The AgDR summary format: "In the context of X, facing Y, we chose Z because A, accepting B."
- **Artifact**: Any structured document DevYard reads or writes: BRD, design, AgDR, session, idea, handover, etc.
- **Stage**: Position in the SDLC pipeline recorded in artifact frontmatter.
- **Tier**: Project priority level — P0, P1, or P2.
- **LaunchVerdict**: The outcome of `/launch-check` — GO, GO_WITH_WARNINGS, CONDITIONAL_GO, or NO_GO.
- **IdeaVerdict**: The outcome of `/validate-idea` — GREEN, YELLOW, or RED.
- **SpikeDisposition**: The outcome of `/spike-close` — PROMOTE or DISCARD.
- **Severity**: Finding severity level — CRITICAL, HIGH, MEDIUM, or LOW.

---

## Requirements

### Requirement 1: Launch and Navigation

**User Story:** As a developer, I want to open DevYard with a single command and immediately see my full engineering surface, so that I can re-enter any project context in under 5 seconds.

#### Acceptance Criteria

1. WHEN the user runs `devyard` with no arguments, THE TUI SHALL render the landing screen within 500ms of process start.
2. THE TUI SHALL display three panels on the landing screen: a Projects panel on the left, a Status panel on the top-right, and an Ideas panel on the bottom-right.
3. THE TUI SHALL render a persistent input box at the bottom of the landing screen across all screens.
4. WHEN the user types a project name in the input box, THE Input_Dispatcher SHALL navigate to that project's view.
5. WHEN the user types a string beginning with `/` in the input box, THE Input_Dispatcher SHALL resolve and launch the matching skill.
6. WHEN the user types a string that does not match a project name and does not begin with `/`, THE Input_Dispatcher SHALL forward the text to Claude Code as a freeform query.
7. WHEN the user types a partial project name, THE TUI SHALL display a fuzzy-matched autocomplete suggestion using a trie built at scan time.
8. WHEN the user types a skill name, THE Input_Dispatcher SHALL match it strictly against the 49 registered skill identifiers.
9. WHEN the user presses the Up or Down arrow key in the input box, THE TUI SHALL navigate the input history.
10. THE TUI SHALL persist the last 100 input history entries across sessions in `~/.devyard/history.json`.
11. WHEN the user selects a project, THE TUI SHALL display the project view showing repos, current branch per repo, last ticket, last session, and recent decisions within 200ms.
12. WHEN the user presses Escape from any sub-screen, THE TUI SHALL return to the landing screen.
13. WHEN the user presses Ctrl+C, THE TUI SHALL exit cleanly and persist the current input history.
14. IF the Obsidian MCP server is unreachable at launch, THEN THE TUI SHALL display a yellow warning in the Ideas panel and continue rendering all other panels.
15. IF a project's `README.md` contains malformed frontmatter, THEN THE Vault_Scanner SHALL include that project in the Projects panel with a yellow `⚠` warning indicator rather than omitting it.

### Requirement 2: Vault Scanner and Frontmatter

**User Story:** As a developer, I want DevYard to read my Obsidian vault and build an accurate project registry at startup, so that all project data is current without manual refresh.

#### Acceptance Criteria

1. WHEN DevYard starts, THE Vault_Scanner SHALL read only the `README.md` file from each directory under `Projects/` in the vault, using up to 16 parallel reads.
2. THE Vault_Scanner SHALL complete scanning 50 projects within 100ms on a warm filesystem cache.
3. WHEN a project `README.md` is read, THE Frontmatter_Module SHALL parse its YAML frontmatter using `gray-matter` and validate it against the `project` Zod schema.
4. IF a project `README.md` is missing, THEN THE Vault_Scanner SHALL add a warning entry for that project rather than throwing an error.
5. IF a project `README.md` contains invalid YAML, THEN THE Vault_Scanner SHALL add a warning entry describing the parse failure rather than throwing an error.
6. IF a project `README.md` has valid YAML but fails schema validation, THEN THE Vault_Scanner SHALL add a warning entry listing the missing or invalid fields.
7. WHEN the Vault_Scanner completes, THE TUI SHALL build a trie of all project names for use by the autocomplete system.
8. WHEN the Frontmatter_Module writes an update to a vault file, THE Frontmatter_Module SHALL use an atomic write via a `.tmp.{pid}` intermediate file followed by a rename.
9. FOR ALL valid project frontmatter objects, parsing then serializing then parsing THE Frontmatter_Module SHALL produce an equivalent object (round-trip property).
10. THE Vault_Scanner SHALL expose the project array and the name-matching trie as its return value.

### Requirement 3: Skills Catalog (49 Skills)

**User Story:** As a developer, I want a complete library of slash-command skills covering every SDLC phase, so that I can invoke any workflow from a single entry point without remembering separate commands.

#### Acceptance Criteria

1. THE Skill_Launcher SHALL make all 49 skills available as slash commands: `/status`, `/inbox`, `/projects`, `/tasks`, `/roadmap`, `/stakeholder-update`, `/feature`, `/bug`, `/task`, `/spike`, `/spike-close`, `/investigation`, `/idea`, `/validate-idea`, `/tickets-batch`, `/migration`, `/start-ticket`, `/write-spec`, `/decide`, `/agdr`, `/c4`, `/dfd`, `/threat-model`, `/tech-vision`, `/process`, `/journey`, `/fan-out`, `/code-review`, `/security-review`, `/approve-merge`, `/approve-design`, `/audit-deps`, `/launch-check`, `/accessibility-audit`, `/compliance-check`, `/analytics-audit`, `/seo-audit`, `/performance-audit`, `/monitoring-audit`, `/docs-audit`, `/release`, `/setup`, `/handover`, `/update`, `/split-portfolio`, `/onboard`, `/extract-features`, `/debug`, `/cli-builder`.
2. WHEN the user invokes a skill, THE Skill_Launcher SHALL spawn Claude Code via `execvp` with the environment variables `DEVYARD_VAULT`, `DEVYARD_ROLE`, `DEVYARD_SKILL`, `DEVYARD_PROJECT`, and `DEVYARD_OPS_ROOT` set.
3. WHEN a skill is launched, THE Skill_Launcher SHALL set the working directory to the active project's root directory, or to `process.cwd()` if no project is active.
4. WHEN Claude Code is spawned for a skill, THE TUI SHALL pause Ink rendering and resume it when the child process exits.
5. WHEN the user invokes `/start-ticket`, THE Skill_Launcher SHALL write a marker file at `.claude/session/tickets/<project>` containing the active ticket number before any code edits are permitted.
6. WHEN the user invokes `/decide`, THE Skill_Launcher SHALL produce an AgDR file at `docs/agdr/AgDR-NNNN-slug.md` in the active project repo and mirror it to `Projects/<Name>/Decisions/` in the vault.
7. WHEN the user invokes `/validate-idea`, THE Skill_Launcher SHALL update the `verdict` field in the idea's frontmatter to GREEN, YELLOW, or RED.
8. WHEN the user invokes `/spike-close` with disposition PROMOTE, THE Skill_Launcher SHALL create a new feature ticket; WHEN disposition is DISCARD, THE Skill_Launcher SHALL write a spike memo to `Projects/<Name>/spike-memos/<slug>.md`.
9. WHEN the user invokes `/launch-check`, THE Skill_Launcher SHALL produce a verdict of GO, GO_WITH_WARNINGS, CONDITIONAL_GO, or NO_GO and persist the result to `Audit-History/launch-<date>.md`.
10. WHEN the user invokes `/onboard`, THE Skill_Launcher SHALL redirect the user to `/setup` or `/handover` and display a deprecation notice.
11. WHEN the user invokes an unknown skill (a `/`-prefixed string not in the 49-skill registry), THE Input_Dispatcher SHALL display an error message identifying the unknown skill name.
12. WHEN the user invokes `/fan-out`, THE Skill_Launcher SHALL spawn at most 5 concurrent sub-agents via Claude Code's Agent tool.

### Requirement 4: Roles (19 AI Personas)

**User Story:** As a developer, I want Claude Code to adopt the correct engineering persona for each workflow, so that responses reflect the right domain expertise and authority level.

#### Acceptance Criteria

1. THE Skill_Launcher SHALL load the role file matching the skill's declared `role` field from `~/.devyard/roles/<dept>/<name>.md` before spawning Claude Code.
2. THE DevYard SHALL provide all 19 role files: Khalid (Head of Engineering), Hisham (Tech Lead), Karim (Backend Engineer), Yasmin (Frontend Engineer), Salim (QA Engineer), Adel (Platform Engineer), Saif (SRE), Omar (Head of Product), Mariam (Product Manager), Hanan (Product Analyst), Maha (Head of Design), Nour (UI Designer), Iman (UX Designer), Faisal (Head of Security), Hakim (Security Auditor), Hamza (Penetration Tester), Khalil (Head of Data), Nadia (Data Analyst), Anwar (Data Engineer).
3. WHEN the `detect-role-trigger.sh` hook fires and a file path, issue label, or prompt matches a role's trigger table, THE Hook SHALL display an advisory banner suggesting the matching role without blocking the tool call.
4. WHEN the user explicitly states "act as <role name>" in a prompt, THE Claude_Code_Session SHALL adopt that role for the remainder of the session.
5. WHEN two roles produce conflicting guidance, THE DevYard SHALL treat the reviewer role's guidance as authoritative, and THE DevYard SHALL log any override to `_System/override-log.md` in the vault.
6. WHERE the portfolio is in split mode, THE Skill_Launcher SHALL resolve role files from the private sibling repo's custom-skills directory via the `link-custom-skills.sh` hook.

### Requirement 5: Agents (5 Restricted Sub-Processes)

**User Story:** As a developer, I want specialized sub-agents for code review, security review, PR management, ticket management, and dependency auditing, so that these tasks are handled by focused, constrained processes that cannot accidentally modify code.

#### Acceptance Criteria

1. THE DevYard SHALL provide 5 agent definition files: `rex-code-reviewer.md`, `hatim-security-reviewer.md`, `tariq-pr-manager.md`, `idris-ticket-manager.md`, `munir-dependency-auditor.md`.
2. THE Rex_Agent SHALL be restricted to Read, Grep, Glob, and Bash (read-only) tools and SHALL NOT have access to Write, Edit, or MultiEdit tools.
3. WHEN Rex completes a code review and approves a PR, THE Rex_Agent SHALL write a marker file at `.claude/session/reviews/<N>-rex.approved` containing the 40-character HEAD commit SHA on a single line.
4. WHEN Rex completes a code review and requests changes, THE Rex_Agent SHALL post a review on the GitHub PR with change requests and SHALL NOT write an approval marker.
5. THE Hatim_Agent SHALL be restricted to Read, Grep, Glob, and Bash (read-only) tools and SHALL classify each finding as CRITICAL, HIGH, MEDIUM, or LOW severity.
6. WHEN Hatim finds a CRITICAL severity issue, THE Hatim_Agent SHALL notify the Faisal role and block the merge.
7. THE Idris_Agent SHALL be restricted to Bash and Read tools and SHALL create GitHub issues with the required section structure for each ticket type (Feature, Bug, Task, Spike, Migration, Investigation).
8. THE Munir_Agent SHALL be restricted to Bash, Read, Grep, and Glob tools and SHALL automatically create a GitHub issue labeled `security` for every Critical or High vulnerability found.
9. WHEN Munir finds a package with a GPL or AGPL license, THE Munir_Agent SHALL flag it for legal review in the audit report.
10. WHEN Munir finds a package with an UNLICENSED license, THE Munir_Agent SHALL create a GitHub issue with the `blocker` label.
11. THE Tariq_Agent SHALL coordinate the full PR lifecycle: verify active ticket, run pre-push gate, push branch, create PR, invoke Rex, notify human for approval, verify SHA match, merge, update ticket to Done.

### Requirement 6: Rules (11 Behavioral Laws)

**User Story:** As a developer, I want a set of behavioral rules loaded into every Claude Code session, so that the AI consistently follows my engineering standards without requiring me to repeat them.

#### Acceptance Criteria

1. THE DevYard SHALL provide all 11 rule files: `ticket-vocabulary.md`, `workflow-gates.md`, `agdr-decisions.md`, `git-conventions.md`, `parallel-work.md`, `code-standards.md`, `role-triggers.md`, `pr-workflow.md`, `plan-mode.md`, `pr-quality.md`, `leak-protection.md`.
2. WHEN a Claude Code session starts, THE Claude_Code_Session SHALL load all 11 rule files as advisory behavioral constraints.
3. THE `ticket-vocabulary.md` rule SHALL define that `#N` and `Ticket` refer only to real GitHub issues, and plan items SHALL use `Step`, `Task`, `Item`, or plain bullets.
4. THE `workflow-gates.md` rule SHALL define 6 sequential SDLC gates: Validated Idea, Approved Spec, Active Ticket (with sub-gate 3a for migrations), PR Ready, Merge Ready, and Launch Ready.
5. THE `agdr-decisions.md` rule SHALL require a HARD STOP and `/decide` invocation before any technical decision, library choice, or architecture change.
6. THE `git-conventions.md` rule SHALL require branch names matching `{type}/{TICKET-ID}-{description}` and commit messages matching `type[(scope)]: subject`.
7. THE `code-standards.md` rule SHALL require TypeScript strict mode, no bare `any`, AAA test pattern, and greater than 80% domain code coverage.
8. THE `plan-mode.md` rule SHALL require entering plan mode when a task has 4 or more dependent steps, an unclear path, hard-to-reverse actions, or cross-file refactoring.
9. THE `leak-protection.md` rule SHALL prevent private project names from appearing in public-repo issues or PRs by scanning against `~/.devyard/private-names.yaml`.

### Requirement 7: Hooks (28 Deterministic Enforcement Scripts)

**User Story:** As a developer, I want deterministic bash hooks wired to Claude Code's tool events, so that unsafe actions are blocked regardless of what the AI decides to do.

#### Acceptance Criteria

1. THE DevYard SHALL provide all 28 hook scripts in `~/.devyard/hooks/` with the executable bit set.
2. WHEN a hook exits with code 2, THE Claude_Code_Session SHALL block the tool call and display the hook's stderr message to the user.
3. WHEN a hook exits with code 0, THE Claude_Code_Session SHALL allow the tool call to proceed.
4. THE `require-active-ticket.sh` hook SHALL block Write, Edit, MultiEdit, and Bash write operations unless a marker file exists at `.claude/session/tickets/<project>`, exempting paths under `.claude/`, `docs/`, `*.md`, and bootstrap markers.
5. THE `require-skill-for-issue-create.sh` hook SHALL block `gh issue create` commands unless the `active-issue-skill` marker exists or `APEXYARD_ALLOW_RAW_TICKET_CREATE=1` is set.
6. THE `block-git-add-all.sh` hook SHALL block `git add -A`, `git add .`, and `git add --all` commands.
7. THE `block-main-push.sh` hook SHALL block `git push` to main, master, dev, and develop branches.
8. THE `validate-branch-name.sh` hook SHALL block `git push` when the branch name does not match `^(feat|fix|refactor|chore|test|docs|perf|spike)/[A-Z]+-\d+-[a-z0-9-]+$`.
9. THE `validate-commit-format.sh` hook SHALL block `git commit` when the commit message does not match `^(feat|fix|refactor|chore|test|docs|perf|spike|build|ci)(\([^)]+\))?:\s.+$`.
10. THE `verify-commit-refs.sh` hook SHALL block `git commit` when a `Closes #N` or `Fixes #N` reference points to a non-existent or closed GitHub issue.
11. THE `check-secrets.sh` hook SHALL block `git commit` when the staged diff contains patterns matching AWS keys, GitHub tokens, Slack tokens, or private key headers.
12. THE `pre-push-gate.sh` hook SHALL block `git push` when any of `pnpm lint`, `pnpm typecheck`, `pnpm test`, or `pnpm build` exits with a non-zero code.
13. THE `require-agdr-for-arch-changes.sh` hook SHALL block `git commit` when staged files include architecture paths and the commit message does not contain an `AgDR-\d+` reference to an existing file.
14. THE `validate-pr-create.sh` hook SHALL block `gh pr create` when the PR title does not match the required pattern, the body lacks `## Testing` or `## Glossary` sections, or the `Closes #N` ticket is not open.
15. THE `block-unreviewed-merge.sh` hook SHALL block `gh pr merge` unless both `<N>-rex.approved` and `<N>-ceo.approved` marker files exist and their recorded SHAs match the PR's current HEAD SHA.
16. THE `block-merge-on-red-ci.sh` hook SHALL block `gh pr merge` when any CI check for the PR is in a failing, pending, or cancelled state.
17. THE `require-design-review-for-ui.sh` hook SHALL block `gh pr merge` when the PR touches UI file paths and no `<N>-design.approved` marker exists with a SHA matching the PR HEAD.
18. THE `block-private-refs-in-public-repos.sh` hook SHALL block `gh issue create`, `gh pr create`, `gh issue comment`, and `gh pr comment` when the target repo is public and the body contains names from `~/.devyard/private-names.yaml`.
19. WHEN any hook fires, THE Hook SHALL append a record containing timestamp, hook name, result, and input to `~/.devyard/logs/hook-audit.log`.
20. THE `_lib-audit-log.sh` library SHALL rotate `hook-audit.log` when it reaches 10MB.
21. THE `warn-stale-review-markers.sh` hook SHALL warn or delete review marker files whose recorded SHA no longer matches the PR HEAD after a `git push`.
22. THE `auto-code-review.sh` hook SHALL write a pending marker at `.claude/session/reviews/<N>-pending` after `gh pr create` and instruct Claude Code to invoke Rex immediately.
23. THE `validate-issue-structure.sh` hook SHALL block `gh issue create` when the issue body is missing required sections for its declared type (Feature, Bug, Task, Spike, Migration, or Investigation).
24. THE `require-migration-ticket.sh` hook SHALL block edits to migration paths unless the active ticket has the `migration` label and an `AgDR-NNNN` reference in its body.

### Requirement 8: Vault Schema and Artifact Management

**User Story:** As a developer, I want all my engineering artifacts stored in a structured Obsidian vault with validated frontmatter, so that every document is human-readable, version-controllable, and queryable without DevYard.

#### Acceptance Criteria

1. THE Vault SHALL maintain the following top-level directory structure: `_System/`, `_Inbox/`, `Projects/`, `Ideas/`, `Decisions/`, `Handovers/`, `Roadmaps/`, `Stakeholder-Updates/`, and `Audit-History/`.
2. THE Vault SHALL store 15 JSON schema files in `_System/schemas/` covering: project, brd, design, agdr, tasks, session, idea, handover, roadmap, stakeholder-update, investigation, spike-memo, feature-inventory, tech-vision, and audit.
3. THE Vault SHALL store 15 template markdown files in `_System/templates/` with one template per artifact type.
4. WHEN a skill writes a BRD artifact, THE Skill SHALL place it at `Projects/<Name>/BRDs/<feature>.md` with `type: brd` frontmatter.
5. WHEN a skill writes a Design artifact, THE Skill SHALL place it at `Projects/<Name>/Designs/<feature>.md` with `type: design` frontmatter and a `linked_brd` field referencing the associated BRD.
6. WHEN a skill writes an AgDR, THE Skill SHALL place it at `docs/agdr/AgDR-NNNN-slug.md` in the project repo and mirror it to `Projects/<Name>/Decisions/` in the vault.
7. WHEN a skill writes a Session artifact, THE Skill SHALL place it at `Projects/<Name>/Sessions/<date>-<topic>.md` with `type: session` frontmatter.
8. WHEN a skill writes an Idea artifact, THE Skill SHALL assign it a unique `IDEA-NNN` identifier and place it at `Ideas/<title>.md`.
9. WHEN a skill writes an Audit artifact, THE Skill SHALL place it at `Audit-History/<audit-name>-<date>.md` with `type: audit` frontmatter including `verdict`, `blocker_count`, and `warning_count` fields.
10. THE Frontmatter_Module SHALL validate every written artifact against its corresponding Zod schema before writing.
11. IF frontmatter validation fails on write, THEN THE Frontmatter_Module SHALL throw a typed error identifying the failing field rather than writing invalid data.
12. THE `brd-validator.sh` hook SHALL block skill output when a BRD file is missing required sections such as `## Problem`.
13. THE `design-validator.sh` hook SHALL block skill output when a Design file is missing the `linked_brd` frontmatter field.

### Requirement 9: Doctor Health Checks

**User Story:** As a developer, I want a `devyard doctor` command that verifies every dependency and integration, so that I can diagnose and fix setup problems before they interrupt my workflow.

#### Acceptance Criteria

1. WHEN the user runs `devyard doctor`, THE Doctor SHALL execute all 24 required checks and display a Catppuccin-colored checklist with pass (`✓`), warn (`!`), or fail (`✗`) indicators.
2. THE Doctor SHALL check the following environment conditions: Node.js version is 20.11 or higher, the `claude` binary is present in PATH, and `~/.devyard/config.yaml` parses and validates against the Config Zod schema.
3. THE Doctor SHALL check the following vault conditions: the configured vault path exists and is a directory, all 9 top-level vault folders are present, all 15 schema files are present in `_System/schemas/`, and all 15 template files are present in `_System/templates/`.
4. THE Doctor SHALL check the following integration conditions: the Obsidian MCP server is installable via `npx -y obsidian-mcp-server --version`, the MCP server responds to a connect-list-disconnect cycle within 2 seconds, Ollama responds to `GET /api/tags` with HTTP 200, and the GitLab token environment variable is set (optional, warns if missing).
5. THE Doctor SHALL check the following hooks conditions: all 28 hook scripts exist in `~/.devyard/hooks/` with the executable bit set, `~/.claude/settings.json` contains DevYard hook entries, and `~/.devyard/logs/` is writable.
6. THE Doctor SHALL check the following engine conditions: all 49 skill files are present at `~/.devyard/skills/<id>/SKILL.md`, all 19 role files are present, all 5 agent files are present, all 11 rule files are present, and all 7 pipeline YAML files are present.
7. THE Doctor SHALL check the following system conditions: `~/.devyard/onboarding.yaml` contains no placeholder values, the portfolio config is valid for the configured mode, the local DevYard version matches the upstream latest tag, and `~/.devyard/` and the vault path are writable.
8. WHEN any required check fails, THE Doctor SHALL display a remediation instruction for that check and exit with a non-zero status code.
9. WHEN all required checks pass, THE Doctor SHALL exit with status code 0.
10. WHEN the user runs `devyard doctor --hooks-deep`, THE Doctor SHALL additionally fire 7 synthetic bad inputs against high-stakes hooks and verify each exits with a non-zero code: force-push to main, content containing a known AWS key pattern, `git add -A`, `git push origin main`, a BRD with an empty `## Problem` section, a Design without `linked_brd`, and an edit without an active ticket marker.
11. THE Doctor SHALL complete the full 24-check run within 5 seconds.
12. WHEN the user runs `devyard doctor --hooks-deep`, THE Doctor SHALL complete within 15 seconds.
13. THE Doctor SHALL run each check in parallel where checks are independent, capping each individual check at 2 seconds.

### Requirement 10: Installer and Bootstrap

**User Story:** As a developer, I want a one-command installer that takes a fresh macOS machine to a fully working DevYard environment in under 15 minutes, so that setup is never a barrier to starting work.

#### Acceptance Criteria

1. WHEN the user runs `install.sh`, THE Installer SHALL install pnpm, run `pnpm install`, run `pnpm build`, run `pnpm link --global`, and then run `devyard init` in sequence.
2. WHEN the user runs `devyard init`, THE Installer SHALL read or create `~/.devyard/config.yaml` with default values.
3. WHEN the user runs `devyard init`, THE Installer SHALL create the vault skeleton with all 9 top-level directories, `_System/templates/`, and `_System/schemas/` if they do not already exist.
4. WHEN the user runs `devyard init`, THE Installer SHALL create the `~/.devyard/` skeleton with `logs/`, and symlinks for `roles/`, `rules/`, `skills/`, `agents/`, `hooks/`, `schemas/`, `templates/`, and `workflows/` pointing to the bundled assets.
5. WHEN the user runs `devyard init`, THE Installer SHALL set the executable bit on all 28 hook scripts.
6. WHEN the user runs `devyard init`, THE Installer SHALL merge DevYard hook entries into `~/.claude/settings.json` without overwriting existing user content.
7. WHEN the user runs `devyard init`, THE Installer SHALL install the Obsidian MCP server.
8. WHEN the user runs `devyard init`, THE Installer SHALL run `devyard doctor` and exit with a non-zero status code if any required check fails, displaying the remediation instructions.
9. THE `devyard init` command SHALL be idempotent: running it multiple times SHALL NOT overwrite existing correct configuration or destroy existing vault content.
10. WHEN `devyard init` checks whether a step is needed, THE Installer SHALL verify "exists and correct" before acting rather than unconditionally overwriting.
11. THE complete first-time setup from a fresh macOS machine SHALL reach a `devyard doctor` all-green state within 15 minutes.

### Requirement 11: Theme — Catppuccin Mocha

**User Story:** As a developer, I want a consistent, locked visual identity across the entire TUI, so that the interface is immediately recognizable and never requires theme decisions.

#### Acceptance Criteria

1. THE TUI SHALL use only Catppuccin Mocha palette colors for all visible surfaces.
2. THE Theme_Module SHALL expose colors exclusively through semantic token names (e.g., `semantic.success`, `semantic.error`) and SHALL NOT expose raw hex values to UI components.
3. WHEN a UI component needs a color, THE Component SHALL import from `theme/semantic.ts` or `theme/icons.ts` only, never from `theme/catppuccin.ts` directly.
4. THE Theme_Module SHALL map the following semantic roles: `focus`/`selection`/`prompt` to `mauve`, `success` to `green`, `warning` to `yellow`, `error` to `red`, `info` to `sapphire`, `inProgress` to `peach`, `parked` to `pink`, `project` to `blue`, `code` to `teal`, `highlight` to `sky`, `body` to `text`, `secondary` to `subtext1`, `muted` to `subtext0`, `placeholder` to `overlay2`, `disabled` to `overlay1`, `background` to `base`, `panelBg` to `mantle`, `outerBg` to `crust`, `border` to `surface0`, `divider` to `overlay0`, `hoverBg` to `surface2`, `selectedBg` to `surface1`.
5. THE TUI SHALL use Unicode-only icons with no Nerd Font dependency: `●` for active projects, `◌` for parked, `▢` for archived, `✓` for approved/pass, `◐` for draft, `✗` for blocked/fail, `❯` for the input prompt, `▶` for selection, `!` for warnings, and `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` for spinner frames.
6. THE TUI SHALL render selected rows with `surface1` background, `text` foreground, and a `▶` prefix in `mauve`.
7. THE TUI SHALL render the input box full-width with a `surface0` border, `❯` prompt in `mauve`, and placeholder text in `overlay2`.
8. THE TUI SHALL render panel borders as single-line `surface0` with 1-character padding inside.
9. WHILE the Catppuccin Mocha theme is active, THE TUI SHALL meet WCAG AA contrast ratio (4.5:1) for all color combinations used together.
10. THE TUI SHALL never convey information by color alone; every color signal SHALL be accompanied by an icon or label.

### Requirement 12: MCP Client and Obsidian Integration

**User Story:** As a developer, I want DevYard to read and write vault content through the Obsidian MCP server, so that the Ideas panel and artifact writes are always in sync with my vault.

#### Acceptance Criteria

1. WHEN DevYard starts, THE MCP_Client SHALL spawn the Obsidian MCP server as a stdio subprocess using the command and arguments from `config.yaml`.
2. WHEN the MCP server is connected, THE MCP_Client SHALL call `obsidian_get_recent_changes` with `directory: "Ideas"` and `limit: 5` to populate the Ideas panel.
3. WHEN a skill writes an idea artifact, THE MCP_Client SHALL call `obsidian_put_content` with the target path and markdown content.
4. WHEN DevYard exits, THE MCP_Client SHALL call `client.close()` to disconnect from the MCP server.
5. IF the MCP server fails to respond within 2 seconds during startup, THEN THE MCP_Client SHALL mark the connection as failed and THE TUI SHALL display a yellow warning in the Ideas panel.
6. IF the MCP server is not connected when a tool call is attempted, THEN THE MCP_Client SHALL throw a typed error with the message "MCP not connected" rather than silently failing.
7. THE MCP_Client SHALL only display ideas tagged with `#idea` in the Ideas panel.

### Requirement 13: Configuration System

**User Story:** As a developer, I want a single YAML configuration file that controls all DevYard behavior, so that I can customize paths, performance budgets, and integrations without modifying source code.

#### Acceptance Criteria

1. THE Config_Loader SHALL read `~/.devyard/config.yaml` at startup and validate it against the Config Zod schema.
2. THE Config_Loader SHALL provide default values for all optional configuration fields when they are absent from the file.
3. THE Config_Loader SHALL support the following top-level sections: `vault` (path, obsidian_app), `ollama` (url, timeout_ms), `claude` (binary, default_role), `mcp` (obsidian command/args/env), `ui` (panel_widths, show_parked_projects, show_archived_projects, spinner_style), `performance` (cold_start_budget_ms, keystroke_budget_ms, vault_scan_budget_ms, hook_budget_ms), `logging` (level, path), `env` (github_token_var, gitlab_token_var), and `portfolio` (mode, public_root, private_root).
4. THE Config_Loader SHALL never read GitHub or GitLab tokens from `config.yaml`; tokens SHALL be read from environment variables named by `env.github_token_var` and `env.gitlab_token_var`.
5. IF `config.yaml` fails YAML parsing or Zod validation, THEN THE Config_Loader SHALL display the specific failing field and a suggested fix, then exit with a non-zero status code.
6. WHERE the portfolio mode is `split`, THE Config_Loader SHALL require both `public_root` and `private_root` to be non-null resolvable paths.

### Requirement 14: Input Box State Machine

**User Story:** As a developer, I want a responsive input box with autocomplete and history navigation, so that I can invoke any skill or navigate to any project with minimal keystrokes.

#### Acceptance Criteria

1. THE Input_Box SHALL debounce keystrokes by 30ms before triggering autocomplete evaluation.
2. WHEN the user's input matches a project name prefix, THE Input_Box SHALL transition to the `autocompleting` state and display the top fuzzy-match suggestion.
3. WHEN the user presses Tab while in the `autocompleting` state, THE Input_Box SHALL complete the input to the suggested project name.
4. WHEN the user presses Escape while in the `autocompleting` state, THE Input_Box SHALL return to the `idle` state and clear the suggestion.
5. WHEN the user presses the Up arrow key while typing, THE Input_Box SHALL transition to the `history` state and display the most recent history entry.
6. WHEN the user presses Up or Down while in the `history` state, THE Input_Box SHALL navigate through the history entries.
7. WHEN the user presses Enter while in the `typing`, `history`, or `autocompleting` state, THE Input_Box SHALL transition to the `submitting` state and pass the input to the Input_Dispatcher.
8. WHEN the Input_Dispatcher resolves the action, THE Input_Box SHALL transition to the `dispatched` state and then return to `idle` after the action completes.
9. THE Input_Box SHALL respond to keystrokes within 50ms at the 95th percentile.
10. WHEN the user submits an empty input, THE Input_Dispatcher SHALL return a `noop` action without navigating or launching anything.

### Requirement 15: Performance Budgets

**User Story:** As a developer, I want DevYard to meet strict performance budgets for all operations, so that the tool never adds latency to my workflow.

#### Acceptance Criteria

1. THE TUI SHALL render the first paint of the landing screen within 500ms of the `devyard` process starting.
2. THE TUI SHALL render a skeleton layout within 80ms and fill panels asynchronously as data arrives.
3. THE Vault_Scanner SHALL complete scanning 50 projects within 100ms on a warm filesystem cache.
4. THE Input_Box SHALL respond to keystrokes within 50ms at the 95th percentile.
5. WHEN the user navigates to a project view, THE TUI SHALL render the project view within 200ms.
6. WHEN the user invokes a skill, THE Skill_Launcher SHALL complete the `execvp` spawn within 500ms before Claude Code takes over.
7. WHEN a hook fires, THE Hook SHALL complete execution within 200ms at the 95th percentile.
8. WHEN the user runs `devyard doctor`, THE Doctor SHALL complete all 24 checks within 5 seconds.
9. WHEN the user runs `devyard doctor --hooks-deep`, THE Doctor SHALL complete within 15 seconds.
10. IF the Ink TUI keystroke latency exceeds 80ms at the 95th percentile after 2 weeks of use, THEN THE DevYard SHALL fall back to an fzf-based plain stdout interface.

### Requirement 16: Security and Secret Protection

**User Story:** As a developer, I want DevYard to prevent secrets from leaking into repos and block destructive git operations, so that I never accidentally expose credentials or corrupt my main branch.

#### Acceptance Criteria

1. THE `check-secrets.sh` hook SHALL scan every staged diff for patterns matching AWS access keys, GitHub personal access tokens, Slack tokens, and PEM private key headers before allowing `git commit`.
2. THE `block-main-push.sh` hook SHALL block all `git push` commands targeting main, master, dev, or develop branches.
3. THE `block-private-refs-in-public-repos.sh` hook SHALL scan issue and PR bodies for names listed in `~/.devyard/private-names.yaml` before allowing creation in public repositories.
4. THE Config_Loader SHALL never write GitHub or GitLab tokens to `~/.devyard/config.yaml`; tokens SHALL only be read from environment variables.
5. WHEN a hook fires, THE Hook SHALL append an audit record to `~/.devyard/logs/hook-audit.log` regardless of whether the hook blocked or allowed the action.
6. WHEN a reviewer override occurs (reviewer role overruled), THE DevYard SHALL log the override event to `_System/override-log.md` in the vault.
7. THE `block-unreviewed-merge.sh` hook SHALL validate that the SHA in each approval marker matches the current PR HEAD SHA, preventing approval of a stale commit from being used to merge a newer commit.
8. THE DevYard SHALL restrict all 5 agents to read-only tool access, preventing any agent from writing or editing code files.

### Requirement 17: Reliability and Error Handling

**User Story:** As a developer, I want DevYard to degrade gracefully when external services are unavailable, so that a single integration failure never blocks my entire workflow.

#### Acceptance Criteria

1. IF a TUI panel throws a render error, THEN THE TUI SHALL display an error state in that panel and continue rendering all other panels without crashing.
2. IF the Obsidian MCP server is unreachable at startup, THEN THE TUI SHALL degrade the Ideas panel to show a warning and SHALL NOT block the launch or other panels.
3. IF Ollama is unreachable, THEN THE TUI SHALL display an offline indicator in the Status panel in yellow and SHALL NOT block the launch.
4. IF a project's frontmatter is malformed, THEN THE Vault_Scanner SHALL include the project with a `⚠` warning indicator rather than omitting it or crashing.
5. IF a hook script is missing or not executable, THEN THE Doctor SHALL report a red failure for the `hooks-exist` check and display the remediation instruction.
6. IF the Claude binary is not found in PATH, THEN THE Skill_Launcher SHALL display a red error message and SHALL NOT attempt to spawn a process.
7. IF `~/.devyard/history.json` is corrupted or missing, THEN THE TUI SHALL quietly recreate it as an empty array and continue without displaying an error.
8. IF GitHub API calls are rate-limited, THEN THE TUI SHALL display a warning in the affected panels and continue rendering with cached data.
9. WHEN a hook script exits with a non-zero code that is not 2, THE Claude_Code_Session SHALL surface the error to the user rather than silently swallowing it.

### Requirement 18: SDLC Workflow Enforcement

**User Story:** As a developer, I want the full SDLC pipeline enforced end-to-end from idea to handover, so that no phase is skipped and every artifact is produced in the right order.

#### Acceptance Criteria

1. THE DevYard SHALL enforce 6 sequential SDLC gates: Gate 1 (Validated Idea with GREEN or YELLOW verdict), Gate 2 (Approved Spec with `status: approved` BRD), Gate 3 (Active Ticket with branch containing ticket ID), Gate 4 (PR Ready with passing tests, coverage above 80%, and AgDR linked if decisions were made), Gate 5 (Merge Ready with Rex approval, human approval, green CI, and design approval for UI changes), and Gate 6 (Launch Ready with `/launch-check` returning GO).
2. WHEN a migration is part of a feature, THE DevYard SHALL enforce Gate 3a: the active ticket must have the `migration` label and an AgDR reference before any migration file edits are permitted.
3. WHEN the user invokes `/code-review`, THE Skill_Launcher SHALL invoke the Rex agent and SHALL NOT allow the merge until Rex has written an approval marker with the current HEAD SHA.
4. WHEN the user invokes `/approve-merge`, THE Skill_Launcher SHALL write a `<N>-ceo.approved` marker containing the current HEAD SHA and then execute `gh pr merge --squash --delete-branch`.
5. WHEN the user invokes `/release`, THE Skill_Launcher SHALL bump the semver version, update `CHANGELOG.md`, and create a release PR.
6. THE `auto-code-review.sh` hook SHALL trigger Rex review on every `git push` to a PR branch, not only on explicit `/code-review` invocation.
7. WHEN the user invokes `/handover`, THE Skill_Launcher SHALL produce a `handover-assessment.md` in the project vault folder and register the project in `~/.devyard/projects.yaml`.
8. THE 3 workflow documents (`sdlc.md`, `code-review.md`, `deployment.md`) SHALL be present in `~/.devyard/workflows/` and SHALL describe the 7-phase SDLC, code review responsibilities, and the 11-stage deployment pipeline respectively.
9. THE 7 golden-path CI pipeline YAML files SHALL be present in `~/.devyard/golden-paths/pipelines/` and SHALL be ready to drop into `.github/workflows/` in any DevYard-managed project.

### Requirement 19: AgDR (Agent Decision Records)

**User Story:** As a developer, I want every technical decision automatically captured as an AgDR, so that I never lose the context behind an architecture choice six months later.

#### Acceptance Criteria

1. WHEN the user invokes `/decide`, THE Skill_Launcher SHALL produce an AgDR file at `docs/agdr/AgDR-NNNN-slug.md` in the active project repo with the required sections: Y-statement, Context, Options, Decision, Consequences, and Status.
2. THE `require-agdr-for-arch-changes.sh` hook SHALL block `git commit` when staged files include architecture paths (`src/architecture/`, `src/domain/`, `infrastructure/`) and the commit message does not contain an `AgDR-\d+` reference to an existing file in `docs/agdr/`.
3. THE `require-agdr-for-arch-pr.sh` hook SHALL block `gh pr create` when changed files intersect architecture paths and the PR body does not contain an `AgDR-\d+` reference.
4. WHEN the user invokes `/agdr` with the `browse` operation, THE Skill_Launcher SHALL display all AgDR files sorted by ID.
5. WHEN the user invokes `/agdr` with the `search` operation, THE Skill_Launcher SHALL perform a fuzzy search over AgDR titles and Y-statements.
6. WHEN the user invokes `/agdr` with the `stats` operation, THE Skill_Launcher SHALL display counts by status (proposed, accepted, deprecated, superseded).
7. THE AgDR frontmatter SHALL include: `id` (AgDR-NNNN format), `title`, `type: agdr`, `status` (proposed/accepted/deprecated/superseded), `date`, `supersedes`, `superseded_by`, `context_tags`, and `y_statement`.

### Requirement 20: Toolchain and Build System

**User Story:** As a developer, I want a well-defined TypeScript toolchain with strict type checking, fast builds, and a comprehensive test suite, so that the DevYard codebase itself meets the same quality standards it enforces on other projects.

#### Acceptance Criteria

1. THE DevYard SHALL use TypeScript 5.4 or higher with the following compiler options enabled: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, and `jsx: react-jsx`.
2. THE DevYard SHALL use Node.js 20.11.0 LTS as specified in `.nvmrc`.
3. THE DevYard SHALL use pnpm 9 or higher as the package manager.
4. THE DevYard SHALL use tsup as the bundler and tsx as the development runner.
5. THE DevYard SHALL use Biome 1.8 or higher for linting and formatting.
6. THE DevYard SHALL use Vitest 1.6 or higher for the test suite.
7. THE DevYard SHALL use ESM-only modules (`"type": "module"` in `package.json`).
8. THE DevYard SHALL use the following runtime dependencies: Ink 5, React 18, `@modelcontextprotocol/sdk`, `yaml`, `gray-matter`, `fuse.js`, `zod`, `ajv`, `commander`.
9. THE DevYard SHALL provide Vitest tests for the data layer covering: frontmatter parsing and round-trip, vault scanning, input dispatcher, and skill resolver.
10. THE DevYard SHALL provide a `pnpm build` command that produces a distributable in `dist/` and a `pnpm link --global` command that makes `devyard` available as a global CLI command.
11. THE DevYard SHALL provide a `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` command that all pass before any PR is merged.

### Requirement 21: Portfolio and Project Management

**User Story:** As a developer, I want to manage multiple projects across single and split-portfolio modes, so that I can keep personal and professional work cleanly separated while using the same DevYard instance.

#### Acceptance Criteria

1. THE DevYard SHALL support two portfolio modes: `single` (one vault, one ops root) and `split` (public framework repo plus private sibling repo).
2. WHEN the portfolio mode is `split`, THE `link-custom-skills.sh` hook SHALL symlink private custom skills from the private sibling repo into `.claude/skills/` at session start.
3. WHEN the portfolio mode is `split`, THE `block-private-refs-in-public-repos.sh` hook SHALL prevent private project names from appearing in public-repo issues and PRs.
4. WHEN the user invokes `/split-portfolio`, THE Skill_Launcher SHALL create the public and private repos, migrate existing content, and update `~/.devyard/config.yaml` with the new roots.
5. THE Projects panel SHALL display active projects by default and SHALL hide parked and archived projects unless `show_parked_projects` or `show_archived_projects` is set to `true` in config.
6. WHEN the user invokes `/handover` with a repo URL, THE Skill_Launcher SHALL clone or reference the repo, generate a `handover-assessment.md`, and register the project in `~/.devyard/projects.yaml`.
7. THE project frontmatter SHALL track: `name`, `type: project`, `status` (created/active/parked/archived), `tier` (P0/P1/P2), `repos` (git URLs), `last_branch`, `last_ticket`, `last_session`, `stack`, `created`, and `team`.

### Requirement 22: Audit Logging and Observability

**User Story:** As a developer, I want a complete audit trail of all hook executions and skill invocations, so that I can review what DevYard did and detect any silent breakage.

#### Acceptance Criteria

1. WHEN any hook fires, THE Hook SHALL append a record to `~/.devyard/logs/hook-audit.log` containing the timestamp, hook name, result (blocked/allowed), and the triggering input.
2. THE `_lib-audit-log.sh` library SHALL rotate `hook-audit.log` when the file size reaches 10MB.
3. WHEN the user runs `devyard doctor --hooks-deep`, THE Doctor SHALL verify that the audit log is writable and that recent hook executions appear in the log.
4. WHEN an audit skill completes (e.g., `/launch-check`, `/accessibility-audit`), THE Skill_Launcher SHALL persist the audit result to `Audit-History/<audit-name>-<date>.md` with `type: audit` frontmatter including `verdict`, `blocker_count`, and `warning_count`.
5. THE `_lib-audit-history.sh` library SHALL be used by all 8 audit skills to write consistent audit history entries.
6. THE DevYard SHALL write application logs to `~/.devyard/logs/devyard.log` at the configured log level (debug, info, warn, or error).
7. THE DevYard SHALL write doctor run results to `~/.devyard/logs/doctor.log`.

### Requirement 23: Phased Build Plan

**User Story:** As a developer, I want the DevYard build organized into four verifiable phases, so that each phase produces a runnable system and progress is measurable.

#### Acceptance Criteria

1. WHEN Phase A (Foundation, Weeks 1–2) is complete, THE DevYard SHALL pass `devyard doctor` with all required checks green on a fresh install, covering: Doctor module, theme module, MCP client, Vault_Scanner, Frontmatter_Module, installer skeleton, and all 15 JSON schemas.
2. WHEN Phase B (Navigator, Weeks 3–4) is complete, THE DevYard SHALL open the landing screen with 3 panels, accept input, navigate to project views, and persist history, verifiable by running `devyard` and interacting with the TUI.
3. WHEN Phase C (Engine, Weeks 5–10) is complete, THE DevYard SHALL support all 49 skills, 19 roles, 5 agents, 11 rules, 28 hooks, and 7 CI pipeline templates, verifiable by running a full SDLC flow end-to-end.
4. WHEN Phase D (Hardening, Weeks 11–12) is complete, THE DevYard SHALL meet all performance budgets, pass `devyard doctor --hooks-deep` with all 7 deep checks green, and `/launch-check` SHALL return GO when run against the DevYard repository itself.
5. THE Phase C engine build SHALL proceed in weekly increments: Week 5 (first 10 skills), Week 6 (19 roles + 5 agents + 11 rules), Week 7 (28 hooks + audit log), Week 8 (12 decision-related skills), Week 9 (12 review and audit skills), Week 10 (remaining 15 skills + 7 CI pipelines).

