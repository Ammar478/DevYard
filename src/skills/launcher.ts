import { spawn } from 'node:child_process';
import type { Config } from '../config/types.js';
import { SkillNotFoundError } from '../data/types.js';
import type { Logger } from '../utils/logger.js';
import { buildEnv } from './env.js';
import type { SkillDefinition } from './types.js';

export async function launchSkill(
  skill: SkillDefinition,
  project: string | null,
  config: Config,
  hooks?: { onPause?: () => void; onResume?: () => void; logger?: Logger },
): Promise<number> {
  const t0 = performance.now();
  const env = buildEnv(skill, project, config);
  const cwd = process.cwd();

  hooks?.onPause?.();

  return new Promise<number>((resolve, reject) => {
    const spawnReadyMs = +(performance.now() - t0).toFixed(2);
    hooks?.logger?.debug('skill-launch-spawn-ready', { skillId: skill.id, spawnReadyMs });

    const child = spawn(config.claude.binary, [], {
      stdio: 'inherit',
      env,
      cwd,
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      hooks?.onResume?.();
      if (err.code === 'ENOENT') {
        reject(
          new SkillNotFoundError(skill.id, `Claude binary not found: ${config.claude.binary}`),
        );
      } else {
        reject(err);
      }
    });

    child.on('close', (code) => {
      hooks?.onResume?.();
      resolve(code ?? 1);
    });
  });
}
