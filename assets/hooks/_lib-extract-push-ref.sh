# Library — source only, do not execute directly

_extract_push_target() {
  local cmd="${1:-}"

  # Strip leading "git push" and any flags (starting with -)
  local args
  args=$(echo "${cmd}" | sed -E 's/^git[[:space:]]+push[[:space:]]*//')

  # Remove flags like --force, --force-with-lease, --no-verify, etc.
  local positionals=()
  for token in ${args}; do
    if [[ "${token}" != --* ]]; then
      positionals+=("${token}")
    fi
  done

  # positionals[0] = remote, positionals[1] = branch (if present)
  if [[ ${#positionals[@]} -ge 2 ]]; then
    echo "${positionals[1]}"
  elif [[ ${#positionals[@]} -eq 1 ]]; then
    # Only remote specified — derive branch from HEAD
    git branch --show-current 2>/dev/null || echo ""
  else
    # Bare "git push" — derive branch from HEAD
    git branch --show-current 2>/dev/null || echo ""
  fi
}
