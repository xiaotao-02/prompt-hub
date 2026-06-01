import { describe, expect, it } from 'vitest';
import { parseFirstCssImageUrl } from './mediaHit';

describe('parseFirstCssImageUrl', () => {
  it('returns an empty string for empty and none values', () => {
    expect(parseFirstCssImageUrl('')).toBe('');
    expect(parseFirstCssImageUrl('none')).toBe('');
  });

  it('parses quoted CSS image URLs', () => {
    expect(parseFirstCssImageUrl('url("https://example.com/a.png")')).toBe(
      'https://example.com/a.png',
    );
    expect(parseFirstCssImageUrl("url('/assets/a b.webp')")).toBe('/assets/a b.webp');
  });

  it('parses unquoted CSS image URLs', () => {
    expect(
      parseFirstCssImageUrl('linear-gradient(red, blue), url(https://example.com/b.jpg)'),
    ).toBe('https://example.com/b.jpg');
  });
});
