import { describe, expect, it } from 'vitest';
import { buildUsesFullLibraryScan, DEFAULT_LIBRARY_SCAN_INPUT } from './libraryScanInput';

describe('buildUsesFullLibraryScan', () => {
  it('returns false for default filters', () => {
    expect(buildUsesFullLibraryScan(DEFAULT_LIBRARY_SCAN_INPUT)).toBe(false);
  });

  it('returns true when keyword is non-empty', () => {
    expect(
      buildUsesFullLibraryScan({
        ...DEFAULT_LIBRARY_SCAN_INPUT,
        deferredKeyword: 'portrait',
      }),
    ).toBe(true);
  });

  it('returns true when filterProvider is not all', () => {
    expect(
      buildUsesFullLibraryScan({
        ...DEFAULT_LIBRARY_SCAN_INPUT,
        filterProvider: 'openai',
      }),
    ).toBe(true);
  });
});
