import { describe, expect, it } from 'vitest';
import {
  inferProviderFromModelId,
  inferProviderFromModelList,
  matchProviderByModel,
} from './providerIdFromModel';

describe('inferProviderFromModelId', () => {
  it('infers minimax from MiniMax-VL-01', () => {
    const r = inferProviderFromModelId('MiniMax-VL-01');
    expect(r?.providerId).toBe('minimax');
    expect(r?.confidence).toBe('high');
  });

  it('infers zhipu from glm-4v-flash', () => {
    expect(inferProviderFromModelId('glm-4v-flash')?.providerId).toBe('zhipu');
  });

  it('infers openrouter from vendor/model slash format', () => {
    const r = inferProviderFromModelId('openai/gpt-4o-mini');
    expect(r?.providerId).toBe('openrouter');
    expect(r?.source).toBe('aggregator');
  });

  it('does not infer openai from gpt-4o-mini alone', () => {
    expect(inferProviderFromModelId('gpt-4o-mini')).toBeNull();
  });

  it('infers siliconflow medium from HF Org/Model id', () => {
    const r = inferProviderFromModelId('Qwen/Qwen2.5-VL-32B-Instruct');
    expect(r?.providerId).toBe('siliconflow');
    expect(r?.confidence).toBe('medium');
  });
});

describe('inferProviderFromModelList', () => {
  it('infers minimax when list is mostly MiniMax models', () => {
    const ids = ['MiniMax-VL-01', 'MiniMax-M2-latest', 'MiniMax-Text-01', 'MiniMax-VL-01'];
    const r = inferProviderFromModelList(ids);
    expect(r?.providerId).toBe('minimax');
    expect(r?.confidence).toBe('high');
  });

  it('infers openrouter for mixed vendor prefixes', () => {
    const ids = [
      'openai/gpt-4o-mini',
      'google/gemini-2.5-flash',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b',
      'mistralai/mistral-large',
    ];
    const r = inferProviderFromModelList(ids);
    expect(r?.providerId).toBe('openrouter');
    expect(r?.confidence).toBe('high');
  });

  it('infers siliconflow medium for HF-style list', () => {
    const ids = ['Qwen/Qwen2.5-VL-32B-Instruct', 'deepseek-ai/DeepSeek-V3', 'THUDM/glm-4-9b-chat'];
    const r = inferProviderFromModelList(ids);
    expect(r?.providerId).toBe('siliconflow');
    expect(r?.confidence).toBe('medium');
  });

  it('returns null for a single gpt model', () => {
    expect(inferProviderFromModelList(['gpt-4o-mini'])).toBeNull();
  });

  it('uses owned_by as medium tie-break', () => {
    const r = inferProviderFromModelList(['some-custom-id'], {
      ownedByValues: ['minimax', 'minimax', 'minimax', 'minimax', 'other'],
    });
    expect(r?.providerId).toBe('minimax');
    expect(r?.confidence).toBe('medium');
    expect(r?.source).toBe('owned_by');
  });
});

describe('matchProviderByModel', () => {
  it('wraps inferProviderFromModelId', () => {
    expect(matchProviderByModel('abab6.5-chat')).toBe('minimax');
    expect(matchProviderByModel('gpt-4o')).toBeNull();
  });
});
