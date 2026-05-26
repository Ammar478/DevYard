import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { opsRoot } from '../../utils/paths.js';
import type { Check } from '../check.js';

const HOOK_SCRIPTS = [
  'onboarding-check.sh',
  'check-upstream-drift.sh',
  'check-portfolio-config.sh',
  'clear-bootstrap-marker.sh',
  'clear-issue-skill-marker.sh',
  'link-custom-skills.sh',
  'require-active-ticket.sh',
  'require-skill-for-issue-create.sh',
  'suggest-ticket-template.sh',
  'require-migration-ticket.sh',
  'validate-issue-structure.sh',
  'block-git-add-all.sh',
  'block-main-push.sh',
  'validate-branch-name.sh',
  'validate-commit-format.sh',
  'verify-commit-refs.sh',
  'check-secrets.sh',
  'pre-push-gate.sh',
  'require-agdr-for-arch-changes.sh',
  'auto-code-review.sh',
  'validate-pr-create.sh',
  'require-agdr-for-arch-pr.sh',
  'require-design-review-for-ui.sh',
  'block-merge-on-red-ci.sh',
  'block-unreviewed-merge.sh',
  'warn-stale-review-markers.sh',
  'block-private-refs-in-public-repos.sh',
  'detect-role-trigger.sh',
] as const;

export const hooksChecks: Check[] = [
  {
    id: 'hooks-exist',
    category: 'hooks',
    label: '28 hook scripts exist + executable',
    required: true,
    async run() {
      const missing: string[] = [];
      const notExecutable: string[] = [];
      for (const name of HOOK_SCRIPTS) {
        const hookFilePath = join(opsRoot(), 'hooks', name);
        try {
          const stat = statSync(hookFilePath);
          if ((stat.mode & 0o111) === 0) {
            notExecutable.push(name);
          }
        } catch {
          missing.push(name);
        }
      }
      const issues: string[] = [];
      if (missing.length > 0) issues.push(`Missing: ${missing.join(', ')}`);
      if (notExecutable.length > 0) issues.push(`Not executable: ${notExecutable.join(', ')}`);
      if (issues.length === 0) {
        return { status: 'pass' };
      }
      return { status: 'fail', message: issues.join(' | ') };
    },
  },
  {
    id: 'hooks-claude-wired',
    category: 'hooks',
    label: 'Claude settings contain DevYard hooks',
    required: true,
    async run() {
      const settingsPath = join(homedir(), '.claude', 'settings.json');
      try {
        const raw = readFileSync(settingsPath, 'utf-8');
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('hooks' in parsed) ||
          !parsed.hooks
        ) {
          return {
            status: 'fail',
            message: 'No hooks key found in ~/.claude/settings.json',
            remediation: 'Run devyard init to wire hooks into ~/.claude/settings.json',
          };
        }
        const hooksValue = (parsed as Record<string, unknown>).hooks;
        const hooksStr = JSON.stringify(hooksValue);
        if (!hooksStr.includes('devyard') && !hooksStr.includes('.devyard')) {
          return {
            status: 'fail',
            message: 'No DevYard hooks found in ~/.claude/settings.json',
            remediation: 'Run devyard init to wire hooks into ~/.claude/settings.json',
          };
        }
        return { status: 'pass' };
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return {
            status: 'fail',
            message: '~/.claude/settings.json not found',
            remediation: 'Run devyard init to wire hooks into ~/.claude/settings.json',
          };
        }
        return {
          status: 'fail',
          message: `Could not read ~/.claude/settings.json: ${String(err)}`,
          remediation: 'Run devyard init to wire hooks into ~/.claude/settings.json',
        };
      }
    },
  },
  {
    id: 'hooks-audit-writable',
    category: 'hooks',
    label: 'Audit log directory writable',
    required: true,
    async run() {
      const logsDir = join(opsRoot(), 'logs');
      try {
        mkdirSync(logsDir, { recursive: true });
        const testFile = join(logsDir, `.write-test-${Date.now()}`);
        writeFileSync(testFile, '', 'utf-8');
        unlinkSync(testFile);
        return { status: 'pass' };
      } catch (err) {
        return {
          status: 'fail',
          message: String(err),
          remediation: 'Run: mkdir -p ~/.devyard/logs && chmod u+w ~/.devyard/logs',
        };
      }
    },
  },
];
