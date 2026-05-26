# Library — source only, do not execute directly
source "$(dirname "${BASH_SOURCE[0]}")/_lib-ops-root.sh"

_read_config() {
  local key="${1:-}"
  local config_file="${OPS_ROOT}/config.yaml"

  if [[ ! -f "${config_file}" ]]; then
    echo ""
    return 0
  fi

  # Convert dot-separated key to grep pattern — match the last segment only
  # e.g. "vault.path" → look for "path:" under "vault:" block
  # Simple single-level grep for the final key segment
  local final_key
  final_key=$(echo "${key}" | awk -F. '{print $NF}')

  grep -E "^[[:space:]]*${final_key}:" "${config_file}" \
    | head -1 \
    | awk -F': ' '{print $2}' \
    | tr -d '"'"'"
}
