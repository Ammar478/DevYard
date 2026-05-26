import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appendAuditLog } from '../../src/hooks/audit-log.js';
import type { AuditEntry } from '../../src/hooks/audit-log.js';

// Redirect log output to a temp dir per test run
const TEST_DIR = join(tmpdir(), `devyard-audit-test-${process.pid}`);
const TEST_LOG = join(TEST_DIR, 'logs', 'hook-audit.log');

vi.mock('../../src/utils/paths.js', () => ({
  opsRoot: () => TEST_DIR,
  vaultPath: (c: unknown) => '',
  hookPath: (n: string) => '',
  skillPath: (id: string) => '',
  rolePath: (d: string, n: string) => '',
  agentPath: (n: string) => '',
  rulePath: (n: string) => '',
}));

beforeEach(() => {
  mkdirSync(join(TEST_DIR, 'logs'), { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

// Property 11: Audit Log Record Completeness
describe('appendAuditLog — property 11: record completeness', () => {
  it('every appended record contains all 4 required fields', () => {
    fc.assert(
      fc.property(
        fc.record<AuditEntry>({
          timestamp: fc
            .date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
            .map((d) => d.toISOString()),
          hookName: fc.stringMatching(/^[a-z][a-z0-9-]{1,40}$/),
          result: fc.constantFrom('blocked' as const, 'allowed' as const),
          input: fc.string({ minLength: 0, maxLength: 200 }),
        }),
        (entry) => {
          appendAuditLog(entry);

          const contents = readFileSync(TEST_LOG, 'utf8');
          const lines = contents.split('\n').filter(Boolean);
          const last = lines[lines.length - 1] ?? '';

          // All 4 fields must appear in each record separated by ' | '
          expect(last).toContain(entry.timestamp);
          expect(last).toContain(entry.hookName);
          expect(last).toContain(entry.result);
          // Input may be empty string; verify format
          const parts = last.split(' | ');
          expect(parts.length).toBeGreaterThanOrEqual(4);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('record format is: TIMESTAMP | hookName | result | input', () => {
    const entry: AuditEntry = {
      timestamp: '2026-05-25T10:00:00.000Z',
      hookName: 'check-secrets',
      result: 'blocked',
      input: 'git commit -m "feat: add key"',
    };

    appendAuditLog(entry);

    const contents = readFileSync(TEST_LOG, 'utf8');
    const line = contents.trim();

    expect(line).toBe(
      '2026-05-25T10:00:00.000Z | check-secrets | blocked | git commit -m "feat: add key"',
    );
  });

  it('result field is always either "blocked" or "allowed"', () => {
    fc.assert(
      fc.property(
        fc.record<AuditEntry>({
          timestamp: fc.constant(new Date().toISOString()),
          hookName: fc.constant('test-hook'),
          result: fc.constantFrom('blocked' as const, 'allowed' as const),
          input: fc.string({ maxLength: 50 }),
        }),
        (entry) => {
          appendAuditLog(entry);

          const contents = readFileSync(TEST_LOG, 'utf8');
          const lines = contents.split('\n').filter(Boolean);
          const last = lines[lines.length - 1] ?? '';
          const parts = last.split(' | ');

          // result is the 3rd part (index 2)
          expect(parts[2]).toMatch(/^(blocked|allowed)$/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('timestamp is ISO 8601', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }), (date) => {
        const entry: AuditEntry = {
          timestamp: date.toISOString(),
          hookName: 'ts-test',
          result: 'allowed',
          input: 'noop',
        };

        appendAuditLog(entry);

        const contents = readFileSync(TEST_LOG, 'utf8');
        const lines = contents.split('\n').filter(Boolean);
        const last = lines[lines.length - 1] ?? '';
        const tsStr = last.split(' | ')[0] ?? '';

        // ISO 8601 validation
        expect(() => new Date(tsStr)).not.toThrow();
        expect(new Date(tsStr).toISOString()).toBe(date.toISOString());
      }),
      { numRuns: 100 },
    );
  });
});
