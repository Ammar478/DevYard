import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import matter from 'gray-matter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { Config } from '../../src/config/types.js';
import { scanVault } from '../../src/data/vault-scanner.js';

const tmp = join(tmpdir(), `devyard-vs-test-${process.pid}`);

function makeConfig(vaultPath: string): Config {
  return { ...DEFAULT_CONFIG, vault: { ...DEFAULT_CONFIG.vault, path: vaultPath } };
}

const validFm = {
  name: 'my-project',
  type: 'project',
  status: 'active',
  tier: 'P1',
  repos: [],
  last_branch: null,
  last_ticket: null,
  last_session: null,
  stack: ['TypeScript'],
  created: '2024-01-01',
  team: null,
};

function writeReadme(projectDir: string, fm: Record<string, unknown>, body = '') {
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(join(projectDir, 'README.md'), matter.stringify(body, fm), 'utf-8');
}

beforeEach(() => mkdirSync(tmp, { recursive: true }));
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

describe('scanVault', () => {
  it('returns empty result when vault does not exist', async () => {
    const result = await scanVault(makeConfig(join(tmp, 'nonexistent')));
    expect(result.projects).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('returns empty result when Projects/ directory is empty', async () => {
    mkdirSync(join(tmp, 'Projects'), { recursive: true });
    const result = await scanVault(makeConfig(tmp));
    expect(result.projects).toHaveLength(0);
  });

  it('scans a valid project and returns it in projects array', async () => {
    writeReadme(join(tmp, 'Projects', 'my-project'), validFm);
    const result = await scanVault(makeConfig(tmp));
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]?.frontmatter.name).toBe('my-project');
    expect(result.warnings).toHaveLength(0);
  });

  it('adds a warning for a project with missing README', async () => {
    mkdirSync(join(tmp, 'Projects', 'no-readme'), { recursive: true });
    const result = await scanVault(makeConfig(tmp));
    expect(result.projects).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.reason).toBe('missing-readme');
  });

  it('adds a warning for a project with invalid YAML', async () => {
    const dir = join(tmp, 'Projects', 'bad-yaml');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'README.md'), '---\nname: [unclosed\n---\n', 'utf-8');
    const result = await scanVault(makeConfig(tmp));
    expect(
      result.warnings.some((w) => w.reason === 'invalid-yaml' || w.reason === 'schema-failure'),
    ).toBe(true);
  });

  it('adds a warning with field name for a project failing schema validation', async () => {
    writeReadme(join(tmp, 'Projects', 'bad-schema'), {
      type: 'project',
      name: 'bad-schema',
      status: 'invalid-status', // wrong enum
      tier: 'P1',
      repos: [],
      last_branch: null,
      last_ticket: null,
      last_session: null,
      stack: [],
      created: '2024-01-01',
      team: null,
    });
    const result = await scanVault(makeConfig(tmp));
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.reason).toBe('schema-failure');
    expect(result.warnings[0]?.fields).toMatch(/status/);
  });

  it('ScanResult contains both projects and matcher', async () => {
    writeReadme(join(tmp, 'Projects', 'proj-a'), { ...validFm, name: 'proj-a' });
    const result = await scanVault(makeConfig(tmp));
    expect(result).toHaveProperty('projects');
    expect(result).toHaveProperty('matcher');
    expect(result.matcher.match('proj-a')).toBe('proj-a');
  });

  it('50 projects complete within 1000ms', async () => {
    for (let i = 0; i < 50; i++) {
      writeReadme(join(tmp, 'Projects', `proj-${i}`), { ...validFm, name: `proj-${i}` });
    }
    const start = performance.now();
    const result = await scanVault(makeConfig(tmp));
    const elapsed = performance.now() - start;
    expect(result.projects).toHaveLength(50);
    expect(elapsed).toBeLessThan(1000);
  });

  it('matcher built from scanned project names supports prefix search', async () => {
    writeReadme(join(tmp, 'Projects', 'alpha'), { ...validFm, name: 'alpha' });
    writeReadme(join(tmp, 'Projects', 'algebra'), { ...validFm, name: 'algebra' });
    writeReadme(join(tmp, 'Projects', 'beta'), { ...validFm, name: 'beta' });
    const result = await scanVault(makeConfig(tmp));
    const suggestions = result.matcher.suggest('al');
    expect(suggestions.length).toBe(2);
    expect(suggestions).toContain('alpha');
    expect(suggestions).toContain('algebra');
  });
});
