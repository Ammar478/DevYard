---
name: code-standards
type: behavioral-rule
scope: all-sessions
---

# Rule: Code Standards

All TypeScript code in DevYard projects must comply with these standards. The pre-push gate (`pnpm lint && pnpm typecheck`) enforces them automatically.

## TypeScript Requirements

- **Strict mode**: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`
- **No bare `any`**: Use `unknown` + type narrowing. `any` is a compile error.
- **No `@ts-ignore`**: Never suppress TypeScript errors without a comment explaining the unavoidable constraint
- **ESM imports**: All imports use the `.js` extension — `import { x } from './foo.js'`
- **Target**: ES2022; module: ESNext; moduleResolution: Bundler

## Test Standards

- Framework: Vitest + fast-check
- **Pattern**: Arrange, Act, Assert (AAA) — every test follows this structure
- **Coverage**: Greater than 80% for domain code (src/)
- **Property tests**: Minimum 100 iterations per property
- **No mocked databases**: Integration tests hit real databases; mock divergence has caused production failures

## Comment Standards

- Default: no comments
- Allowed: one short inline comment when the WHY is non-obvious (hidden constraint, subtle invariant, workaround for a specific bug)
- Forbidden: comments that explain WHAT the code does, multi-paragraph docblocks, multi-line comment blocks

## Module Import Rules

- UI components import from `theme/semantic.ts` and `theme/icons.ts` only
- Never import from `theme/catppuccin.ts` in components — it is internal
- `theme/index.ts` re-exports `semantic` and `icons` only

## Atomic Writes

All file writes must use the atomic write pattern:
1. Write to `.tmp.{pid}` intermediate path
2. Rename to the target path

Never write directly to the target file. This prevents partial-write corruption.

## Concurrency

Vault scanning uses `p-limit(16)`. Do not change this limit without an AgDR. Respect the limit in all parallel file operations.

## Error Handling

- Validate at system boundaries (user input, external APIs, file reads)
- Trust internal code and framework guarantees — do not add defensive error handling for scenarios that cannot happen
- Use typed error classes (`FrontmatterValidationError`, `McpConnectionError`, `SkillNotFoundError`) — never throw plain strings
