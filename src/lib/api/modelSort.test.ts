import { describe, expect, it } from 'vitest';
import { modelFamily, modelType, sortModelsGroupedNewestFirst } from './modelSort';

const SCREENSHOT_MODELS = [
  'codex-auto-review',
  'gpt-5.2',
  'gpt-5.3-codex',
  'gpt-5.3-codex-openai-compact',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-openai-compact',
];

describe('modelType / modelFamily', () => {
  it('extracts type from first segment', () => {
    expect(modelType('gpt-5.4-mini')).toBe('gpt');
    expect(modelType('codex-auto-review')).toBe('codex');
  });

  it('strips common variant suffixes for family', () => {
    expect(modelFamily('gpt-5.4-mini')).toBe('gpt-5.4');
    expect(modelFamily('gpt-5.4-openai-compact')).toBe('gpt-5.4');
    expect(modelFamily('gpt-5.3-codex-openai-compact')).toBe('gpt-5.3-codex');
  });
});

describe('sortModelsGroupedNewestFirst', () => {
  it('groups gpt before codex and orders families newest first (no created)', () => {
    const shuffled = [...SCREENSHOT_MODELS].reverse();
    const sorted = sortModelsGroupedNewestFirst(shuffled.map((id) => ({ id })));

    expect(sorted.indexOf('codex-auto-review')).toBeGreaterThan(sorted.indexOf('gpt-5.4'));
    expect(sorted.indexOf('gpt-5.2')).toBeGreaterThan(sorted.indexOf('gpt-5.3-codex'));
    expect(sorted.indexOf('gpt-5.3-codex')).toBeGreaterThan(sorted.indexOf('gpt-5.4'));

    const gptModels = sorted.filter((id) => modelType(id) === 'gpt');
    expect(gptModels).toEqual([
      'gpt-5.4-openai-compact',
      'gpt-5.4-mini',
      'gpt-5.4',
      'gpt-5.3-codex-openai-compact',
      'gpt-5.3-codex',
      'gpt-5.2',
    ]);
    expect(sorted[sorted.length - 1]).toBe('codex-auto-review');
  });

  it('sorts within family by created descending when available', () => {
    const sorted = sortModelsGroupedNewestFirst([
      { id: 'gpt-5.4', created: 100 },
      { id: 'gpt-5.4-mini', created: 300 },
      { id: 'gpt-5.4-openai-compact', created: 200 },
    ]);

    expect(sorted).toEqual(['gpt-5.4-mini', 'gpt-5.4-openai-compact', 'gpt-5.4']);
  });

  it('dedupes by id keeping newer created', () => {
    const sorted = sortModelsGroupedNewestFirst([
      { id: 'gpt-4o', created: 100 },
      { id: 'gpt-4o', created: 500 },
      { id: 'claude-3-opus', created: 400 },
    ]);

    expect(sorted).toEqual(['gpt-4o', 'claude-3-opus']);
  });

  it('keeps same-type models adjacent', () => {
    const sorted = sortModelsGroupedNewestFirst([
      { id: 'claude-3-haiku' },
      { id: 'gpt-4o' },
      { id: 'claude-3-opus' },
      { id: 'gpt-4o-mini' },
    ]);

    const gptBlock = sorted.filter((id) => modelType(id) === 'gpt');
    const claudeBlock = sorted.filter((id) => modelType(id) === 'claude');
    expect(gptBlock).toEqual(['gpt-4o-mini', 'gpt-4o']);
    expect(claudeBlock).toEqual(['claude-3-opus', 'claude-3-haiku']);
    expect(sorted.indexOf('gpt-4o') - sorted.indexOf('gpt-4o-mini')).toBe(1);
    expect(sorted.indexOf('claude-3-haiku') - sorted.indexOf('claude-3-opus')).toBe(1);
  });
});
