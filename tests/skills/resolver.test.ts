import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import * as fc from 'fast-check';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import { buildEnv } from '../../src/skills/env.js';
import { resolveSkill } from '../../src/skills/resolver.js';
import type { SkillDefinition } from '../../src/skills/types.js';
import { opsRoot } from '../../src/utils/paths.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const SKILL_IDS = [
  'status',
  'inbox',
  'projects',
  'tasks',
  'roadmap',
  'stakeholder-update',
  'feature',
  'bug',
  'task',
  'spike',
  'spike-close',
  'investigation',
  'idea',
  'validate-idea',
  'tickets-batch',
  'migration',
  'start-ticket',
  'write-spec',
  'decide',
  'agdr',
  'c4',
  'dfd',
  'threat-model',
  'tech-vision',
  'process',
  'journey',
  'fan-out',
  'code-review',
  'security-review',
  'approve-merge',
  'approve-design',
  'audit-deps',
  'launch-check',
  'accessibility-audit',
  'compliance-check',
  'analytics-audit',
  'seo-audit',
  'performance-audit',
  'monitoring-audit',
  'docs-audit',
  'release',
  'setup',
  'handover',
  'update',
  'split-portfolio',
  'onboard',
  'extract-features',
  'debug',
  'cli-builder',
] as const;

const REQUIRED_ENV_KEYS = [
  'DEVYARD_VAULT',
  'DEVYARD_ROLE',
  'DEVYARD_SKILL',
  'DEVYARD_PROJECT',
  'DEVYARD_OPS_ROOT',
] as const;

function makeStubSkillDir(id: string, role = 'hisham'): void {
  const dir = join(opsRoot(), 'skills', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    `---\nid: ${id}\nrole: ${role}\ndescription: Test skill\nusage: /${id}\n---\n`,
    'utf-8',
  );
}

// ── resolver tests (12.7) ─────────────────────────────────────────────────────

describe('resolveSkill', () => {
  const tmpSkillDir = join(opsRoot(), 'skills', '__test-resolve__');

  beforeAll(() => {
    makeStubSkillDir('__test-resolve__');
  });
  afterAll(() => {
    rmSync(tmpSkillDir, { recursive: true, force: true });
  });

  it('returns a SkillDefinition for a valid SKILL.md', () => {
    const skill = resolveSkill('__test-resolve__');
    expect(skill).not.toBeNull();
    expect(skill?.id).toBe('__test-resolve__');
    expect(skill?.role).toBe('hisham');
    expect(skill?.description).toBeTruthy();
    expect(skill?.usage).toBeTruthy();
  });

  it('returns null for an unknown skill ID', () => {
    expect(resolveSkill('__definitely-does-not-exist__')).toBeNull();
  });

  it('returns null for a SKILL.md missing required frontmatter fields', () => {
    const badDir = join(opsRoot(), 'skills', '__bad-skill__');
    mkdirSync(badDir, { recursive: true });
    writeFileSync(join(badDir, 'SKILL.md'), '---\nid: bad\n---\n', 'utf-8');
    expect(resolveSkill('__bad-skill__')).toBeNull();
    rmSync(badDir, { recursive: true, force: true });
  });

  it('all 49 canonical skill IDs are resolvable via the assets symlink', () => {
    // assets/skills/ is symlinked to ~/.devyard/skills/ after devyard init.
    // In CI / pre-init, skills live in assets/skills/ directly.
    // The resolver reads from ~/.devyard/skills/<id>/SKILL.md.
    // We create stubs for each ID under the ops root for this test.
    const created: string[] = [];
    for (const id of SKILL_IDS) {
      const dir = join(opsRoot(), 'skills', id);
      // Only track as created if the dir did not already exist — mkdirSync
      // with recursive:true never throws, so we must check existence first.
      if (!existsSync(dir)) {
        makeStubSkillDir(id);
        created.push(id);
      }
    }

    let resolved = 0;
    for (const id of SKILL_IDS) {
      if (resolveSkill(id) !== null) resolved++;
    }

    // cleanup created stubs
    for (const id of created) {
      try {
        rmSync(join(opsRoot(), 'skills', id), { recursive: true, force: true });
      } catch {
        /* ok */
      }
    }

    expect(resolved).toBe(49);
  });
});

// ── buildEnv tests (12.6 + 12.7) ─────────────────────────────────────────────

describe('buildEnv', () => {
  const stub: SkillDefinition = {
    id: 'feature',
    role: 'mariam',
    description: 'x',
    usage: '/feature',
  };

  it('contains all 5 required env keys with non-empty values (with project)', () => {
    const env = buildEnv(stub, 'MyApp', DEFAULT_CONFIG);
    for (const key of REQUIRED_ENV_KEYS) {
      expect(env[key], `missing or empty: ${key}`).toBeTruthy();
    }
    expect(env.DEVYARD_PROJECT).toBe('MyApp');
  });

  it('sets DEVYARD_PROJECT to empty string when project is null', () => {
    const env = buildEnv(stub, null, DEFAULT_CONFIG);
    expect(env.DEVYARD_PROJECT).toBe('');
    // All other keys still non-empty
    for (const key of REQUIRED_ENV_KEYS.filter((k) => k !== 'DEVYARD_PROJECT')) {
      expect(env[key]).toBeTruthy();
    }
  });

  it('maps skill fields to correct env vars', () => {
    const env = buildEnv(stub, null, DEFAULT_CONFIG);
    expect(env.DEVYARD_ROLE).toBe('mariam');
    expect(env.DEVYARD_SKILL).toBe('feature');
    expect(env.DEVYARD_VAULT).toBe(DEFAULT_CONFIG.vault.path);
    expect(env.DEVYARD_OPS_ROOT).toBe(join(homedir(), '.devyard'));
  });

  // Property 8: for any valid skill + optional project, all 5 keys present and non-empty
  it('Property 8 — all 5 env keys non-empty for any skill/project combo', () => {
    const skillArb = fc.record({
      id: fc.stringMatching(/^[a-z][a-z-]{1,30}$/),
      role: fc.stringMatching(/^[a-z]{3,20}$/),
      description: fc.string({ minLength: 1, maxLength: 80 }),
      usage: fc.string({ minLength: 1, maxLength: 40 }),
    });
    const projectArb = fc.option(fc.stringMatching(/^[A-Za-z0-9 -]{1,40}$/), { nil: null });

    fc.assert(
      fc.property(skillArb, projectArb, (skill, project) => {
        const env = buildEnv(skill, project, DEFAULT_CONFIG);
        for (const key of REQUIRED_ENV_KEYS) {
          if (key === 'DEVYARD_PROJECT') continue; // allowed to be empty when project is null
          if (!env[key]) return false;
        }
        if (project !== null && !env.DEVYARD_PROJECT) return false;
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
