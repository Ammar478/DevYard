import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as fc from 'fast-check';
import matter from 'gray-matter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  readFrontmatter,
  updateProjectFrontmatter,
  writeFrontmatter,
} from '../../src/data/frontmatter.js';
import { FrontmatterValidationError } from '../../src/data/types.js';

const tmp = join(tmpdir(), `devyard-fm-test-${process.pid}`);

beforeEach(() => mkdirSync(tmp, { recursive: true }));
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

function writeMd(name: string, fm: Record<string, unknown>, body = '') {
  const path = join(tmp, name);
  writeFileSync(path, matter.stringify(body, fm), 'utf-8');
  return path;
}

// ---------------------------------------------------------------------------
// Arbitraries for valid frontmatter objects
// ---------------------------------------------------------------------------

const safeStr = fc.string({ unit: 'grapheme-ascii', minLength: 1, maxLength: 40 });
const isoDate = fc
  .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString().slice(0, 10));
const nullable = <T>(arb: fc.Arbitrary<T>) => fc.option(arb, { nil: null });

const projectArb = fc.record({
  name: safeStr,
  type: fc.constant('project' as const),
  status: fc.constantFrom('created', 'active', 'parked', 'archived' as const),
  tier: fc.constantFrom('P0', 'P1', 'P2' as const),
  repos: fc.array(safeStr, { maxLength: 3 }),
  last_branch: nullable(safeStr),
  last_ticket: nullable(safeStr),
  last_session: nullable(safeStr),
  stack: fc.array(safeStr, { maxLength: 5 }),
  created: isoDate,
  team: nullable(safeStr),
});

const ideaArb = fc.record({
  id: fc.nat(999).map((n) => `IDEA-${String(n).padStart(3, '0')}`),
  title: safeStr,
  type: fc.constant('idea' as const),
  tags: fc.array(safeStr, { maxLength: 3 }),
  created: isoDate,
  verdict: fc.option(fc.constantFrom('GREEN', 'YELLOW', 'RED' as const), { nil: null }),
  promoted_to: nullable(safeStr),
  archived: fc.boolean(),
});

const brdArb = fc.record({
  title: safeStr,
  type: fc.constant('brd' as const),
  version: fc.tuple(fc.nat(9), fc.nat(9)).map(([maj, min]) => `${maj}.${min}`),
  status: fc.constantFrom('draft', 'approved', 'done' as const),
  linked_tasks: fc.array(safeStr, { maxLength: 3 }),
  linked_mr: nullable(safeStr),
  linked_idea: nullable(safeStr),
  created: isoDate,
  approved_at: nullable(isoDate),
  author: safeStr,
});

// ---------------------------------------------------------------------------
// Property 1: Frontmatter Round-Trip (ProjectFrontmatter)
// ---------------------------------------------------------------------------

