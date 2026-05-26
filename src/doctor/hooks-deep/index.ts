import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { opsRoot } from '../../utils/paths.js';
import type { Check } from '../check.js';

interface DeepCheckSpec {
  id: string;
  label: string;
  script: string;
  input: Record<string, unknown>;
}

const specs: DeepCheckSpec[] = [
  {
    id: 'deep-force-push',
    label: 'Blocks force-push to main',
    script: 'block-main-push.sh',
    input: { tool_name: 'Bash', tool_input: { command: 'git push --force origin main' } },
  },
  {
    id: 'deep-secret-pattern',
    label: 'Blocks AWS key pattern',
    script: 'check-secrets.sh',
    input: {
      tool_name: 'Write',
      tool_input: { file_path: 'config.js', content: "const key = 'AKIAIOSFODNN7EXAMPLE';" },
    },
  },
  {
    id: 'deep-git-add-all',
    label: 'Blocks git add -A',
    script: 'block-git-add-all.sh',
    input: { tool_name: 'Bash', tool_input: { command: 'git add -A' } },
  },
  {
    id: 'deep-push-main',
    label: 'Blocks push to main',
    script: 'block-main-push.sh',
    input: { tool_name: 'Bash', tool_input: { command: 'git push origin main' } },
  },
  {
    id: 'deep-brd-no-problem',
    label: 'Blocks BRD missing ## Problem',
    script: 'brd-validator.sh',
    input: {
      tool_name: 'Write',
      tool_input: {
        file_path: 'Projects/X/BRDs/feature.md',
        content: '---\ntype: brd\n---\n## Solution\nSome content',
      },
    },
  },
  {
    id: 'deep-design-no-brd',
    label: 'Blocks Design without linked_brd',
    script: 'design-validator.sh',
    input: {
      tool_name: 'Write',
      tool_input: {
        file_path: 'Projects/X/Designs/feature.md',
        content: '---\ntype: design\n---\n## Overview\nSome content',
      },
    },
  },
  {
    id: 'deep-edit-no-ticket',
    label: 'Blocks edit without active ticket',
    script: 'require-active-ticket.sh',
    input: {
      tool_name: 'Write',
      tool_input: { file_path: 'src/main.ts', content: "console.log('hi')" },
    },
  },
];

export const deepChecks: Check[] = specs.map((spec) => ({
  id: spec.id,
  category: 'hooks',
  label: spec.label,
  required: true,
  async run() {
    const scriptPath = join(opsRoot(), 'hooks', spec.script);
    if (!existsSync(scriptPath)) {
      return {
        status: 'fail',
        message: 'Hook script not found',
        remediation: 'Run devyard init to install hooks.',
      };
    }
    const result = spawnSync('/bin/sh', [scriptPath], {
      input: JSON.stringify(spec.input),
      timeout: 5000,
      encoding: 'utf-8',
    });
    if (result.status !== 0) {
      return { status: 'pass' };
    }
    return {
      status: 'fail',
      message: `Hook ${spec.script} did not block the bad input (exit 0)`,
    };
  },
}));
