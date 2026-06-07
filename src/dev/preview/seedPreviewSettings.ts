import { getSettings, saveSettings } from '@/lib/storage';
import type { AppSettings, ProviderId } from '@/lib/types';
import { getDevPreviewScene } from './previewScene';

/** 开发预览「已配置」场景占位 Key（≥6 字符，非真实密钥）。 */
export const PREVIEW_CONFIGURED_API_KEY = 'sk-preview-dev-only' as const;

function clearAllProviderKeys(settings: AppSettings): AppSettings['providers'] {
  const providers = { ...settings.providers };
  for (const id of Object.keys(providers) as ProviderId[]) {
    const cfg = providers[id];
    if (!cfg) continue;
    providers[id] = { ...cfg, apiKey: '' };
  }
  return providers;
}

/**
 * 按 `?scene=` 写入预览用 chrome.storage.sync 设置（仅 dev 预览页）。
 * - default / versions：有历史、未配置 Key（顶栏服务菜单 · 未登录）
 * - configured：有历史、OpenAI 已配 Key
 * - empty：未配置（配合空库 → 内嵌首配卡片）
 */
export async function ensurePreviewSettingsForScene(): Promise<void> {
  const scene = getDevPreviewScene().trim().toLowerCase();
  const base = await getSettings();

  if (scene === 'configured') {
    const openai = base.providers.openai;
    if (!openai) return;
    await saveSettings({
      ...base,
      activeProvider: 'openai',
      providers: {
        ...base.providers,
        openai: { ...openai, apiKey: PREVIEW_CONFIGURED_API_KEY },
      },
    });
    return;
  }

  if (scene === 'default' || scene === 'versions' || scene === 'empty') {
    await saveSettings({
      ...base,
      activeProvider: 'openai',
      providers: clearAllProviderKeys(base),
    });
  }
}
