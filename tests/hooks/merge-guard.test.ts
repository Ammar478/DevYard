import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// Property 13: SHA Marker Validation
// Models the approval logic from block-unreviewed-merge.sh

/**
 * Returns true only when:
 * - rexSha is non-empty and equals headSha
 * - ceoSha is non-empty and equals headSha
 */
function shouldAllowMerge(
  rexSha: string | undefined,
  ceoSha: string | undefined,
  headSha: string,
): boolean {
  if (!rexSha || !ceoSha) return false;
  return rexSha === headSha && ceoSha === headSha;
}

// Generate 40-char lowercase hex strings (git SHA format)
const sha40 = (): fc.Arbitrary<string> => fc.stringMatching(/^[0-9a-f]{40}$/);

// Generate a SHA that is different from the given one (stale approval)
const staleSha = (headSha: string): fc.Arbitrary<string> => sha40().filter((s) => s !== headSha);

describe('block-unreviewed-merge.sh — property 13: SHA marker validation', () => {
  it('allows merge when both rex and ceo SHAs match HEAD exactly', () => {
    fc.assert(
      fc.property(sha40(), (headSha) => {
        expect(shouldAllowMerge(headSha, headSha, headSha)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('blocks merge when rex SHA is missing', () => {
    fc.assert(
      fc.property(sha40(), (headSha) => {
        expect(shouldAllowMerge(undefined, headSha, headSha)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('blocks merge when ceo SHA is missing', () => {
    fc.assert(
      fc.property(sha40(), (headSha) => {
        expect(shouldAllowMerge(headSha, undefined, headSha)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('blocks merge when both approvals are missing', () => {
    fc.assert(
      fc.property(sha40(), (headSha) => {
        expect(shouldAllowMerge(undefined, undefined, headSha)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('blocks merge when rex SHA does not match HEAD (stale approval)', () => {
    fc.assert(
      fc.property(
        sha40().chain((headSha) => staleSha(headSha).map((stale) => ({ headSha, stale }))),
        ({ headSha, stale }) => {
          expect(shouldAllowMerge(stale, headSha, headSha)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('blocks merge when ceo SHA does not match HEAD (stale approval)', () => {
    fc.assert(
      fc.property(
        sha40().chain((headSha) => staleSha(headSha).map((stale) => ({ headSha, stale }))),
        ({ headSha, stale }) => {
          expect(shouldAllowMerge(headSha, stale, headSha)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('blocks merge when both approvals are stale', () => {
    fc.assert(
      fc.property(
        sha40().chain((headSha) =>
          fc
            .tuple(staleSha(headSha), staleSha(headSha))
            .map(([rexSha, ceoSha]) => ({ headSha, rexSha, ceoSha })),
        ),
        ({ headSha, rexSha, ceoSha }) => {
          expect(shouldAllowMerge(rexSha, ceoSha, headSha)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('blocks merge when empty string is used as SHA (missing marker edge case)', () => {
    fc.assert(
      fc.property(sha40(), (headSha) => {
        expect(shouldAllowMerge('', headSha, headSha)).toBe(false);
        expect(shouldAllowMerge(headSha, '', headSha)).toBe(false);
        expect(shouldAllowMerge('', '', headSha)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
