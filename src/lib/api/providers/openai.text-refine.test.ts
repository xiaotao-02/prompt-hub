import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '../../types';
import type { RefineProgressEvent } from '../types';

const customCfg: ProviderConfig = {
  id: 'custom',
  apiKey: 'sk-test',
  baseUrl: 'https://proxy.example/v1',
  model: 'gpt-3.5-turbo',
};

describe('callOpenAICompatibleText refine progress', () => {
  const fetchMock = vi.fn();
  const progress: RefineProgressEvent[] = [];

  beforeEach(() => {
    progress.length = 0;
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('emits streaming stage on non-SSE JSON response', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'translated prompt' } }],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const { callOpenAICompatibleText } = await import('./openai');
    const out = await callOpenAICompatibleText(customCfg, 'sys', 'user', (ev) => {
      progress.push(ev);
    });

    expect(out).toBe('translated prompt');
    expect(progress.some((e) => e.stage === 'streaming')).toBe(true);
    expect(progress.some((e) => e.partial === 'translated prompt')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        body: expect.stringContaining('"stream":true'),
      }),
    );
  });
});
