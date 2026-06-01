import { describe, expect, it } from 'vitest';
import type { ProviderConfig } from '../../types';
import { applyOpenAIStreamDelta, type OpenAISseAcc } from './openai';

const minimaxM2Cfg: ProviderConfig = {
  id: 'minimax',
  apiKey: 'test-key',
  baseUrl: 'https://api.minimax.chat/v1',
  model: 'MiniMax-M2-latest',
};

const openaiCfg: ProviderConfig = {
  id: 'openai',
  apiKey: 'test-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
};

function emptyAcc(): OpenAISseAcc {
  return { partialRaw: '', answerRaw: '' };
}

describe('applyOpenAIStreamDelta minimax', () => {
  it('refine path: reasoning-only does not write partial', () => {
    const acc = emptyAcc();
    const result = applyOpenAIStreamDelta(
      minimaxM2Cfg,
      acc,
      { reasoning_details: [{ text: '核心元素需要保留…' }] },
      { exposeReasoningInPartial: false },
    );
    expect(result).toBe('reasoning_only');
    expect(acc.partialRaw).toBe('');
    expect(acc.answerRaw).toBe('');
  });

  it('refine path: content snapshot updates partial and answer', () => {
    const acc = emptyAcc();
    const result = applyOpenAIStreamDelta(
      minimaxM2Cfg,
      acc,
      { content: '低角度秋日树，电影感镜头…' },
      { exposeReasoningInPartial: false },
    );
    expect(result).toBe(true);
    expect(acc.partialRaw).toBe('低角度秋日树，电影感镜头…');
    expect(acc.answerRaw).toBe('低角度秋日树，电影感镜头…');
  });

  it('extract path: reasoning-only still drives partial by default', () => {
    const acc = emptyAcc();
    const result = applyOpenAIStreamDelta(minimaxM2Cfg, acc, {
      reasoning_details: [{ text: '思考预览' }],
    });
    expect(result).toBe(true);
    expect(acc.partialRaw).toBe('思考预览');
  });

  it('refine path: content replaces after reasoning-only phase', () => {
    const acc = emptyAcc();
    applyOpenAIStreamDelta(
      minimaxM2Cfg,
      acc,
      { reasoning_details: [{ text: '不应出现在 partial' }] },
      { exposeReasoningInPartial: false },
    );
    applyOpenAIStreamDelta(
      minimaxM2Cfg,
      acc,
      { content: '正式改写提示词' },
      { exposeReasoningInPartial: false },
    );
    expect(acc.partialRaw).toBe('正式改写提示词');
    expect(acc.answerRaw).toBe('正式改写提示词');
  });
});

describe('applyOpenAIStreamDelta non-minimax', () => {
  it('accumulates content incrementally', () => {
    const acc = emptyAcc();
    expect(applyOpenAIStreamDelta(openaiCfg, acc, { content: 'Hello' })).toBe(true);
    expect(acc.partialRaw).toBe('Hello');
    expect(applyOpenAIStreamDelta(openaiCfg, acc, { content: ' world' })).toBe(true);
    expect(acc.partialRaw).toBe('Hello world');
  });
});
