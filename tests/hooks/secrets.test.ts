import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// Property 12: Secret Pattern Detection
// These patterns mirror the regexes in check-secrets.sh

const SECRET_PATTERNS: ReadonlyArray<{ name: string; regex: RegExp }> = [
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub PAT (ghp_)', regex: /ghp_[A-Za-z0-9]{36}/ },
  { name: 'GitHub OAuth token (gho_)', regex: /gho_[A-Za-z0-9]{36}/ },
  { name: 'Slack token', regex: /xox[baprs]-[0-9A-Za-z-]+/ },
  { name: 'PEM private key header', regex: /-----BEGIN .* PRIVATE KEY-----/ },
];

function matchesAnyPattern(text: string): boolean {
  return SECRET_PATTERNS.some(({ regex }) => regex.test(text));
}

// Generators for known-bad strings
const awsKey = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[0-9A-Z]{16}$/).map((suffix) => `AKIA${suffix}`);

const ghpToken = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[A-Za-z0-9]{36}$/).map((suffix) => `ghp_${suffix}`);

const ghoToken = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[A-Za-z0-9]{36}$/).map((suffix) => `gho_${suffix}`);

const slackToken = (): fc.Arbitrary<string> =>
  fc
    .constantFrom('b', 'a', 'p', 'r', 's')
    .chain((ch) => fc.stringMatching(/^[0-9A-Za-z-]{6,30}$/).map((body) => `xox${ch}-${body}`));

const pemHeader = (): fc.Arbitrary<string> =>
  fc
    .constantFrom('RSA', 'EC', 'DSA', 'OPENSSH')
    .map((algo) => `-----BEGIN ${algo} PRIVATE KEY-----`);

// Generator for strings that should NOT contain secrets
// Use printable ASCII excluding the secret prefix characters in context
const cleanString = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[a-z0-9 _.,;:@#%^&*()\[\]{}]{0,80}$/).filter((s) => !matchesAnyPattern(s));

describe('check-secrets.sh patterns — property 12: secret pattern detection', () => {
  it('AWS key pattern matches AKIA + 16 uppercase alphanumerics', () => {
    fc.assert(
      fc.property(awsKey(), (key) => {
        expect(matchesAnyPattern(key)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('GitHub PAT (ghp_) matches 36 alphanumeric chars after prefix', () => {
    fc.assert(
      fc.property(ghpToken(), (token) => {
        expect(matchesAnyPattern(token)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('GitHub OAuth token (gho_) matches 36 alphanumeric chars after prefix', () => {
    fc.assert(
      fc.property(ghoToken(), (token) => {
        expect(matchesAnyPattern(token)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('Slack token matches xox[baprs]- prefix', () => {
    fc.assert(
      fc.property(slackToken(), (token) => {
        expect(matchesAnyPattern(token)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('PEM private key header matches -----BEGIN * PRIVATE KEY-----', () => {
    fc.assert(
      fc.property(pemHeader(), (header) => {
        expect(matchesAnyPattern(header)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('secret embedded in surrounding text is still detected', () => {
    fc.assert(
      fc.property(
        fc.oneof(awsKey(), ghpToken(), ghoToken(), slackToken(), pemHeader()),
        fc.string({ maxLength: 20 }),
        fc.string({ maxLength: 20 }),
        (secret, prefix, suffix) => {
          const text = `${prefix}${secret}${suffix}`;
          expect(matchesAnyPattern(text)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('clean strings do not match any secret pattern', () => {
    fc.assert(
      fc.property(cleanString(), (text) => {
        expect(matchesAnyPattern(text)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('individual pattern regexes are correctly scoped', () => {
    // Spot-check: short prefix alone should not match AWS
    expect(/AKIA[0-9A-Z]{16}/.test('AKIA')).toBe(false);
    expect(/AKIA[0-9A-Z]{16}/.test('AKIASHORTKEY')).toBe(false);
    // Exactly 16 chars after AKIA
    expect(/AKIA[0-9A-Z]{16}/.test('AKIAIOSFODNN7EXAMPLE')).toBe(true);
  });
});
