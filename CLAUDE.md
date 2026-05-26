# DevYard — Claude Code Project Guide

## Project Overview

DevYard is a single-user, terminal-based personal engineering OS built in TypeScript. It runs on macOS, presents a Catppuccin Mocha-styled TUI, and orchestrates a complete SDLC through AI personas (roles), deterministic safety hooks, and 49 slash-command skills. Claude Code is the LLM engine; an Obsidian vault is the single source of truth.

---

## Kiro Development Lifecycle

This project uses Kiro's **requirements-first** workflow. Every task follows these steps in order — do not skip any step.

### Step 1 — Read the Task

Open `.kiro/specs/devyard/tasks.md` and locate the task. Read the full task description including all subtasks and their `_Requirements:` references.

### Step 2 — Read the Requirements

Open `.kiro/specs/devyard/requirements.md`. Read every requirement section referenced by the task (e.g., `_Requirements: 2.1–2.7` means read Requirement 2 acceptance criteria 1–7).

### Step 3 — Read the Design

Open `.kiro/specs/devyard/design.md`. Find the module or section that covers the task's implementation area and read the relevant spec. The design is authoritative on interfaces, naming, and behavior.

### Step 4 — Implement

Write the code exactly as the task, requirements, and design specify. Do not add features, abstractions, or behaviors beyond what is specified.

### Step 5 — Test

- Run `pnpm typecheck` — must produce no errors.
- Run `pnpm lint` — must produce no errors or unfixed warnings.
- Run `pnpm test` — all tests must pass.
- If the task includes a test subtask, write those tests before marking done.
- **Smoke-test every module live** using `node --import tsx/esm --input-type=module` or a dedicated script. Unit tests alone are not sufficient — each public function must be exercised against real inputs (real filesystem, real data) to confirm it actually works, not just that it compiles. Specific checks required:
  - Every exported function called with realistic args and the output verified.
  - Edge cases that are hard to unit-test (missing files, bad inputs, error paths) exercised by hand.
  - Any file-system side effects (created dirs, symlinks, written files) inspected directly with `ls`/`cat`.
  - Do not mark a task done if any function has only been typecheck-verified but never actually run.

### Step 6 — Mark the Task Done

Update `.kiro/specs/devyard/tasks.md`: change `[ ]` → `[x]` for every completed subtask and the parent task. Use `[~]` for in-progress.

---

## Spec File Locations

| File | Purpose |
|------|---------|
| `.kiro/specs/devyard/requirements.md` | Acceptance criteria — the *what* |
| `.kiro/specs/devyard/design.md` | Technical design — the *how* |
| `.kiro/specs/devyard/tasks.md` | Implementation plan — the *sequence* |

---

## Code Standards

All code is TypeScript strict-mode ESM. These constraints are non-negotiable.

### TypeScript

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`
- No bare `any` — use `unknown` + narrowing
- No `@ts-ignore` or `@ts-expect-error` without an accompanying comment explaining the unavoidable constraint
- Target: `ES2022`; module: `ESNext`; moduleResolution: `Bundler`
- All imports use the `.js` extension (ESM requirement), e.g., `import { x } from './foo.js'`

### Module Rules

- UI components import from `theme/semantic.ts` and `theme/icons.ts` only — never from `theme/catppuccin.ts`
- `theme/catppuccin.ts` is internal; never re-export it
- `theme/index.ts` re-exports `semantic` and `icons` only

### Style

- Linter: Biome (`pnpm lint` runs `biome check --write .`)
- No trailing comments that explain *what* the code does — only *why* when non-obvious
- No multi-line docblocks; one short inline comment max

### Testing

- Framework: Vitest + fast-check
- Property tests: minimum 100 iterations per property
- Test files live in `tests/<module>/` mirroring `src/<module>/`
- Test file naming: `<subject>.test.ts`

---

## Commands

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # biome check --write .
pnpm test        # vitest run
pnpm build       # tsup
pnpm dev         # tsx watch
```

All four must pass before marking any task complete.

---

## Directory Structure

```
src/
  config/       # Config loader, types, defaults
  data/         # Frontmatter, vault scanner, history, schemas, types
  doctor/       # 24-check health system
  hooks/        # TypeScript audit-log wrapper
  input/        # Dispatcher, autocomplete, history, matcher
  installer/    # devyard init steps
  mcp/          # Obsidian MCP client
  panels/       # Ink TUI panels (ProjectsPanel, StatusPanel, IdeasPanel, InputBox, Spinner)
  screens/      # LandingScreen, ProjectScreen
  skills/       # Skill resolver, env builder, launcher
  theme/        # catppuccin (internal), semantic, icons, index
  utils/        # fs, paths, async, logger

assets/
  schemas/      # 15 JSON Schema draft-07 files
  templates/    # 15 markdown template files
  skills/       # 49 SKILL.md files
  roles/        # 19 role persona files
  agents/       # 5 agent definition files
  rules/        # 11 rule files
  hooks/        # 28 bash hook scripts + shared libs
  golden-paths/ # 7 CI pipeline YAMLs
  workflows/    # 3 workflow documents

tests/          # Mirrors src/ structure
.kiro/specs/devyard/  # Kiro spec files (do not edit during implementation)
```

---

## Key Design Decisions

- **Atomic writes** always use `.tmp.{pid}` + rename — never write directly to the target path.
- **Color** always flows through `semantic` tokens — never use hex values directly in components.
- **Concurrency** for vault scanning: `p-limit(16)` — respect this limit.
- **MCP timeout**: 2 seconds for connection; throw `McpConnectionError` with message "MCP not connected" on any tool call without a live connection.
- **Config tokens**: config file never stores API tokens; tokens come from environment variables only.
- **History**: capped at 100 entries in `~/.devyard/history.json`; silently recreate as `[]` if missing or corrupted.
- **Doctor**: run checks in parallel with `p-limit`; 2-second timeout per check; exit 0 only if all required checks pass.
- **Hooks**: exit 2 to block the tool call; exit 0 to allow; always append audit record via `_lib-audit-log.sh`.

---

## Phase Map

| Phase | Tasks | Weeks |
|-------|-------|-------|
| A — Foundation | 1–11 | 1–4 |
| B — Navigator | 12–16 | 4–5 |
| C — Engine | 17–25 | 5–10 |
| D — Hardening | 26–28 | 11–12 |

Complete Phase A fully (all tasks green, `pnpm test` passing, `devyard doctor` green) before starting Phase B.
