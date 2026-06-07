import { beforeEach, describe, expect, it, vi } from 'vitest';

const { extractPrompt, getSettings, persistHistory, postToTab } = vi.hoisted(() => ({
  extractPrompt: vi.fn(),
  getSettings: vi.fn(),
  persistHistory: vi.fn(),
  postToTab: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ extractPrompt }));
vi.mock('@/lib/storage', () => ({ getSettings }));
vi.mock('./history', () => ({ persistHistory }));
vi.mock('./tabMessaging', () => ({ postToTab }));
vi.mock('@/lib/image', () => ({
  fetchImageAsBase64: vi.fn(async (url: string) => ({
    url,
    base64: 'abc',
    mediaType: 'image/jpeg',
  })),
  makeStorageThumbnail: vi.fn(async () => 'thumb'),
}));
vi.mock('@/lib/storage/history', () => ({
  ensureLibraryReady: vi.fn(async () => undefined),
}));
vi.mock('@/lib/storage/historyDb', () => ({
  getByDedupeKey: vi.fn(async () => undefined),
  toPublicHistory: vi.fn((x: unknown) => x),
  naturalDedupeKey: vi.fn(() => ''),
}));

import { runExtraction } from './extraction';

describe('runExtraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({
      activeProvider: 'openai',
      providers: { openai: { model: 'gpt-4o' } },
      promptStrategy: 'standard',
      outputStyle: 'natural-zh',
      saveHistory: false,
    });
    extractPrompt.mockResolvedValue({
      prompt: 'a cat',
      provider: 'openai',
      model: 'gpt-4o',
      style: 'natural-zh',
    });
  });

  it('forwards panel requestId to EXTRACT_PENDING and EXTRACT_RESULT', async () => {
    const requestId = 'req-panel-1';
    await runExtraction({
      tabId: 1,
      imageUrls: ['https://example.com/a.jpg'],
      pageUrl: 'https://example.com',
      pageTitle: 'Example',
      requestId,
    });

    expect(postToTab).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        type: 'EXTRACT_PENDING',
        payload: expect.objectContaining({ requestId }),
      }),
    );
    expect(postToTab).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        type: 'EXTRACT_RESULT',
        payload: expect.objectContaining({ requestId, ok: true, prompt: 'a cat' }),
      }),
    );
  });

  it('posts EXTRACT_ERROR when extractPrompt throws', async () => {
    extractPrompt.mockRejectedValue(new Error('API down'));
    await runExtraction({
      tabId: 2,
      imageUrls: ['https://example.com/b.jpg'],
      pageUrl: 'https://example.com',
      pageTitle: 'Example',
      requestId: 'req-err',
    });

    expect(postToTab).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        type: 'EXTRACT_ERROR',
        payload: { requestId: 'req-err', ok: false, error: 'API down' },
      }),
    );
  });

  it('notifies superseded request when a new extraction starts on same tab', async () => {
    extractPrompt.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                prompt: 'slow',
                provider: 'openai',
                model: 'gpt-4o',
                style: 'natural-zh',
              }),
            50,
          ),
        ),
    );

    const first = runExtraction({
      tabId: 3,
      imageUrls: ['https://example.com/c.jpg'],
      pageUrl: 'https://example.com',
      pageTitle: 'Example',
      requestId: 'req-old',
    });
    await runExtraction({
      tabId: 3,
      imageUrls: ['https://example.com/d.jpg'],
      pageUrl: 'https://example.com',
      pageTitle: 'Example',
      requestId: 'req-new',
    });

    expect(postToTab).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        type: 'EXTRACT_ERROR',
        payload: expect.objectContaining({ requestId: 'req-old', ok: false }),
      }),
    );
    await first;
  });

  it('posts EXTRACT_ERROR for empty image list', async () => {
    await runExtraction({
      tabId: 4,
      imageUrls: [],
      pageUrl: 'https://example.com',
      pageTitle: 'Example',
      requestId: 'req-empty',
    });

    expect(postToTab).toHaveBeenCalledWith(
      4,
      expect.objectContaining({
        type: 'EXTRACT_ERROR',
        payload: expect.objectContaining({ requestId: 'req-empty', error: '没有可用的参考图' }),
      }),
    );
    expect(extractPrompt).not.toHaveBeenCalled();
  });
});
