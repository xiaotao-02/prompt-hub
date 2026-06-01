import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppSettings, ProviderId } from '../types';
import { PROVIDERS } from '../providers';
import { DEFAULT_STRATEGY_ID } from '../strategies';
import { DEFAULT_UPDATE_SETTINGS } from '../updater';
import { extractPrompt } from './extract';
import { callOpenAICompatible } from './providers/openai';

vi.mock('./providers/openai', () => ({
  callOpenAICompatible: vi.fn().mockResolvedValue('mocked prompt'),
}));

function baseSettings(options?: {
  activeProvider?: ProviderId;
  minimaxModel?: string;
}): AppSettings {
  const providers = Object.fromEntries(
    Object.values(PROVIDERS).map((p) => [
      p.id,
      {
        id: p.id,
        apiKey: p.id === 'minimax' ? 'test-key-minimax' : '',
        baseUrl: p.defaultBaseUrl,
        model: p.defaultModel,
      },
    ]),
  ) as Record<ProviderId, AppSettings['providers'][ProviderId]>;

  if (options?.minimaxModel != null) {
    providers.minimax = { ...providers.minimax, model: options.minimaxModel };
  }

  return {
    activeProvider: options?.activeProvider ?? 'openai',
    providers,
    outputStyle: 'natural-zh',
    customPromptTemplate: '',
    saveHistory: true,
    updates: { ...DEFAULT_UPDATE_SETTINGS },
    promptStrategy: DEFAULT_STRATEGY_ID,
    panelAutofocus: true,
    popupToolbarPromptAction: 'library',
    oneClickRewriteRandomness: 'moderate',
    customComponents: {
      stylePromptSet: 'v0.3.0',
      sampling: 'v0.3.0',
      customJoin: 'v0.3.0',
    },
  };
}

describe('extractPrompt MiniMax + reference image guard', () => {
  beforeEach(() => {
    vi.mocked(callOpenAICompatible).mockClear();
  });

  it('throws before HTTP when minimax + has images + MiniMax-M2 model (case-insensitive)', async () => {
    const settings = baseSettings({ activeProvider: 'minimax', minimaxModel: 'MiniMax-M2-latest' });

    await expect(
      extractPrompt({
        imageUrls: ['data:image/jpeg;base64,xx'],
        settings,
      }),
    ).rejects.toThrow(/MiniMax-VL-01/);

    expect(callOpenAICompatible).not.toHaveBeenCalled();
  });

  it('throws for minimax-m2 lowercase id before API', async () => {
    const settings = baseSettings({
      activeProvider: 'minimax',
      minimaxModel: 'minimax-m2-highspeed',
    });

    await expect(
      extractPrompt({
        imageUrls: ['https://example.com/a.png'],
        settings,
      }),
    ).rejects.toThrow(/troubleshooting-minimax/);

    expect(callOpenAICompatible).not.toHaveBeenCalled();
  });

  it('does not apply MiniMax-specific guard to other providers', async () => {
    const settings = baseSettings({ activeProvider: 'openai' });
    settings.providers.openai.apiKey = 'sk-test';
    settings.providers.openai.model = 'gpt-4o-mini';

    const prefetched = [
      {
        dataUrl: 'data:image/jpeg;base64,xx',
        base64: 'xx',
        mediaType: 'image/jpeg',
        byteLength: 1,
      },
    ];

    await extractPrompt({
      imageUrls: ['data:image/jpeg;base64,xx'],
      settings,
      prefetched,
    });

    expect(callOpenAICompatible).toHaveBeenCalledTimes(1);
  });

  it('allows minimax + MiniMax-VL-01 with prefetched images', async () => {
    const settings = baseSettings({ activeProvider: 'minimax', minimaxModel: 'MiniMax-VL-01' });
    const prefetched = [
      {
        dataUrl: 'data:image/jpeg;base64,xx',
        base64: 'xx',
        mediaType: 'image/jpeg',
        byteLength: 1,
      },
    ];

    const result = await extractPrompt({
      imageUrls: ['data:image/jpeg;base64,xx'],
      settings,
      prefetched,
    });

    expect(result.prompt).toBe('mocked prompt');
    expect(callOpenAICompatible).toHaveBeenCalledTimes(1);
  });

  it('uses the v036 default high-fidelity instruction for image extraction', async () => {
    const settings = baseSettings({ activeProvider: 'openai' });
    settings.providers.openai.apiKey = 'sk-test';
    const prefetched = [
      {
        dataUrl: 'data:image/jpeg;base64,xx',
        base64: 'xx',
        mediaType: 'image/jpeg',
        byteLength: 1,
      },
    ];

    await extractPrompt({
      imageUrls: ['data:image/jpeg;base64,xx'],
      settings,
      prefetched,
    });

    const [, , instruction, strategy] = vi.mocked(callOpenAICompatible).mock.calls[0]!;
    expect(strategy.id).toBe('v036');
    expect(instruction).toContain('通用高还原中文提示词');
    expect(instruction).toContain('关键锚点');
    expect(instruction).toContain('不要输出标题');
  });

  it('adds the improved multi-image brief instruction for non-video multi-reference extraction', async () => {
    const settings = baseSettings({ activeProvider: 'openai' });
    settings.providers.openai.apiKey = 'sk-test';
    const prefetched = [
      {
        dataUrl: 'data:image/jpeg;base64,aa',
        base64: 'aa',
        mediaType: 'image/jpeg',
        byteLength: 1,
      },
      {
        dataUrl: 'data:image/jpeg;base64,bb',
        base64: 'bb',
        mediaType: 'image/jpeg',
        byteLength: 1,
      },
    ];

    await extractPrompt({
      imageUrls: ['data:image/jpeg;base64,aa', 'data:image/jpeg;base64,bb'],
      settings,
      prefetched,
    });

    const [, , instruction] = vi.mocked(callOpenAICompatible).mock.calls[0]!;
    expect(instruction).toContain('【多图综合任务】');
    expect(instruction).toContain('第 1 张作为主体、构图、景别与画面权重的主锚');
    expect(instruction).toContain('不要按“图1/图2”逐张枚举');
  });

  it('adds video segment instructions with anchors and per-frame shot requirements', async () => {
    const settings = baseSettings({ activeProvider: 'openai' });
    settings.providers.openai.apiKey = 'sk-test';
    const prefetched = [1, 2, 3].map((i) => ({
      dataUrl: `data:image/jpeg;base64,${i}`,
      base64: String(i),
      mediaType: 'image/jpeg',
      byteLength: 1,
    }));

    await extractPrompt({
      imageUrls: prefetched.map((img) => img.dataUrl),
      settings,
      prefetched,
      videoSegment: { startSec: 1, endSec: 3, frameTimesSec: [1, 2, 3] },
    });

    const [, , instruction] = vi.mocked(callOpenAICompatible).mock.calls[0]!;
    expect(instruction).not.toContain('【多图综合任务】');
    expect(instruction).toContain('你必须输出 **3 条分镜**');
    expect(instruction).toContain('图1≈1s');
    expect(instruction).toContain('图2≈2s');
    expect(instruction).toContain('景别/镜头与构图');
    expect(instruction).toContain('禁止在末尾追加总结段');
  });
});
