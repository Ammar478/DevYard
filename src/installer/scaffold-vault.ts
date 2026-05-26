import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const VAULT_DIRS = [
  '_System',
  '_System/schemas',
  '_System/templates',
  '_Inbox',
  'Projects',
  'Ideas',
  'Decisions',
  'Handovers',
  'Roadmaps',
  'Stakeholder-Updates',
  'Audit-History',
];

export function scaffoldVault(vaultPath: string): void {
  for (const dir of VAULT_DIRS) {
    const full = join(vaultPath, dir);
    const existed = existsSync(full);
    mkdirSync(full, { recursive: true });
    if (!existed) {
      console.log('  created:', full);
    }
  }
}
