import { describe, expect, it, vi } from 'vitest';
import type { Check, CheckReport, CheckResult, DoctorContext } from '../../src/doctor/check.js';
import { runDoctor } from '../../src/doctor/check.js';
import { renderReport } from '../../src/doctor/render.js';

vi.mock('../../src/doctor/checks/index.js', () => ({ allChecks: [] }));
vi.mock('../../src/doctor/hooks-deep/index.js', () => ({ deepChecks: [] }));

const mockConfig = {
  vault: { path: '/tmp/vault', obsidian_app: null },
  ollama: { url: 'http://localhost:11434', timeout_ms: 1000 },
  claude: { binary: 'claude', default_role: 'default' },
  mcp: { obsidian: { command: 'npx', args: ['-y', 'obsidian-mcp-server'], env: {} } },
  ui: {
    panel_widths: [30, 70] as [number, number],
    show_parked_projects: false,
    show_archived_projects: false,
    spinner_style: 'dots' as const,
  },
  performance: {
    cold_start_budget_ms: 500,
    keystroke_budget_ms: 50,
    vault_scan_budget_ms: 100,
    hook_budget_ms: 200,
  },
  logging: { level: 'info' as const, path: '/tmp/devyard.log' },
  env: { github_token_var: 'GITHUB_TOKEN', gitlab_token_var: 'GITLAB_TOKEN' },
  portfolio: { mode: 'single' as const, public_root: null, private_root: null },
};

const ctx: DoctorContext = { config: mockConfig };

function makeCheck(overrides: Partial<Check> & { run: Check['run'] }): Check {
  return {
    id: 'test-check',
    category: 'test',
    label: 'Test Check',
    required: true,
    ...overrides,
  };
}

describe('CheckResult shape', () => {
  it('has all required fields and valid status values', async () => {
    const check = makeCheck({
      id: 'shape-check',
      async run() {
        return { status: 'pass' };
      },
    });

    const { allChecks } = await import('../../src/doctor/checks/index.js');
    (allChecks as Check[]).push(check);

    const report = await runDoctor(ctx);
    const result = report.results.find((r) => r.id === 'shape-check');

    expect(result).toBeDefined();
    if (!result) throw new Error('result not found');
    expect(result.id).toBeTypeOf('string');
    expect(result.category).toBeTypeOf('string');
    expect(result.label).toBeTypeOf('string');
    expect(['pass', 'warn', 'fail']).toContain(result.status);
    expect(result.required).toBeTypeOf('boolean');

    (allChecks as Check[]).length = 0;
  });
});

describe('runDoctor parallel execution', () => {
  it('runs all checks and returns results for each', async () => {
    const { allChecks } = await import('../../src/doctor/checks/index.js');

    const checks: Check[] = [
      makeCheck({
        id: 'c1',
        async run() {
          return { status: 'pass' };
        },
      }),
      makeCheck({
        id: 'c2',
        async run() {
          return { status: 'warn', message: 'some warning' };
        },
      }),
      makeCheck({
        id: 'c3',
        async run() {
          return { status: 'pass' };
        },
      }),
    ];

    for (const c of checks) (allChecks as Check[]).push(c);

    const report = await runDoctor(ctx);
    expect(report.results).toHaveLength(3);
    expect(report.results.map((r) => r.id)).toContain('c1');
    expect(report.results.map((r) => r.id)).toContain('c2');
    expect(report.results.map((r) => r.id)).toContain('c3');

    (allChecks as Check[]).length = 0;
  });
});

describe('runDoctor timeout behaviour', () => {
  it('marks a never-resolving check as fail after ~2s', async () => {
    const { allChecks } = await import('../../src/doctor/checks/index.js');

    const hangingCheck = makeCheck({
      id: 'hanging-check',
      required: true,
      async run() {
        await new Promise<never>(() => {});
        return { status: 'pass' };
      },
    });

    (allChecks as Check[]).push(hangingCheck);

    const start = Date.now();
    const report = await runDoctor(ctx);
    const elapsed = Date.now() - start;

    const result = report.results.find((r) => r.id === 'hanging-check');
    expect(result?.status).toBe('fail');
    expect(result?.message).toBe('Check timed out after 2s');
    expect(elapsed).toBeGreaterThanOrEqual(1900);

    (allChecks as Check[]).length = 0;
  }, 10000);
});

describe('runDoctor passed flag', () => {
  it('passed is true when all required checks pass', async () => {
    const { allChecks } = await import('../../src/doctor/checks/index.js');

    (allChecks as Check[]).push(
      makeCheck({
        id: 'p1',
        required: true,
        async run() {
          return { status: 'pass' };
        },
      }),
      makeCheck({
        id: 'p2',
        required: true,
        async run() {
          return { status: 'warn' };
        },
      }),
    );

    const report = await runDoctor(ctx);
    expect(report.passed).toBe(true);

    (allChecks as Check[]).length = 0;
  });

  it('passed is false when a required check fails', async () => {
    const { allChecks } = await import('../../src/doctor/checks/index.js');

    (allChecks as Check[]).push(
      makeCheck({
        id: 'f1',
        required: true,
        async run() {
          return { status: 'fail' };
        },
      }),
    );

    const report = await runDoctor(ctx);
    expect(report.passed).toBe(false);

    (allChecks as Check[]).length = 0;
  });

  it('passed is true when only a non-required check fails', async () => {
    const { allChecks } = await import('../../src/doctor/checks/index.js');

    (allChecks as Check[]).push(
      makeCheck({
        id: 'nr1',
        required: false,
        async run() {
          return { status: 'fail', message: 'optional failure' };
        },
      }),
      makeCheck({
        id: 'r1',
        required: true,
        async run() {
          return { status: 'pass' };
        },
      }),
    );

    const report = await runDoctor(ctx);
    expect(report.passed).toBe(true);

    (allChecks as Check[]).length = 0;
  });
});

describe('renderReport', () => {
  it('does not throw for a mix of pass/warn/fail results', () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      const results: CheckResult[] = [
        { id: 'a', category: 'env', label: 'A', status: 'pass', required: true },
        {
          id: 'b',
          category: 'env',
          label: 'B',
          status: 'warn',
          message: 'some warning',
          required: false,
        },
        {
          id: 'c',
          category: 'vault',
          label: 'C',
          status: 'fail',
          message: 'missing dir',
          remediation: 'Run devyard init',
          required: true,
        },
      ];
      const report: CheckReport = { results, passed: false };
      expect(() => renderReport(report)).not.toThrow();
    } finally {
      write.mockRestore();
    }
  });
});
