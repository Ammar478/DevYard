# Library — source only, do not execute directly

_extract_pr_number() {
  # 1. Check env var set by auto-code-review.sh
  if [[ -n "${GH_PR_NUMBER:-}" ]]; then
    echo "${GH_PR_NUMBER}"
    return 0
  fi

  # 2. Extract from branch name (e.g. feat/PROJ-123-desc → 123)
  local branch
  branch=$(git branch --show-current 2>/dev/null || echo "")
  if [[ -n "${branch}" ]]; then
    local ticket
    ticket=$(echo "${branch}" | grep -oE '[A-Z]+-[0-9]+' | grep -oE '[0-9]+$' | head -1)
    if [[ -n "${ticket}" ]]; then
      echo "${ticket}"
      return 0
    fi
  fi

  # 3. Query GitHub CLI
  local pr_num
  pr_num=$(gh pr view --json number -q .number 2>/dev/null || echo "")
  if [[ -n "${pr_num}" ]]; then
    echo "${pr_num}"
    return 0
  fi

  echo ""
}
