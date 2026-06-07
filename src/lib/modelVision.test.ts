import { describe, expect, it } from 'vitest';
import {
  buildVisionById,
  classifyModel,
  dedupePlatformDiscoveredModels,
  getProviderVisionDisplay,
  migratePlatformModelId,
  partitionByVision,
  shouldBlockExtract,
} from './modelVision';

describe('classifyModel', () => {
  it('classifies MiniMax M2 as no_vision via rule', () => {
    const c = classifyModel('minimax', 'MiniMax-M2-latest');
    expect(c.vision).toBe('no_vision');
    expect(shouldBlockExtract(c)).toBe(true);
  });

  it('classifies MiniMax VL as vision via rule', () => {
    expect(classifyModel('minimax', 'MiniMax-VL-01').vision).toBe('vision');
  });

  it('classifies gpt-5.5 as vision (chat family)', () => {
    const c = classifyModel('openai', 'gpt-5.5');
    expect(c.vision).toBe('vision');
    expect(shouldBlockExtract(c)).toBe(false);
  });

  it('uses API hint for OpenRouter-style modalities', () => {
    expect(
      classifyModel('openrouter', 'some/model', {
        inputModalities: ['text', 'image'],
      }).vision,
    ).toBe('vision');
    expect(
      classifyModel('openrouter', 'some/model', {
        inputModalities: ['text'],
      }).vision,
    ).toBe('no_vision');
  });

  it('classifies embed/tts as no_vision via heuristic', () => {
    const c = classifyModel('openai', 'text-embedding-3-small');
    expect(c.vision).toBe('no_vision');
    expect(shouldBlockExtract(c)).toBe(true);
  });

  it('classifies gpt-4o as vision via heuristic', () => {
    expect(classifyModel('openai', 'gpt-4o-mini').vision).toBe('vision');
  });

  it('classifies deepseek-chat as no_vision via rule', () => {
    expect(shouldBlockExtract(classifyModel('deepseek', 'deepseek-chat'))).toBe(true);
  });

  it('classifies mistral-large-latest as unknown', () => {
    const c = classifyModel('mistral', 'mistral-large-latest');
    expect(c.vision).toBe('unknown');
    expect(shouldBlockExtract(c)).toBe(false);
  });
});

describe('buildVisionById', () => {
  it('partitions discovered models', () => {
    const ids = ['gpt-4o-mini', 'text-embedding-3-small', 'MiniMax-VL-01'];
    const map = buildVisionById('openai', ids);
    const { vision, noVision } = partitionByVision(ids, map);
    expect(vision).toContain('gpt-4o-mini');
    expect(noVision).toContain('text-embedding-3-small');
  });
});

describe('getProviderVisionDisplay', () => {
  it('returns static catalog when no discovered ids', () => {
    const d = getProviderVisionDisplay('minimax');
    expect(d.source).toBe('static');
    expect(d.visionShown).toContain('MiniMax-VL-01');
    expect(d.noVisionShown.some((m) => /M2/i.test(m))).toBe(true);
  });

  it('returns discovered partition when ids provided', () => {
    const ids = ['MiniMax-VL-01', 'MiniMax-M2-latest'];
    const map = buildVisionById('minimax', ids);
    const d = getProviderVisionDisplay('minimax', ids, map);
    expect(d.source).toBe('discovered');
    expect(d.visionTotal).toBe(1);
    expect(d.noVisionTotal).toBe(1);
  });
});

describe('platform model id migration', () => {
  it('migratePlatformModelId strips legacy upstream prefix', () => {
    expect(migratePlatformModelId('tokenrouter/gpt-3.5')).toBe('gpt-3.5');
    expect(migratePlatformModelId('gpt-3.5')).toBe('gpt-3.5');
  });

  it('dedupePlatformDiscoveredModels merges prefixed duplicates and keeps best vision', () => {
    const { models, visionById } = dedupePlatformDiscoveredModels(
      ['up-a/gpt-3.5', 'up-b/gpt-3.5', 'up-c/gpt-4o'],
      {
        'up-a/gpt-3.5': 'no_vision',
        'up-b/gpt-3.5': 'vision',
        'up-c/gpt-4o': 'vision',
      },
    );
    expect(models).toEqual(['gpt-3.5', 'gpt-4o']);
    expect(visionById['gpt-3.5']).toBe('vision');
    expect(visionById['gpt-4o']).toBe('vision');
  });
});
