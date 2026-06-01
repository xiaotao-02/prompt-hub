import { describe, expect, it, vi } from 'vitest';
import type { AppSettings, ProviderId } from './types';
import {
  REFINE_PROVIDER_NOT_CONFIGURED,
  isRefineProviderConfigured,
  resolveEffectiveRefineModel,
  resolveEffectiveRefineProvider,
  resolveExtractProvider,
  resolveRefineConfig,
  resolveRefineProvider,
  validateRefineSettings,
} from './providerRoles';

vi.mock('./api/resolveProviderApiKey', () => ({
  resolveProviderApiKey: vi.fn(async (_pid: ProviderId, cfg: { apiKey: string }) => cfg.apiKey),
}));

function minimalSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  const providers = Object.fromEntries(
    (['openai', 'anthropic'] as ProviderId[]).map((id) => [
      id,
      { id, apiKey: 'sk-test', baseUrl: 'https://api.example.com', model: 'gpt-4o' },
    ]),
  ) as AppSettings['providers'];

  return {
    activeProvider: 'openai',
    providers,
    outputStyle: 'natural-zh',
    customPromptTemplate: '',
    saveHistory: true,
    updates: { lastCheckedAt: 0, lastResult: null },
    promptStrategy: 'v030',
    ...overrides,
  };
}

describe('providerRoles', () => {
  it('resolveExtractProvider returns activeProvider', () => {
    const s = minimalSettings({ activeProvider: 'anthropic' });
    expect(resolveExtractProvider(s)).toBe('anthropic');
  });

  it('resolveRefineProvider follows activeProvider when refineProvider unset', () => {
    const s = minimalSettings();
    expect(resolveRefineProvider(s)).toBe('openai');
    expect(resolveEffectiveRefineProvider(s)).toBe('openai');
    expect(resolveEffectiveRefineModel(s)).toBe('gpt-4o');
  });

  it('resolveRefineConfig applies refineModel override', async () => {
    const s = minimalSettings({
      refineProvider: 'openai',
      refineModel: 'gpt-4o-mini',
    });
    const { providerId, cfg } = await resolveRefineConfig(s);
    expect(providerId).toBe('openai');
    expect(cfg.model).toBe('gpt-4o-mini');
  });

  it('resolveRefineConfig uses slot model when refineProvider differs and refineModel empty', async () => {
    const s = minimalSettings({
      refineProvider: 'anthropic',
      providers: {
        ...minimalSettings().providers,
        anthropic: {
          id: 'anthropic',
          apiKey: 'sk-a',
          baseUrl: 'https://api.anthropic.com',
          model: 'claude-3-5-sonnet',
        },
      },
    });
    const { providerId, cfg } = await resolveRefineConfig(s);
    expect(providerId).toBe('anthropic');
    expect(cfg.model).toBe('claude-3-5-sonnet');
  });

  it('resolveEffectiveRefineModel follows active when refineProvider equals active', () => {
    const s = minimalSettings({
      refineProvider: 'openai',
      providers: {
        ...minimalSettings().providers,
        openai: {
          id: 'openai',
          apiKey: 'sk-test',
          baseUrl: 'https://api.example.com',
          model: 'gpt-4o',
        },
      },
    });
    expect(resolveEffectiveRefineModel(s)).toBe('gpt-4o');
  });

  it('validateRefineSettings accepts complete refine slot', () => {
    expect(validateRefineSettings(minimalSettings())).toEqual({ ok: true });
    expect(isRefineProviderConfigured(minimalSettings())).toBe(true);
  });

  it('validateRefineSettings rejects missing api key', () => {
    const s = minimalSettings({
      providers: {
        ...minimalSettings().providers,
        openai: {
          id: 'openai',
          apiKey: '',
          baseUrl: 'https://api.example.com',
          model: 'gpt-4o',
        },
      },
    });
    expect(validateRefineSettings(s)).toEqual({
      ok: false,
      error: REFINE_PROVIDER_NOT_CONFIGURED,
    });
  });

  it('validateRefineSettings rejects empty model', () => {
    const s = minimalSettings({
      refineModel: '   ',
      providers: {
        ...minimalSettings().providers,
        openai: {
          id: 'openai',
          apiKey: 'sk-test',
          baseUrl: 'https://api.example.com',
          model: '',
        },
      },
    });
    const result = validateRefineSettings(s);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/模型名/);
  });

  it('validateRefineSettings rejects empty baseUrl', () => {
    const s = minimalSettings({
      providers: {
        ...minimalSettings().providers,
        openai: {
          id: 'openai',
          apiKey: 'sk-test',
          baseUrl: '   ',
          model: 'gpt-4o',
        },
      },
    });
    const result = validateRefineSettings(s);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/接口地址/);
  });

  it('resolveRefineConfig rejects empty model before API call', async () => {
    const s = minimalSettings({
      refineModel: ' ',
      providers: {
        ...minimalSettings().providers,
        openai: {
          id: 'openai',
          apiKey: 'sk-test',
          baseUrl: 'https://api.example.com',
          model: '',
        },
      },
    });
    await expect(resolveRefineConfig(s)).rejects.toThrow(/模型名/);
  });
});
