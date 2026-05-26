# Library — source only, do not execute directly
source "$(dirname "${BASH_SOURCE[0]}")/_lib-ops-root.sh"

_get_public_root() {
  local config_file="${OPS_ROOT}/config.yaml"
  if [[ ! -f "${config_file}" ]]; then
    echo ""
    return 0
  fi
  grep -E '^[[:space:]]*public_root:' "${config_file}" \
    | awk -F': ' '{print $2}' \
    | tr -d '"'"'" \
    | head -1
}

_get_private_root() {
  local config_file="${OPS_ROOT}/config.yaml"
  if [[ ! -f "${config_file}" ]]; then
    echo ""
    return 0
  fi
  grep -E '^[[:space:]]*private_root:' "${config_file}" \
    | awk -F': ' '{print $2}' \
    | tr -d '"'"'" \
    | head -1
}
