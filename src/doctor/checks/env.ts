import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readConfig } from '../../config/load.js';
import { ConfigValidationError } from '../../config/types.js';
import { opsRoot } from '../../utils/paths.js';
import type { Check } from '../check.js';

function parseVersion(v: string): [number, number, number] {
  const parts = v.trim().split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function semverGte(a: string, b: string): boolean {
  const [aMaj, aMin, aPat] = parseVersion(a);
  const [bMaj, bMin, bPat] = parseVersion(b);
  if (aMaj !== bMaj) return aMaj > bMaj;
  if (aMin !== bMin) return aMin > bMin;
  return aPat >= bPat;
}

export const envChecks: Check[] = [
  {
    id: 'env-node-version',
    category: 'env',
    label: 'Node.js ≥ 20.11.0',
    required: true,
    async run() {
      const current = process.versions.node;
      if (semverGte(current, '20.11.0')) {
        return { status: 'pass', message: `v${current}` };
      }
      return {
        status: 'fail',
        message: `Node.js v${current} is below required 20.11.0`,
        remediation: 'Upgrade Node.js to v20.11.0 or later.',
      };
    },
  },
  {
    id: 'env-claude-binary',
    category: 'env',
    label: 'Claude binary in PATH',
    required: true,
    async run(ctx) {
      const result = spawnSync(ctx.config.claude.binary, ['--version'], { timeout: 2000 });
      if (result.status === 0) {
        return { status: 'pass' };
      }
      return {
        status: 'fail',
        message: `Binary '${ctx.config.claude.binary}' not found or returned non-zero`,
        remediation: 'Install Claude Code CLI.',
      };
    },
  },
  {
    id: 'env-config-valid',
    category: 'env',
    label: 'Config file valid',
    required: true,
    async run() {
      try {
        readConfig();
        return { status: 'pass' };
      } catch (err) {
        if (err instanceof ConfigValidationError) {
          return { status: 'fail', message: err.message };
        }
        return { status: 'fail', message: String(err) };
      }
    },
  },
  {
    id: 'env-onboarding-valid',
    category: 'env',
    label: 'onboarding.yaml has no placeholders',
    required: true,
    async run() {
      const filePath = join(homedir(), '.devyard', 'onboarding.yaml');
      if (!existsSync(filePath)) {
        return {
          status: 'warn',
          message: 'onboarding.yaml not found',
          remediation: 'Run devyard init',
        };
      }
      const content = readFileSync(filePath, 'utf-8');
      const placeholderPattern = /YOUR_|<[^>]+>|\bTODO\b|\bPLACEHOLDER\b/i;
      const offending: string[] = [];
      for (const line of content.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        if (placeholderPattern.test(value)) {
          offending.push(key);
        }
      }
      if (offending.length > 0) {
        return {
          status: 'fail',
          message: `Placeholder values found in keys: ${offending.join(', ')}`,
        };
      }
      return { status: 'pass' };
    },
  },
  {
    id: 'env-portfolio-valid',
    category: 'env',
    label: 'Portfolio config valid',
    required: true,
    async run(ctx) {
      if (ctx.config.portfolio.mode !== 'split') {
        return { status: 'pass' };
      }
      const { public_root, private_root } = ctx.config.portfolio;
      if (!public_root || !existsSync(public_root)) {
        return {
          status: 'fail',
          message: `public_root ${public_root ?? '(null)'} does not exist`,
        };
      }
      if (!private_root || !existsSync(private_root)) {
        return {
          status: 'fail',
          message: `private_root ${private_root ?? '(null)'} does not exist`,
        };
      }
      return { status: 'pass' };
    },
  },
  {
    id: 'env-upstream-drift',
    category: 'env',
    label: 'Version matches upstream',
    required: false,
    async run() {
      // tsup bundles all sources to dist/cli.js; ../package.json resolves correctly there
      const pkgPath = new URL('../package.json', import.meta.url).pathname;
      let localVersion = 'unknown';
      try {
        const raw = readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw) as { version?: string };
        localVersion = pkg.version ?? 'unknown';
      } catch {
        return { status: 'warn', message: 'Could not read local package.json' };
      }

      const result = spawnSync('npm', ['view', 'devyard', 'version'], {
        timeout: 5000,
        encoding: 'utf-8',
      });

      if (result.status !== 0 || result.error) {
        return { status: 'warn', message: 'Could not fetch upstream version from npm' };
      }

      const upstream = result.stdout.trim();
      if (upstream === localVersion) {
        return { status: 'pass', message: `v${localVersion} is current` };
      }
      return {
        status: 'warn',
        message: `Local v${localVersion} is behind upstream v${upstream}`,
      };
    },
  },
  {
    id: 'env-disk-writable',
    category: 'env',
    label: '~/.devyard/ is writable',
    required: true,
    async run() {
      const testPath = join(opsRoot(), '.write-test');
      try {
        writeFileSync(testPath, '', 'utf-8');
        unlinkSync(testPath);
        return { status: 'pass' };
      } catch (err) {
        return {
          status: 'fail',
          message: String(err),
          remediation: 'Run: chmod u+w ~/.devyard',
        };
      }
    },
  },
];

void statSync;
