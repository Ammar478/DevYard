import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Check } from '../check.js';

const TOP_LEVEL_FOLDERS = [
  '_System',
  '_Inbox',
  'Projects',
  'Ideas',
  'Decisions',
  'Handovers',
  'Roadmaps',
  'Stakeholder-Updates',
  'Audit-History',
] as const;

export const vaultChecks: Check[] = [
  {
    id: 'vault-path-exists',
    category: 'vault',
    label: 'Vault path exists',
    required: true,
    async run(ctx) {
      try {
        const stat = statSync(ctx.config.vault.path);
        if (stat.isDirectory()) {
          return { status: 'pass' };
        }
        return {
          status: 'fail',
          message: `${ctx.config.vault.path} is not a directory`,
          remediation: 'Run devyard init or set vault.path in config.',
        };
      } catch {
        return {
          status: 'fail',
          message: `Vault path does not exist: ${ctx.config.vault.path}`,
          remediation: 'Run devyard init or set vault.path in config.',
        };
      }
    },
  },
  {
    id: 'vault-top-level',
    category: 'vault',
    label: '9 top-level folders present',
    required: true,
    async run(ctx) {
      const missing: string[] = [];
      for (const folder of TOP_LEVEL_FOLDERS) {
        const folderPath = join(ctx.config.vault.path, folder);
        try {
          const stat = statSync(folderPath);
          if (!stat.isDirectory()) {
            missing.push(folder);
          }
        } catch {
          missing.push(folder);
        }
      }
      if (missing.length === 0) {
        return { status: 'pass' };
      }
      return {
        status: 'fail',
        message: `Missing folders: ${missing.join(', ')}`,
        remediation: 'Run devyard init to scaffold vault.',
      };
    },
  },
  {
    id: 'vault-schemas',
    category: 'vault',
    label: '15 schema files present',
    required: true,
    async run(ctx) {
      const schemasDir = join(ctx.config.vault.path, '_System', 'schemas');
      try {
        const files = readdirSync(schemasDir);
        if (files.length >= 15) {
          return { status: 'pass', message: `${files.length} schema files found` };
        }
        return {
          status: 'fail',
          message: `Only ${files.length} schema files found (need ≥ 15)`,
          remediation: 'Run devyard init to scaffold vault.',
        };
      } catch {
        return {
          status: 'fail',
          message: `Schemas directory missing: ${schemasDir}`,
          remediation: 'Run devyard init to scaffold vault.',
        };
      }
    },
  },
  {
    id: 'vault-templates',
    category: 'vault',
    label: '15 template files present',
    required: true,
    async run(ctx) {
      const templatesDir = join(ctx.config.vault.path, '_System', 'templates');
      try {
        const files = readdirSync(templatesDir);
        if (files.length >= 15) {
          return { status: 'pass', message: `${files.length} template files found` };
        }
        return {
          status: 'fail',
          message: `Only ${files.length} template files found (need ≥ 15)`,
          remediation: 'Run devyard init to scaffold vault.',
        };
      } catch {
        return {
          status: 'fail',
          message: `Templates directory missing: ${templatesDir}`,
          remediation: 'Run devyard init to scaffold vault.',
        };
      }
    },
  },
];
