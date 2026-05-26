import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { palette } from '../../src/theme/catppuccin.js';
import { semantic } from '../../src/theme/semantic.js';

const paletteHexValues = new Set(Object.values(palette));
const semanticEntries = Object.entries(semantic) as [string, string][];
const semanticKeys = Object.keys(semantic);

describe('semantic token coverage', () => {
  it('exports all 24 required token names', () => {
    const required = [
      'focus',
      'selection',
      'prompt',
      'success',
      'warning',
      'error',
      'info',
      'inProgress',
      'parked',
      'project',
      'code',
      'highlight',
      'body',
      'secondary',
      'muted',
      'placeholder',
      'disabled',
      'background',
      'panelBg',
      'outerBg',
      'border',
      'divider',
      'hoverBg',
      'selectedBg',
    ];
    for (const token of required) {
      expect(semanticKeys, `missing token: ${token}`).toContain(token);
    }
  });

  // Property 10: Semantic Token Coverage
  // For any semantic token name, its hex value must be a valid 7-char hex color
  // that exists in the Catppuccin Mocha palette.
  it('Property 10 — every semantic token resolves to a valid Catppuccin Mocha palette hex', () => {
    fc.assert(
      fc.property(fc.constantFrom(...semanticKeys), (tokenName) => {
        const value = semantic[tokenName as keyof typeof semantic];
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
        expect(paletteHexValues.has(value as string)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('every token value is a 7-character lowercase hex color', () => {
    for (const [token, value] of semanticEntries) {
      expect(value, `token "${token}" has invalid hex`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('every token value exists in the Catppuccin Mocha palette', () => {
    for (const [token, value] of semanticEntries) {
      expect(paletteHexValues.has(value), `token "${token}" value "${value}" not in palette`).toBe(
        true,
      );
    }
  });
});
