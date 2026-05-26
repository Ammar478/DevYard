import { spawnSync } from 'node:child_process';
import type { Check } from '../check.js';

export const depsChecks: Check[] = [
  {
    id: 'deps-gh-auth',
    category: 'deps',
    label: 'GitHub CLI authenticated',
    required: true,
    async run() {
      const result = spawnSync('gh', ['auth', 'status'], { timeout: 5000 });
      if (result.status === 0) {
        return { status: 'pass' };
      }
      return {
        status: 'fail',
        message: 'GitHub CLI is not authenticated',
        remediation: 'Run: gh auth login',
      };
    },
  },
];
