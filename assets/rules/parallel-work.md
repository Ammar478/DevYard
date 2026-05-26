---
name: parallel-work
type: behavioral-rule
scope: all-sessions
---

# Rule: Parallel Work

Independent work items should be executed in parallel where safe to do so. This applies to both tool calls within a session and sub-agent invocations via the Agent tool.

## When to Parallelize

- **Tool calls**: If two tool calls have no data dependency between them, make both calls in the same response turn. Example: reading two unrelated files, running lint and typecheck simultaneously.
- **Sub-agents**: When tasks are genuinely independent (different files, different concerns), spawn sub-agents in parallel via the `/fan-out` skill (max 5 concurrent agents).
- **Startup**: On TUI launch, run vault scan, MCP connect, Ollama check, and history load in parallel via `Promise.allSettled`.

## When NOT to Parallelize

- When one task's output determines the next task's inputs (sequential dependency)
- When tasks share mutable state (same file, same database record)
- When one task must succeed before the other is meaningful
- When debugging — run checks sequentially to isolate which step fails

## Fan-Out Constraints

The `/fan-out` skill spawns at most 5 concurrent sub-agents. This limit exists to prevent context overload and uncontrolled resource consumption. If a task requires more than 5 parallel agents, batch them in waves of 5.

## Example — Correct Parallel Tool Use

```
# Two independent file reads — send in a single response turn
Read(src/panels/ProjectsPanel.tsx)
Read(src/panels/StatusPanel.tsx)
```

## Example — Incorrect Sequential Tool Use

```
# Do not do this when reads are independent:
Read(file1) → wait → Read(file2) → wait → ...
```

## Audit Log

Parallel work is subject to the same hook audit log as sequential work. Each tool call in a parallel batch generates its own audit record.
