import { describe, expect, it } from 'vitest';
import { referencesCss } from './references';

describe('referencesCss', () => {
  it('wraps reference thumbnails instead of horizontal scroll', () => {
    expect(referencesCss).toContain('flex-wrap: wrap');
    expect(referencesCss).not.toContain('flex-wrap: nowrap');
    expect(referencesCss).not.toContain('overflow-x: auto');
  });

  it('lets ref-thumb-wrap grow with wrapped content', () => {
    expect(referencesCss).toMatch(/\.ref-thumb-wrap[\s\S]*height: auto/);
    expect(referencesCss).toContain('min-height: 160px');
    expect(referencesCss).not.toMatch(/\.ref-thumb-wrap[\s\S]*max-height: 128px/);
    expect(referencesCss).toMatch(/\.ref-strip[\s\S]*height: auto/);
    expect(referencesCss).toMatch(/\.ref-strip[\s\S]*max-height: none/);
  });
});
