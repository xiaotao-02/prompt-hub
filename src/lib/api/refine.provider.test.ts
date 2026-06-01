import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AppSettings, ProviderId } from '../types';

const { callOpenAICompatibleText, callAnthropicText, callGeminiText } = vi.hoisted(() => ({
  callOpenAICompatibleText: vi.fn(async () => 'refined output'),
  callAnthropicText: vi.fn(async () => 'anthropic refined'),
  callGeminiText: vi.fn(async () => 'gemini refined'),
}));

vi.mock('./providers/openai', () => ({
  callOpenAICompatibleText,
}));
vi.mock('./providers/anthropic', () => ({
  callAnthropicText,
}));
vi.mock('./providers/gemini', () => ({
  callGeminiText,
}));
vi.mock('../api/resolveProviderApiKey', () => ({
  resolveProviderApiKey: vi.fn(async (_pid: ProviderId, cfg: { apiKey: string }) => cfg.apiKey),
}));

import { refinePrompt } from './refine';

function baseSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  const providers = {
    openai: {
      id: 'openai' as const,
      apiKey: 'sk-o',
      baseUrl: 'https://api.openai.com',
      model: 'gpt-4o',
    },
    anthropic: {
      id: 'anthropic' as const,
      apiKey: 'sk-a',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-5-sonnet',
    },
  } as AppSettings['providers'];

  return {
    activeProvider: 'openai',
    refineProvider: 'anthropic',
    refineModel: 'claude-3-5-haiku',
    providers,
    outputStyle: 'natural-zh',
    customPromptTemplate: '',
    saveHistory: true,
    updates: { lastCheckedAt: 0, lastResult: null },
    promptStrategy: 'v030',
    ...overrides,
  };
}

describe('refinePrompt provider routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('follows activeProvider and its model when refineProvider unset', async () => {
    const result = await refinePrompt({
      settings: baseSettings({ refineProvider: undefined, refineModel: undefined }),
      current: 'a cat',
      instruction: 'translate',
    });

    expect(callOpenAICompatibleText).toHaveBeenCalled();
    expect(callAnthropicText).not.toHaveBeenCalled();
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o');
    expect(result.prompt).toBe('refined output');
  });

  it('uses refineProvider and refineModel, not activeProvider', async () => {
    const result = await refinePrompt({
      settings: baseSettings(),
      current: 'a cat',
      instruction: 'translate',
    });

    expect(callAnthropicText).toHaveBeenCalled();
    expect(callOpenAICompatibleText).not.toHaveBeenCalled();
    expect(result.provider).toBe('anthropic');
    expect(result.model).toBe('claude-3-5-haiku');
    expect(result.prompt).toBe('anthropic refined');
  });
});
