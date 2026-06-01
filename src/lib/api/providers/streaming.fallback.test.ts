import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ProviderConfig } from '../../types';
import { getStrategy } from '../../strategies';
import { callOpenAICompatible, callOpenAICompatibleText } from './openai';

const openaiCfg: ProviderConfig = {
  id: 'openai',
  apiKey: 'test-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('callOpenAICompatibleText always requests stream', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          choices: [{ message: { content: 'refined text' } }],
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends stream:true even without onProgress', async () => {
    const result = await callOpenAICompatibleText(openaiCfg, 'sys', 'user');
    expect(result).toBe('refined text');
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({ stream: true });
    expect((init?.headers as Record<string, string>).Accept).toBe('text/event-stream');
  });

  it('emits buffered streamMode when response is JSON', async () => {
    const events: Array<{ streamMode?: string; partial?: string }> = [];
    const result = await callOpenAICompatibleText(openaiCfg, 'sys', 'user', (ev) => {
      events.push({ streamMode: ev.streamMode, partial: ev.partial });
    });
    expect(result).toBe('refined text');
    expect(events.some((e) => e.streamMode === 'buffered' && e.partial === undefined)).toBe(true);
    expect(events.some((e) => e.streamMode === 'buffered' && e.partial === 'refined text')).toBe(
      true,
    );
  });
});

describe('callOpenAICompatible buffered extract progress', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          choices: [{ message: { content: 'extracted prompt' } }],
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits buffered progress events on JSON fallback', async () => {
    const events: Array<{ streamMode?: string; partial?: string }> = [];
    const result = await callOpenAICompatible(
      openaiCfg,
      [
        {
          dataUrl: 'data:image/jpeg;base64,xx',
          base64: 'xx',
          mediaType: 'image/jpeg',
          byteLength: 1,
        },
      ],
      'describe image',
      getStrategy('v030'),
      (ev) => {
        events.push({ streamMode: ev.streamMode, partial: ev.partial });
      },
    );
    expect(result).toBe('extracted prompt');
    expect(events.some((e) => e.streamMode === 'buffered' && e.partial === undefined)).toBe(true);
    expect(
      events.some((e) => e.streamMode === 'buffered' && e.partial === 'extracted prompt'),
    ).toBe(true);
  });
});
