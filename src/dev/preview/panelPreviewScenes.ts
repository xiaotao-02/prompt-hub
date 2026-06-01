import type { PanelState } from '@/content/panel/state';
import { DEFAULT_STRATEGY_ID } from '@/lib/strategies';
import { DEFAULT_ONE_CLICK_REFINE_RANDOMNESS } from '@/lib/oneClickRefine';

function devPreviewThumb(label: string): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90">
      <rect fill="#e4e4e7" width="120" height="90" rx="8"/>
      <text x="60" y="50" text-anchor="middle" fill="#52525b" font-size="10" font-family="system-ui,sans-serif">${label}</text>
    </svg>`,
    )
  );
}

/** 不读 IndexedDB 的合成面板状态，供开发 UI 预览。 */
export function syntheticPanelStateFromScene(scene: string): PanelState | null {
  const s = scene.trim().toLowerCase();
  const img = devPreviewThumb('合成');
  const startedAt = Date.now() - 8000;
  const strategyExtras = {
    strategy: DEFAULT_STRATEGY_ID,
    oneClickRefineRandomness: DEFAULT_ONE_CLICK_REFINE_RANDOMNESS,
  } as const;

  if (s === 'loading') {
    return {
      sessionRequestId: 'dev-preview-loading',
      imageUrl: img,
      imageUrls: [img],
      status: 'loading',
      stage: 'streaming',
      partial: '一只琥珀色眼睛的猫头鹰，落在覆雪的夜晚树枝上，细节随流式输出逐步呈现……',
      startedAt,
      provider: 'openai',
      model: 'gpt-4o-mini',
      ...strategyExtras,
      versions: [],
      versionsOpen: false,
      refineOpen: false,
      draft: '',
    };
  }

  if (s === 'error') {
    return {
      sessionRequestId: 'dev-preview-error',
      imageUrl: img,
      imageUrls: [img],
      status: 'error',
      error: '预览：反推失败（占位）。可检查 API Key、网络或模型可用性。',
      prompt: '（失败后编辑器可展示缓存或占位 copy）',
      draft: '',
      provider: 'openai',
      model: 'gpt-4o-mini',
      ...strategyExtras,
      versions: [],
    };
  }

  if (s === 'compose') {
    return {
      sessionRequestId: 'dev-preview-compose',
      imageUrl: img,
      imageUrls: [img],
      status: 'compose',
      draft: '',
      ...strategyExtras,
      versions: [],
    };
  }

  if (s === 'multi') {
    const imageUrls = [1, 2, 3, 4].map((n) => devPreviewThumb(`参考 ${n}`));
    return {
      sessionRequestId: 'dev-preview-multi',
      imageUrl: imageUrls[0],
      imageUrls,
      status: 'success',
      prompt:
        '冷萃咖啡夏季促销海报定稿：浅蓝渐变背景，中央透明玻璃杯与冰块，左侧竖排标题「夏日冷萃」，右下角价格标签，整体清爽商业摄影风格。',
      draft:
        '冷萃咖啡夏季促销海报定稿：浅蓝渐变背景，中央透明玻璃杯与冰块，左侧竖排标题「夏日冷萃」，右下角价格标签，整体清爽商业摄影风格。',
      provider: 'openai',
      model: 'gpt-4o-mini',
      ...strategyExtras,
      versions: [],
      versionsOpen: false,
      refineOpen: false,
    };
  }

  return null;
}
