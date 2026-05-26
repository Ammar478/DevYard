# Changelog

All notable changes to DevYard are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). DevYard uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-05-26

Initial release of DevYard — a personal engineering OS built in TypeScript.

### Added

**Phase A — Foundation**
- Theme module: Catppuccin Mocha palette with semantic token indirection
- Configuration loader with Zod validation and safe defaults
- 14 frontmatter entity types (project, brd, design, agdr, tasks, session, idea, handover, roadmap, stakeholder-update, investigation, spike-memo, feature-inventory, audit) with atomic write support
- Vault scanner scanning `Projects/*/README.md` in parallel with `p-limit(16)`
- Trie-based project name matcher for O(k) autocomplete lookups
- Obsidian MCP client with 2-second connection timeout and typed error handling
- Doctor module with 24 health checks across env, vault, integration, hooks, engine, and deps categories
- Installer (`devyard init`) that scaffolds vault, symlinks assets, wires Claude Code hooks, and runs `devyard doctor` on completion
- Bootstrap script (`install.sh`) for one-command fresh setup

**Phase B — Navigator**
- Ink + React TUI with LandingScreen (3-panel layout), ProjectScreen, InputBox, Spinner
- InputBox 7-state machine: idle → typing → autocompleting → history → submitting → dispatched → idle
- Input dispatcher classifying input as navigate / launch-skill / freeform-query / error / noop
- History persistence in `~/.devyard/history.json`, capped at 100 entries

**Phase C — Engine**
- 49 slash-command skills covering the full SDLC
- 19 role persona files (Engineering, Product, Design, Security, Data departments)
- 5 restricted sub-agent definitions (Rex, Hatim, Tariq, Idris, Munir)
- 11 behavioral rule files loaded into every Claude Code session
- 28 deterministic bash hook scripts for session-start, ticket/workflow, git, PR, and role enforcement
- Shared hook libraries (`_lib-audit-log.sh` with 10MB rotation, `_lib-audit-history.sh`, etc.)
- Audit log wrapper (`src/hooks/audit-log.ts`) for the TypeScript layer
- 7 golden-path CI pipeline YAML files (node-api, react-app, python-service, go-service, rust-service, docker-build, release)
- 3 workflow documents (sdlc, code-review, deployment)

**Phase D — Hardening**
- Performance instrumentation: `performance.now()` markers at process-start, config-loaded, skeleton-render, vault-scan-complete, panels-filled; flushed to `devyard.log` in debug mode
- Vault scanner logs scan duration per run
- InputBox measures keystroke latency (p95 ≤ 50ms) via `useLayoutEffect`
- ProjectScreen measures navigation render latency (≤ 200ms)
- Skill launcher logs time-to-spawn for each skill invocation
- Doctor async MCP install check (no longer blocks event loop; respects 2s per-check timeout)
- `devyard doctor` completes 24 checks within 5s; `--hooks-deep` within 15s
- `README.md` and `CHANGELOG.md`

### Architecture

- **Language**: TypeScript 5.4+ strict-mode ESM
- **Runtime**: Node.js 20.11.0 LTS
- **TUI**: Ink 5 + React 18 with Catppuccin Mocha theme
- **LLM engine**: Claude Code (spawned via `execvp`, never called directly)
- **Vault**: Obsidian Markdown vault via MCP stdio protocol
- **Testing**: Vitest 1.6 + fast-check property-based tests (129 tests, 13 correctness properties)
- **Linting/formatting**: Biome 1.8
- **Build**: tsup

### Performance

All budgets verified on this release:
- Cold start to first paint: ≤ 500ms (parallel I/O; skeleton at ~80ms)
- Vault scan 50 projects: ≤ 100ms on warm cache
- Doctor full run: ~2.3s (budget: 5s)
- Doctor `--hooks-deep`: ~2.3s (budget: 15s; all 7 deep checks pass)
