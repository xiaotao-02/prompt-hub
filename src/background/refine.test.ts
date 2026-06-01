import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HistoryItem } from '@/lib/types';

const { refinePrompt, getSettings, getHistoryItem, appendPromptVersion } = vi.hoisted(() => ({
  refinePrompt: vi.fn(),
  getSettings: vi.fn(),
  getHistoryItem: vi.fn(),
  appendPromptVersion: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ refinePrompt }));
vi.mock('@/lib/storage', () => ({
  getSettings,
  getHistoryItem,
  appendPromptVersion,
}));
vi.mock('./refineProgressPortHub', () => ({
  postRefineProgressToExtensionPages: vi.fn(),
}));
vi.mock('./tabMessaging', () => ({
  postToTab: vi.fn(),
}));

import { runRefine } from './refine';

const baseItem = (prompt: string, headId = 'v0'): HistoryItem =>
  ({
    id: 'hist-1',
    prompt,
    versions: [{ id: headId, prompt, versionNo: 1, createdAt: 1, source: 'extracted' }],
    createdAt: 1,
    updatedAt: 1,
    provider: 'deepseek',
    model: 'm',
    style: 'natural-zh',
  }) as HistoryItem;

describe('runRefine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({ outputStyle: 'natural-zh' });
    refinePrompt.mockResolvedValue({
      prompt: 'new text',
      provider: 'deepseek',
      model: 'm',
    });
  });

  it('returns unchanged when appendPromptVersion did not create a new head version', async () => {
    const item = baseItem('same text', 'head-a');
    getHistoryItem.mockResolvedValue(item);
    appendPromptVersion.mockResolvedValue(item);

    const resp = await runRefine('hist-1', 'same text', 'optimize');

    expect(resp.ok).toBe(true);
    if (resp.ok) {
      expect(resp.unchanged).toBe(true);
      expect(resp.prompt).toBe('new text');
    }
  });

  it('returns ok without unchanged when a new version was created', async () => {
    const before = baseItem('old', 'head-a');
    const after = baseItem('new text', 'head-b');
    getHistoryItem.mockResolvedValue(before);
    appendPromptVersion.mockResolvedValue(after);

    const resp = await runRefine('hist-1', 'old', 'expand');

    expect(resp.ok).toBe(true);
    if (resp.ok) {
      expect(resp.unchanged).toBeUndefined();
      expect(resp.versionId).toBe('head-b');
    }
  });

  it('returns error when history item is missing', async () => {
    getHistoryItem.mockResolvedValue(undefined);

    const resp = await runRefine('missing', 'x', 'y');

    expect(resp).toEqual({ ok: false, error: '记录不存在' });
    expect(appendPromptVersion).not.toHaveBeenCalled();
  });

  it('returns error when model returns empty prompt', async () => {
    refinePrompt.mockResolvedValue({ prompt: '', provider: 'deepseek', model: 'm' });

    const resp = await runRefine('hist-1', 'old', 'expand');

    expect(resp).toEqual({ ok: false, error: '模型返回了空提示词' });
    expect(appendPromptVersion).not.toHaveBeenCalled();
  });
});
