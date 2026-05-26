#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="check-secrets"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')

_scan_for_secrets() {
  local text="${1}"
  local DETECTED=()

  if echo "${text}" | grep -qE 'AKIA[0-9A-Z]{16}'; then
    DETECTED+=("AWS access key (AKIA...)")
  fi
  if echo "${text}" | grep -qE 'ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}'; then
    DETECTED+=("GitHub personal access token (ghp_/gho_)")
  fi
  if echo "${text}" | grep -qE 'xox[baprs]-[0-9A-Za-z-]+'; then
    DETECTED+=("Slack token (xox...)")
  fi
  if echo "${text}" | grep -qE '\-\-\-\-\-BEGIN .* PRIVATE KEY\-\-\-\-\-'; then
    DETECTED+=("PEM private key header")
  fi

  if [[ ${#DETECTED[@]} -gt 0 ]]; then
    echo "Secret detected — operation blocked." >&2
    for item in "${DETECTED[@]}"; do
      echo "  - ${item}" >&2
    done
    _audit_log_append "${HOOK_NAME}" "blocked" "secrets detected: ${DETECTED[*]}"
    exit 2
  fi
}

# Write/Edit tool: scan file content directly
if [[ "${TOOL_NAME}" == "Write" || "${TOOL_NAME}" == "Edit" ]]; then
  CONTENT=$(echo "${INPUT}" | jq -r '.tool_input.content // .tool_input.new_string // ""')
  FILE=$(echo "${INPUT}" | jq -r '.tool_input.file_path // ""')
  _scan_for_secrets "${CONTENT}"
  _audit_log_append "${HOOK_NAME}" "allowed" "write:${FILE:0:60}"
  exit 0
fi

# Bash tool: scan staged diff on git commit
if [[ "${TOOL_NAME}" == "Bash" ]]; then
  COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')
  if echo "${COMMAND}" | grep -qE '(^|[[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
    DIFF=$(git diff --cached 2>/dev/null || echo "")
    _scan_for_secrets "${DIFF}"
    _audit_log_append "${HOOK_NAME}" "allowed" "no secrets found"
    exit 0
  fi
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
exit 0
