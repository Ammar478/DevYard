import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { getAutocompleteSuggestion } from '../../src/input/autocomplete.js';
import { type DispatchContext, dispatch } from '../../src/input/dispatcher.js';
import { navigateHistory } from '../../src/input/history.js';
import { ProjectMatcher } from '../../src/input/matcher.js';
import type { SkillDefinition } from '../../src/skills/types.js';

// ── fixtures ──────────────────────────────────────────────────────────────────

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

const PROJECT_NAMES = [
  'DevYard',
  'MyApp',
  'Backend-Service',
  'FrontendUI',
  'DataPipeline',
] as const;

function makeStubSkill(id: string): SkillDefinition {
  return { id, role: 'hisham', description: 'test', usage: `/${id}` };
}

function makeCtx(projects: readonly string[], skillIds: readonly string[]): DispatchContext {
  const skillMap = new Map(skillIds.map((id) => [id, makeStubSkill(id)]));
  return {
    matcher: new ProjectMatcher(projects),
    skills: { resolve: (id) => skillMap.get(id) ?? null },
  };
}

// ── Property 3: Input Dispatcher — Project Navigation ─────────────────────────

describe('dispatch', () => {
  it('Property 3 — any registered project name dispatches to navigate', async () => {
    const ctx = makeCtx(PROJECT_NAMES, SKILL_IDS);
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...PROJECT_NAMES), async (name) => {
        const action = await dispatch(name, ctx);
        return action.kind === 'navigate' && action.project === name;
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 4: Input Dispatcher — Skill Launch ──────────────────────────────

  it('Property 4 — /id for any of the 49 skill IDs dispatches to launch-skill', async () => {
    const ctx = makeCtx(PROJECT_NAMES, SKILL_IDS);
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...SKILL_IDS), async (id) => {
        const action = await dispatch(`/${id}`, ctx);
        if (action.kind !== 'launch-skill') return false;
        return action.skill.id === id;
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 5: Input Dispatcher — Freeform Fallback ─────────────────────────

  it('Property 5 — non-empty non-/ non-project input dispatches to freeform-query', async () => {
    const ctx = makeCtx(PROJECT_NAMES, SKILL_IDS);
    const projectNamesLower = new Set(PROJECT_NAMES.map((n) => n.toLowerCase()));

    const freeformArb = fc.string({ minLength: 1 }).filter((s) => {
      const t = s.trim();
      return t.length > 0 && !t.startsWith('/') && !projectNamesLower.has(t.toLowerCase());
    });

    await fc.assert(
      fc.asyncProperty(freeformArb, async (input) => {
        const action = await dispatch(input, ctx);
        if (action.kind !== 'freeform-query') return false;
        return action.text === input.trim();
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 6: Input Dispatcher — Unknown Skill Error ───────────────────────

  it('Property 6 — /unknown-skill dispatches to error (not crash, not freeform)', async () => {
    const ctx = makeCtx(PROJECT_NAMES, SKILL_IDS);
    const knownSkills = new Set<string>(SKILL_IDS);

    const unknownSkillArb = fc
      .stringMatching(/^[a-z][a-z-]{1,20}$/)
      .filter((s) => !knownSkills.has(s));

    await fc.assert(
      fc.asyncProperty(unknownSkillArb, async (id) => {
        const action = await dispatch(`/${id}`, ctx);
        return action.kind === 'error';
      }),
      { numRuns: 100 },
    );
  });

  // ── unit tests ────────────────────────────────────────────────────────────────

  it('empty input returns noop', async () => {
    const ctx = makeCtx([], []);
    expect(await dispatch('', ctx)).toEqual({ kind: 'noop' });
    expect(await dispatch('   ', ctx)).toEqual({ kind: 'noop' });
  });

  it('navigate action carries original casing from trie', async () => {
    const ctx = makeCtx(['MyApp'], []);
    const action = await dispatch('myapp', ctx);
    expect(action).toEqual({ kind: 'navigate', project: 'MyApp' });
  });

  it('error message includes the full /skill token', async () => {
    const ctx = makeCtx([], []);
    const action = await dispatch('/not-a-skill', ctx);
    expect(action.kind).toBe('error');
    if (action.kind === 'error') expect(action.message).toContain('/not-a-skill');
  });
});

// ── autocomplete ──────────────────────────────────────────────────────────────

describe('getAutocompleteSuggestion', () => {
  it('returns the first suggestion for a matching prefix', () => {
    const matcher = new ProjectMatcher(['DevYard', 'DevTools', 'DataPipeline']);
    expect(getAutocompleteSuggestion('Dev', matcher)).toMatch(/^Dev/i);
  });

  it('returns null when no projects match the prefix', () => {
    const matcher = new ProjectMatcher(['Alpha', 'Beta']);
    expect(getAutocompleteSuggestion('zzz', matcher)).toBeNull();
  });

  it('returns null for an empty project registry', () => {
    const matcher = new ProjectMatcher([]);
    expect(getAutocompleteSuggestion('dev', matcher)).toBeNull();
  });
});

// ── history navigation ────────────────────────────────────────────────────────

describe('navigateHistory', () => {
  const entries = ['first', 'second', 'third'];

  it('up from -1 goes to newest entry', () => {
    const r = navigateHistory(entries, -1, 'up');
    expect(r.entry).toBe('third');
    expect(r.newIdx).toBe(2);
  });

  it('up from first entry stays at first entry', () => {
    const r = navigateHistory(entries, 0, 'up');
    expect(r.entry).toBe('first');
    expect(r.newIdx).toBe(0);
  });

  it('down from newest entry returns to idle (-1)', () => {
    const r = navigateHistory(entries, 2, 'down');
    expect(r.entry).toBe('');
    expect(r.newIdx).toBe(-1);
  });

  it('down from -1 stays at idle', () => {
    const r = navigateHistory(entries, -1, 'down');
    expect(r.entry).toBe('');
    expect(r.newIdx).toBe(-1);
  });

  it('up then down round-trips correctly', () => {
    const r1 = navigateHistory(entries, -1, 'up'); // → idx 2
    const r2 = navigateHistory(entries, r1.newIdx, 'down'); // → idx -1
    expect(r2.newIdx).toBe(-1);
    expect(r2.entry).toBe('');
  });

  it('returns empty string for empty entries list', () => {
    const r = navigateHistory([], -1, 'up');
    expect(r.entry).toBe('');
    expect(r.newIdx).toBe(-1);
  });
});
