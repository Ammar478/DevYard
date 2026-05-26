#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="link-custom-skills"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-read-config.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-portfolio-paths.sh"

RESULT="allowed"
SUMMARY="session start — link custom skills"

MODE=$(_read_config portfolio.mode || echo "")

if [[ "${MODE}" == "split" ]]; then
  PRIVATE_ROOT=$(_get_private_root)

  if [[ -n "${PRIVATE_ROOT}" && -d "${PRIVATE_ROOT}/.claude/skills" ]]; then
    mkdir -p ".claude/skills"

    while IFS= read -r -d '' skill_file; do
      local_name=$(basename "${skill_file}")
      link_path=".claude/skills/${local_name}"

      # Only create symlink if it doesn't already exist pointing to the right place
      if [[ ! -L "${link_path}" ]]; then
        ln -sf "${skill_file}" "${link_path}"
      fi
    done < <(find "${PRIVATE_ROOT}/.claude/skills" -maxdepth 1 -name "*.md" -print0 2>/dev/null)
  fi
fi

_audit_log_append "${HOOK_NAME}" "${RESULT}" "${SUMMARY}"
exit 0
