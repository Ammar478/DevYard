import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

interface HookCommand {
  type: 'command';
  command: string;
  timeout: number;
}

interface HookEntry {
  matcher: string;
  hooks: HookCommand[];
}

interface ClaudeHooks {
  SessionStart?: HookEntry[];
  PreToolUse?: HookEntry[];
  [key: string]: HookEntry[] | undefined;
}

interface ClaudeSettings {
  hooks?: ClaudeHooks;
  [key: string]: unknown;
}

function makeCmd(name: string): HookCommand {
  return { type: 'command', command: `~/.devyard/hooks/${name}`, timeout: 10 };
}

const SESSION_START_ENTRY: HookEntry = {
  matcher: '',
  hooks: [
    makeCmd('onboarding-check.sh'),
    makeCmd('check-upstream-drift.sh'),
    makeCmd('check-portfolio-config.sh'),
    makeCmd('clear-bootstrap-marker.sh'),
    makeCmd('clear-issue-skill-marker.sh'),
    makeCmd('link-custom-skills.sh'),
  ],
};

const PRE_TOOL_USE_ENTRIES: HookEntry[] = [
  {
    matcher: 'Bash',
    hooks: [
      makeCmd('block-git-add-all.sh'),
      makeCmd('block-main-push.sh'),
      makeCmd('validate-branch-name.sh'),
      makeCmd('validate-commit-format.sh'),
      makeCmd('verify-commit-refs.sh'),
      makeCmd('pre-push-gate.sh'),
      makeCmd('require-agdr-for-arch-changes.sh'),
      makeCmd('auto-code-review.sh'),
      makeCmd('validate-pr-create.sh'),
      makeCmd('require-agdr-for-arch-pr.sh'),
      makeCmd('require-design-review-for-ui.sh'),
      makeCmd('block-merge-on-red-ci.sh'),
      makeCmd('block-unreviewed-merge.sh'),
      makeCmd('warn-stale-review-markers.sh'),
      makeCmd('block-private-refs-in-public-repos.sh'),
      makeCmd('require-active-ticket.sh'),
      makeCmd('require-skill-for-issue-create.sh'),
      makeCmd('suggest-ticket-template.sh'),
      makeCmd('require-migration-ticket.sh'),
      makeCmd('validate-issue-structure.sh'),
    ],
  },
  {
    matcher: 'Write|Edit|MultiEdit',
    hooks: [makeCmd('check-secrets.sh')],
  },
  {
    matcher: '.*',
    hooks: [makeCmd('detect-role-trigger.sh')],
  },
];

function hasDevYardHook(entries: HookEntry[]): boolean {
  return entries.some((entry) => entry.hooks.some((h) => h.command.includes('/.devyard/hooks/')));
}

export function mergeClaudeSettings(): void {
  const settingsPath = join(homedir(), '.claude', 'settings.json');

  let settings: ClaudeSettings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as ClaudeSettings;
    } catch {
      settings = {};
    }
  }

  if (typeof settings.hooks !== 'object' || settings.hooks === null) {
    settings.hooks = {};
  }

  let alreadyWired = true;

  const sessionEntries: HookEntry[] = settings.hooks.SessionStart ?? [];
  if (!hasDevYardHook(sessionEntries)) {
    alreadyWired = false;
    settings.hooks.SessionStart = [...sessionEntries, SESSION_START_ENTRY];
  }

  const preToolEntries: HookEntry[] = settings.hooks.PreToolUse ?? [];
  if (!hasDevYardHook(preToolEntries)) {
    alreadyWired = false;
    settings.hooks.PreToolUse = [...preToolEntries, ...PRE_TOOL_USE_ENTRIES];
  }

  if (alreadyWired) {
    console.log('  claude settings: already wired, skipping');
    return;
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  console.log('  claude settings: merged DevYard hooks');
}
