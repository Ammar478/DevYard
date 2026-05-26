#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="pre-push-gate"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-multi-repo-trace.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-extract-push-ref.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -qE '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

# Skip if explicitly bypassed
if [[ "${SKIP_GATE:-}" == "1" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "SKIP_GATE=1"
  exit 0
fi

# Only gate on pushes to origin
if echo "${COMMAND}" | grep -qE 'git[[:space:]]+push[[:space:]]+[^o][^r][^i]'; then
  REMOTE=$(echo "${COMMAND}" | grep -oP 'git push \K[^[:space:]]+' | head -1 || echo "origin")
  if [[ -n "${REMOTE}" && "${REMOTE}" != "origin" ]]; then
    _audit_log_append "${HOOK_NAME}" "allowed" "non-origin push"
    exit 0
  fi
fi

REPO_ROOT=$(_get_active_repo_root)

cd "${REPO_ROOT}"

if ! pnpm lint --silent 2>/dev/null; then
  _audit_log_append "${HOOK_NAME}" "blocked" "lint failed"
  echo "Blocked: lint failed. Run 'pnpm lint' to see errors." >&2
  exit 2
fi

if ! pnpm typecheck --silent 2>/dev/null; then
  _audit_log_append "${HOOK_NAME}" "blocked" "typecheck failed"
  echo "Blocked: typecheck failed. Run 'pnpm typecheck' to see errors." >&2
  exit 2
fi

if ! pnpm test --silent 2>/dev/null; then
  _audit_log_append "${HOOK_NAME}" "blocked" "tests failed"
  echo "Blocked: tests failed. Run 'pnpm test' to see failures." >&2
  exit 2
fi

if ! pnpm build --silent 2>/dev/null; then
  _audit_log_append "${HOOK_NAME}" "blocked" "build failed"
  echo "Blocked: build failed. Run 'pnpm build' to see errors." >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
exit 0
