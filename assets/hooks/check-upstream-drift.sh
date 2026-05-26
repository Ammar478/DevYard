#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="check-upstream-drift"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

RESULT="allowed"
SUMMARY="session start — upstream drift check"

LOCAL_VERSION=$(node -e "import('/Users/ammar/Documents/Dev-Projects/DevYard/package.json', {assert:{type:'json'}}).then(m=>process.stdout.write(m.default.version))" 2>/dev/null \
  || grep '"version"' "${HOME}/.devyard/../../../Documents/Dev-Projects/DevYard/package.json" 2>/dev/null \
  | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' \
  || echo "")

REMOTE_VERSION=$(npm show devyard version 2>/dev/null || echo "")

if [[ -n "${LOCAL_VERSION}" && -n "${REMOTE_VERSION}" && "${LOCAL_VERSION}" != "${REMOTE_VERSION}" ]]; then
  echo "Warning: DevYard local version (${LOCAL_VERSION}) differs from published (${REMOTE_VERSION}). Consider updating." >&2
fi

_audit_log_append "${HOOK_NAME}" "${RESULT}" "${SUMMARY}"
exit 0
