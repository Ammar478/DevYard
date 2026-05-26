import { chmodSync, existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir } from '../utils/fs.js';
import { opsRoot } from '../utils/paths.js';

const SYMLINK_NAMES = [
  'roles',
  'rules',
  'skills',
  'agents',
  'hooks',
  'schemas',
  'templates',
  'workflows',
  'golden-paths',
] as const;

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

export function installHooks(assetsDir: string): void {
  ensureDir(join(opsRoot(), 'logs'));

  for (const name of SYMLINK_NAMES) {
    const dest = join(opsRoot(), name);
    const src = join(assetsDir, name);
    if (existsSync(dest)) {
      console.log(`  exists: ~/.devyard/${name}`);
    } else {
      symlinkSync(src, dest, 'dir');
      console.log(`  linked: ~/.devyard/${name} → ${src}`);
    }
  }

  for (const name of HOOK_SCRIPTS) {
    const hookFile = join(opsRoot(), 'hooks', name);
    if (existsSync(hookFile)) {
      chmodSync(hookFile, 0o755);
    } else {
      console.log(`  missing hook: ${name} (run devyard init after Phase C)`);
    }
  }
}
