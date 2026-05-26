#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="design-validator"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
FILE=$(echo "${INPUT}" | jq -r '.tool_input.file_path // ""')

# Only check Write/Edit operations on Design files
if [[ "${TOOL_NAME}" != "Write" && "${TOOL_NAME}" != "Edit" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${FILE}" | grep -qE '/Designs/[^/]+\.md$'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${FILE:0:60}"
  exit 0
fi

CONTENT=$(echo "${INPUT}" | jq -r '.tool_input.content // .tool_input.new_string // ""')

if ! echo "${CONTENT}" | grep -qE '^linked_brd:[[:space:]]*\S'; then
  _audit_log_append "${HOOK_NAME}" "blocked" "Design missing linked_brd: ${FILE:0:60}"
  echo "Design blocked: frontmatter is missing required 'linked_brd' field." >&2
  echo "Add 'linked_brd: <brd-filename>' to the frontmatter." >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${FILE:0:60}"
exit 0
