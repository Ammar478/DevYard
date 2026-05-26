import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { opsRoot } from '../../utils/paths.js';
import type { Check } from '../check.js';

function countFilesWithExtensions(dir: string, exts: string[]): number {
  try {
    const entries = readdirSync(dir, { recursive: true, encoding: 'utf-8' });
    return entries.filter((e) => exts.some((ext) => e.endsWith(ext))).length;
  } catch {
    return -1;
  }
}

export const engineChecks: Check[] = [
  {
    id: 'engine-skills',
    category: 'engine',
    label: '49 skills present',
    required: true,
    async run() {
      const skillsDir = join(opsRoot(), 'skills');
      try {
        const entries = readdirSync(skillsDir, { withFileTypes: true });
        let count = 0;
        for (const entry of entries) {
          if (entry.isDirectory()) {
            try {
              readdirSync(join(skillsDir, entry.name)).find((f) => f === 'SKILL.md');
              const files = readdirSync(join(skillsDir, entry.name));
              if (files.includes('SKILL.md')) count++;
            } catch {
              // skip unreadable dirs
            }
          }
        }
        if (count >= 49) {
          return { status: 'pass', message: `${count} skills found` };
        }
        return {
          status: 'fail',
          message: `Only ${count} skills found (need ≥ 49)`,
        };
      } catch {
        return {
          status: 'fail',
          message: `Skills directory not found: ${skillsDir}`,
        };
      }
    },
  },
  {
    id: 'engine-roles',
    category: 'engine',
    label: '19 role files present',
    required: true,
    async run() {
      const rolesDir = join(opsRoot(), 'roles');
      const count = countFilesWithExtensions(rolesDir, ['.md']);
      if (count === -1) {
        return { status: 'fail', message: `Roles directory not found: ${rolesDir}` };
      }
      if (count >= 19) {
        return { status: 'pass', message: `${count} role files found` };
      }
      return { status: 'fail', message: `Only ${count} role files found (need ≥ 19)` };
    },
  },
  {
    id: 'engine-agents',
    category: 'engine',
    label: '5 agent files present',
    required: true,
    async run() {
      const agentsDir = join(opsRoot(), 'agents');
      const count = countFilesWithExtensions(agentsDir, ['.md']);
      if (count === -1) {
        return { status: 'fail', message: `Agents directory not found: ${agentsDir}` };
      }
      if (count >= 5) {
        return { status: 'pass', message: `${count} agent files found` };
      }
      return { status: 'fail', message: `Only ${count} agent files found (need ≥ 5)` };
    },
  },
  {
    id: 'engine-rules',
    category: 'engine',
    label: '11 rule files present',
    required: true,
    async run() {
      const rulesDir = join(opsRoot(), 'rules');
      const count = countFilesWithExtensions(rulesDir, ['.md']);
      if (count === -1) {
        return { status: 'fail', message: `Rules directory not found: ${rulesDir}` };
      }
      if (count >= 11) {
        return { status: 'pass', message: `${count} rule files found` };
      }
      return { status: 'fail', message: `Only ${count} rule files found (need ≥ 11)` };
    },
  },
  {
    id: 'engine-pipelines',
    category: 'engine',
    label: '7 pipeline YAML files present',
    required: true,
    async run() {
      const pipelinesDir = join(opsRoot(), 'golden-paths', 'pipelines');
      const count = countFilesWithExtensions(pipelinesDir, ['.yml', '.yaml']);
      if (count === -1) {
        return { status: 'fail', message: `Pipelines directory not found: ${pipelinesDir}` };
      }
      if (count >= 7) {
        return { status: 'pass', message: `${count} pipeline files found` };
      }
      return { status: 'fail', message: `Only ${count} pipeline files found (need ≥ 7)` };
    },
  },
];
