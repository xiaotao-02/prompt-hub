import { describe, expect, it } from 'vitest';
import { looksLikePlaceholder, softFixJson, unwrap } from './jsonHelpers';

describe('configImport jsonHelpers', () => {
  it('unwrap returns object payloads', () => {
    expect(unwrap({ apiKey: 'sk-test' })).toEqual({ apiKey: 'sk-test' });
  });

  it('softFixJson repairs trailing commas', () => {
    const fixed = softFixJson('{ "a": 1, }');
    expect(JSON.parse(fixed)).toEqual({ a: 1 });
  });

  it('looksLikePlaceholder detects sk-xxxx patterns', () => {
    expect(looksLikePlaceholder('sk-xxxx')).toBe(true);
    expect(looksLikePlaceholder('sk-abc123realkey')).toBe(false);
  });
});
