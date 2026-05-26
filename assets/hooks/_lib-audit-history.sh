# Library — source only, do not execute directly
source "$(dirname "${BASH_SOURCE[0]}")/_lib-read-config.sh"

_write_audit_history() {
  local audit_name="${1:-}"
  local project="${2:-}"
  local verdict="${3:-}"
  local blocker_count="${4:-0}"
  local warning_count="${5:-0}"

  local vault_path
  vault_path=$(_read_config vault.path)

  if [[ -z "${vault_path}" ]]; then
    return 0
  fi

  local date_iso
  date_iso=$(date -u +"%Y-%m-%d")

  local audit_dir="${vault_path}/Audit-History"
  mkdir -p "${audit_dir}"

  local out_file="${audit_dir}/${audit_name}-${date_iso}.md"

  cat > "${out_file}" <<EOF
---
type: audit
audit_name: ${audit_name}
project: ${project}
date: ${date_iso}
verdict: ${verdict}
blocker_count: ${blocker_count}
warning_count: ${warning_count}
---
EOF
}
