import { describe, expect, it } from 'vitest';
import { buildVisionById } from './modelVision';
import { isUnresolvedModel, pickDefaultModelFromDiscovered } from './modelPick';

describe('isUnresolvedModel', () => {
  it('treats empty and default placeholder as unresolved', () => {
    expect(isUnresolvedModel('custom', '', [])).toBe(true);
    expect(isUnresolvedModel('custom', 'your-model', [])).toBe(true);
  });

  it('treats model not in discovered list as unresolved', () => {
    expect(isUnresolvedModel('openai', 'gpt-4o', ['gpt-4o-mini'])).toBe(true);
  });

  it('keeps valid discovered model', () => {
    expect(isUnresolvedModel('openai', 'gpt-4o-mini', ['gpt-4o-mini', 'gpt-4o'])).toBe(false);
  });
});

describe('pickDefaultModelFromDiscovered', () => {
  it('prefers newest vision-capable model for extract purpose', () => {
    const visionIds = ['text-embedding-3-small', 'gpt-4o-mini', 'gpt-4o'];
    const byId = buildVisionById('openai', visionIds);
    expect(pickDefaultModelFromDiscovered('openai', visionIds, byId, { purpose: 'vision' })).toBe(
      'gpt-4o',
    );
  });

  it('avoids embed models for text purpose and prefers fast chat models', () => {
    const textIds = ['text-embedding-3-small', 'gpt-3.5-turbo', 'claude-3-5-haiku-latest'];
    const byId = buildVisionById('openai', textIds);
    const picked = pickDefaultModelFromDiscovered('openai', textIds, byId, { purpose: 'text' });
    expect(picked).not.toBe('text-embedding-3-small');
    expect(['claude-3-5-haiku-latest', 'gpt-3.5-turbo']).toContain(picked);
  });

  it('returns null for empty list', () => {
    expect(pickDefaultModelFromDiscovered('custom', [], {}, { purpose: 'vision' })).toBeNull();
  });

  it('replaces your-model scenario picks from custom list', () => {
    const customIds = ['gpt-4o-mini', 'some-chat-model'];
    const byId = buildVisionById('custom', customIds);
    const picked = pickDefaultModelFromDiscovered('custom', customIds, byId, {
      purpose: 'vision',
    });
    expect(picked).toBe('gpt-4o-mini');
    expect(isUnresolvedModel('custom', 'your-model', customIds)).toBe(true);
  });
});
