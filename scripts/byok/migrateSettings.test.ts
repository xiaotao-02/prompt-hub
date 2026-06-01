import { describe, expect, it } from 'vitest';
import { coerceByokProviderId } from './migrateSettings';

const VALID = new Set(['openai', 'anthropic', 'custom']);

describe('coerceByokProviderId', () => {
  it('maps platform to openai', () => {
    expect(coerceByokProviderId('platform', VALID)).toBe('openai');
  });

  it('keeps valid provider', () => {
    expect(coerceByokProviderId('anthropic', VALID)).toBe('anthropic');
  });

  it('maps unknown id to fallback', () => {
    expect(coerceByokProviderId('fidelity', VALID)).toBe('openai');
  });

  it('maps non-string to fallback', () => {
    expect(coerceByokProviderId(undefined, VALID)).toBe('openai');
  });
});
