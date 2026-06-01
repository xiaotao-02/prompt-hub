import { describe, expect, it } from 'vitest';
import { previewMaxLen } from './versionsListDensity';

describe('previewMaxLen', () => {
  it('returns panel and popup lengths per density', () => {
    expect(previewMaxLen('comfortable', 'panel')).toBe(120);
    expect(previewMaxLen('compact', 'panel')).toBe(72);
    expect(previewMaxLen('comfortable', 'popup')).toBe(80);
    expect(previewMaxLen('compact', 'popup')).toBe(56);
  });
});
