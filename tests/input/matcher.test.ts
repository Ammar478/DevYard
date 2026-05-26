import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ProjectMatcher } from '../../src/input/matcher.js';

describe('ProjectMatcher', () => {
  // ---------------------------------------------------------------------------
  // Property 7: Trie Completeness
  // ---------------------------------------------------------------------------

  it('Property 7 — every inserted name is exactly matchable', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ unit: 'grapheme-ascii', minLength: 1, maxLength: 30 }), {
          minLength: 1,
          maxLength: 20,
        }),
        (names) => {
          // Deduplicate case-insensitively: trie stores one name per lowercase path
          const unique = [...new Map(names.map((n) => [n.toLowerCase(), n])).values()];
          const matcher = new ProjectMatcher(unique);
          for (const name of unique) {
            expect(matcher.match(name)).toBe(name);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('match is case-insensitive', () => {
    const matcher = new ProjectMatcher(['MyProject', 'another-app']);
    expect(matcher.match('myproject')).toBe('MyProject');
    expect(matcher.match('MYPROJECT')).toBe('MyProject');
    expect(matcher.match('ANOTHER-APP')).toBe('another-app');
  });

  it('match returns null for unknown names', () => {
    const matcher = new ProjectMatcher(['alpha', 'beta']);
    expect(matcher.match('gamma')).toBeNull();
    expect(matcher.match('')).toBeNull();
    expect(matcher.match('alph')).toBeNull(); // prefix, not exact
  });

  it('suggest returns up to 5 prefix matches', () => {
    const names = ['alpha', 'algebra', 'algorithm', 'aliasing', 'alignment', 'alt', 'beta'];
    const matcher = new ProjectMatcher(names);
    const results = matcher.suggest('al');
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.toLowerCase()).toMatch(/^al/);
    }
  });

  it('suggest returns empty array when prefix has no matches', () => {
    const matcher = new ProjectMatcher(['alpha', 'beta']);
    expect(matcher.suggest('zzz')).toEqual([]);
  });

  it('suggest is case-insensitive', () => {
    const matcher = new ProjectMatcher(['MyProject', 'MyApp']);
    const results = matcher.suggest('MY');
    expect(results).toHaveLength(2);
  });

  it('handles empty project list', () => {
    const matcher = new ProjectMatcher([]);
    expect(matcher.match('anything')).toBeNull();
    expect(matcher.suggest('any')).toEqual([]);
  });

  it('suggest returns original casing even when matched case-insensitively', () => {
    const matcher = new ProjectMatcher(['DevYard', 'DevTools']);
    const results = matcher.suggest('dev');
    expect(results).toContain('DevYard');
    expect(results).toContain('DevTools');
  });
});
