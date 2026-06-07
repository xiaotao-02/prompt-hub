import { describe, expect, it } from 'vitest';
import { classifyModel, shouldBlockExtract } from './modelVision';
import type { ProviderId } from './types';

type MatrixCase = {
  provider: ProviderId;
  model: string;
  expectBlock: boolean;
  expectVision?: 'vision' | 'no_vision' | 'unknown';
  apiHint?: { inputModalities?: string[] };
};

const CASES: MatrixCase[] = [
  // OpenAI
  { provider: 'openai', model: 'gpt-5.5', expectBlock: false, expectVision: 'vision' },
  { provider: 'openai', model: 'gpt-5.4', expectBlock: false, expectVision: 'vision' },
  { provider: 'openai', model: 'gpt-4o-mini', expectBlock: false, expectVision: 'vision' },
  {
    provider: 'openai',
    model: 'text-embedding-3-small',
    expectBlock: true,
    expectVision: 'no_vision',
  },
  { provider: 'openai', model: 'tts-1-hd', expectBlock: true, expectVision: 'no_vision' },
  { provider: 'openai', model: 'gpt-3.5-turbo', expectBlock: false, expectVision: 'vision' },
  // Anthropic
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    expectBlock: false,
    expectVision: 'vision',
  },
  {
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    expectBlock: false,
    expectVision: 'vision',
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-latest',
    expectBlock: false,
    expectVision: 'vision',
  },
  // Gemini
  { provider: 'gemini', model: 'gemini-2.5-flash', expectBlock: false, expectVision: 'vision' },
  {
    provider: 'gemini',
    model: 'gemini-embedding-001',
    expectBlock: true,
    expectVision: 'no_vision',
  },
  // MiniMax
  { provider: 'minimax', model: 'MiniMax-VL-01', expectBlock: false, expectVision: 'vision' },
  { provider: 'minimax', model: 'MiniMax-M2-latest', expectBlock: true, expectVision: 'no_vision' },
  {
    provider: 'minimax',
    model: 'MiniMax-M2.7-highspeed',
    expectBlock: true,
    expectVision: 'no_vision',
  },
  // DeepSeek
  { provider: 'deepseek', model: 'deepseek-chat', expectBlock: true, expectVision: 'no_vision' },
  // xAI / Mistral / Moonshot
  { provider: 'xai', model: 'grok-4.3', expectBlock: false, expectVision: 'vision' },
  { provider: 'xai', model: 'grok-3-beta', expectBlock: false, expectVision: 'vision' },
  {
    provider: 'mistral',
    model: 'mistral-large-latest',
    expectBlock: false,
    expectVision: 'unknown',
  },
  { provider: 'moonshot', model: 'moonshot-v1-32k', expectBlock: false, expectVision: 'unknown' },
  {
    provider: 'moonshot',
    model: 'moonshot-v1-32k-vision-preview',
    expectBlock: false,
    expectVision: 'vision',
  },
  // 国产
  { provider: 'zhipu', model: 'glm-4.6v', expectBlock: false, expectVision: 'vision' },
  { provider: 'zhipu', model: 'glm-4v-flash', expectBlock: false, expectVision: 'vision' },
  { provider: 'zhipu', model: 'glm-4-flash', expectBlock: false, expectVision: 'no_vision' },
  { provider: 'qwen', model: 'qwen3-vl-plus', expectBlock: false, expectVision: 'vision' },
  { provider: 'qwen', model: 'qwen-max', expectBlock: true, expectVision: 'no_vision' },
  {
    provider: 'doubao',
    model: 'doubao-1-5-vision-pro-32k-250115',
    expectBlock: false,
    expectVision: 'vision',
  },
  // OpenRouter API
  {
    provider: 'openrouter',
    model: 'vendor/custom',
    expectBlock: false,
    expectVision: 'vision',
    apiHint: { inputModalities: ['text', 'image'] },
  },
  {
    provider: 'openrouter',
    model: 'vendor/text-only',
    expectBlock: true,
    expectVision: 'no_vision',
    apiHint: { inputModalities: ['text'] },
  },
  // Groq / Together
  {
    provider: 'groq',
    model: 'llama-3.2-90b-vision-preview',
    expectBlock: false,
    expectVision: 'vision',
  },
  { provider: 'groq', model: 'mixtral-8x7b-32768', expectBlock: true, expectVision: 'no_vision' },
  { provider: 'custom', model: 'gpt-5.5', expectBlock: false, expectVision: 'vision' },
];

describe('modelVision matrix', () => {
  it.each(CASES)(
    '$provider / $model block=$expectBlock vision=$expectVision',
    ({ provider, model, expectBlock, expectVision, apiHint }) => {
      const c = classifyModel(provider, model, apiHint);
      if (expectVision != null) {
        expect(c.vision).toBe(expectVision);
      }
      expect(shouldBlockExtract(c)).toBe(expectBlock);
    },
  );
});
