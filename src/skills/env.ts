import type { Config } from '../config/types.js';
import { opsRoot } from '../utils/paths.js';
import type { SkillDefinition } from './types.js';

export function buildEnv(
  skill: SkillDefinition,
  project: string | null,
  config: Config,
): Record<string, string> {
  return {
    ...(process.env as Record<string, string>),
    DEVYARD_VAULT: config.vault.path,
    DEVYARD_ROLE: skill.role,
    DEVYARD_SKILL: skill.id,
    DEVYARD_PROJECT: project ?? '',
    DEVYARD_OPS_ROOT: opsRoot(),
  };
}