describe('Property 1 — ProjectFrontmatter round-trip', () => {
  it('serializing then parsing produces a deeply equal object', () => {
    fc.assert(
      fc.property(projectArb, (original) => {
        const serialized = matter.stringify('', original);
        const parsed = matter(serialized).data;
        expect(parsed).toEqual(original);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: All Frontmatter Types Round-Trip (via writeFrontmatter + readFrontmatter)
// ---------------------------------------------------------------------------

describe('Property 2 — All frontmatter types round-trip through write+read', () => {
  it('project round-trip', () => {
    fc.assert(
      fc.property(projectArb, (original) => {
        const path = join(tmp, `project-${Math.random().toString(36).slice(2)}.md`);
        writeFrontmatter(path, original);
        const parsed = readFrontmatter(path);
        expect(parsed).toEqual(original);
      }),
      { numRuns: 50 },
    );
  });

  it('idea round-trip', () => {
    fc.assert(
      fc.property(ideaArb, (original) => {
        const path = join(tmp, `idea-${Math.random().toString(36).slice(2)}.md`);
        writeFrontmatter(path, original);
        const parsed = readFrontmatter(path);
        expect(parsed).toEqual(original);
      }),
      { numRuns: 50 },
    );
  });

  it('brd round-trip', () => {
    fc.assert(
      fc.property(brdArb, (original) => {
        const path = join(tmp, `brd-${Math.random().toString(36).slice(2)}.md`);
        writeFrontmatter(path, original);
        const parsed = readFrontmatter(path);
        expect(parsed).toEqual(original);
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Frontmatter Validation Rejects Invalid Data
// ---------------------------------------------------------------------------

describe('Property 9 — writeFrontmatter rejects invalid data without writing', () => {
  it('throws FrontmatterValidationError when a required field is missing', () => {
    fc.assert(
      fc.property(
        projectArb,
        fc.constantFrom('name', 'status', 'tier', 'repos', 'created'),
        (original, fieldToRemove) => {
          const broken = { ...original } as Record<string, unknown>;
          delete broken[fieldToRemove];
          const path = join(tmp, `invalid-${Math.random().toString(36).slice(2)}.md`);
          expect(() => writeFrontmatter(path, broken as never)).toThrow(FrontmatterValidationError);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('throws FrontmatterValidationError when status has an invalid enum value', () => {
    fc.assert(
      fc.property(projectArb, (original) => {
        const broken = { ...original, status: 'bogus-status' };
        const path = join(tmp, `invalid-${Math.random().toString(36).slice(2)}.md`);
        expect(() => writeFrontmatter(path, broken as never)).toThrow(FrontmatterValidationError);
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests for readFrontmatter, updateProjectFrontmatter, atomicWrite
// ---------------------------------------------------------------------------

describe('readFrontmatter', () => {
  it('reads and validates a valid project file', () => {
    const path = writeMd('proj.md', {
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
    });
    const fm = readFrontmatter(path);
    expect(fm).toMatchObject({ name: 'my-project', type: 'project', status: 'active' });
  });

  it('throws FrontmatterValidationError for unknown type', () => {
    const path = writeMd('unknown.md', { type: 'unknown-type', title: 'x' });
    expect(() => readFrontmatter(path)).toThrow(FrontmatterValidationError);
    try {
      readFrontmatter(path);
    } catch (e) {
      expect((e as FrontmatterValidationError).field).toBe('type');
    }
  });

  it('throws FrontmatterValidationError identifying the failing field', () => {
    const path = writeMd('bad-project.md', {
      type: 'project',
      name: 'x',
      status: 'invalid-status',
      tier: 'P0',
      repos: [],
      last_branch: null,
      last_ticket: null,
      last_session: null,
      stack: [],
      created: '2024-01-01',
      team: null,
    });
    expect(() => readFrontmatter(path)).toThrow(FrontmatterValidationError);
    try {
      readFrontmatter(path);
    } catch (e) {
      expect((e as FrontmatterValidationError).field).toMatch(/status/);
    }
  });
});

describe('updateProjectFrontmatter', () => {
  it('merges partial update and writes atomically', () => {
    const path = writeMd('proj.md', {
      name: 'my-project',
      type: 'project',
      status: 'created',
      tier: 'P1',
      repos: [],
      last_branch: null,
      last_ticket: null,
      last_session: null,
      stack: [],
      created: '2024-01-01',
      team: null,
    });
    updateProjectFrontmatter(path, { status: 'active', last_branch: 'feat/PROJ-1-setup' });
    const updated = readFrontmatter(path);
    expect(updated).toMatchObject({ status: 'active', last_branch: 'feat/PROJ-1-setup' });
  });

  it('throws FrontmatterValidationError and does not write on invalid update', () => {
    const path = writeMd('proj.md', {
      name: 'my-project',
      type: 'project',
      status: 'created',
      tier: 'P1',
      repos: [],
      last_branch: null,
      last_ticket: null,
      last_session: null,
      stack: [],
      created: '2024-01-01',
      team: null,
    });
    expect(() => updateProjectFrontmatter(path, { status: 'invalid' as never })).toThrow(
      FrontmatterValidationError,
    );
    // Original content unchanged
    const unchanged = readFrontmatter(path);
    expect(unchanged).toMatchObject({ status: 'created' });
  });
});
