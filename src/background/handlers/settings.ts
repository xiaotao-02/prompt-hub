import { getSettings, saveSettings } from '@/lib/storage';
import {
  applyUserStrategyPresetToSettings,
  getUserStrategyPresets,
} from '@/lib/storage/userStrategyPresets';
import { isOutputStyle } from '@/lib/strategies-meta';
import type { ProviderId, StrategyId } from '@/lib/types';
import type { MessageHandler } from './types';

export type ActiveModelOptionsResponse =
  | {
      ok: true;
      provider: ProviderId;
      model: string;
      models: string[];
      visionById: Record<string, 'vision' | 'no_vision' | 'unknown'>;
    }
  | { ok: false; error?: string };

export const handleSettingsMessage: MessageHandler = (message, _sender, sendResponse) => {
  if (message?.type === 'GET_ACTIVE_MODEL_OPTIONS') {
    void (async () => {
      try {
        const s = await getSettings();
        const provider = s.activeProvider;
        const cfg = s.providers[provider];
        if (!cfg) {
          sendResponse({
            ok: false,
            error: '未找到当前供应商配置',
          } satisfies ActiveModelOptionsResponse);
          return;
        }
        sendResponse({
          ok: true,
          provider,
          model: cfg.model,
          models: cfg.discoveredModels ?? [],
          visionById: cfg.discoveredVisionById ?? {},
        } satisfies ActiveModelOptionsResponse);
      } catch (e) {
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        } satisfies ActiveModelOptionsResponse);
      }
    })();
    return true;
  }

  if (message?.type === 'SET_EXTRACT_MODEL') {
    const model = (message.payload as { model?: string } | undefined)?.model?.trim();
    if (!model) {
      sendResponse({ ok: false, error: '缺少 model' });
      return true;
    }
    void (async () => {
      try {
        const s = await getSettings();
        const provider = s.activeProvider;
        const cfg = s.providers[provider];
        if (!cfg) {
          sendResponse({ ok: false, error: '未找到当前供应商配置' });
          return;
        }
        await saveSettings({
          ...s,
          providers: {
            ...s.providers,
            [provider]: { ...cfg, model },
          },
        });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'SET_PROMPT_STRATEGY') {
    const strategy = message.payload?.strategy as StrategyId | undefined;
    if (!strategy) {
      sendResponse({ ok: false, error: '缺少 strategy' });
      return true;
    }
    void (async () => {
      try {
        const s = await getSettings();
        await saveSettings({ ...s, promptStrategy: strategy });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'APPLY_USER_STRATEGY_PRESET') {
    const presetId = (message.payload as { presetId?: string } | undefined)?.presetId?.trim();
    if (!presetId) {
      sendResponse({ ok: false, error: '缺少 presetId' });
      return true;
    }
    void (async () => {
      try {
        const presets = await getUserStrategyPresets();
        const preset = presets.find((p) => p.id === presetId);
        if (!preset) {
          sendResponse({ ok: false, error: '预设不存在或已删除' });
          return;
        }
        const s = await getSettings();
        await saveSettings(applyUserStrategyPresetToSettings(s, preset));
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return true;
  }

  if (message?.type === 'SET_OUTPUT_STYLE') {
    const style = message.payload?.style as string | undefined;
    if (!style) {
      sendResponse({ ok: false, error: '缺少 style' });
      return true;
    }
    void (async () => {
      try {
        if (!isOutputStyle(style)) {
          sendResponse({ ok: false, error: '无效的 style' });
          return;
        }
        const s = await getSettings();
        await saveSettings({ ...s, outputStyle: style });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'SET_ONE_CLICK_REWRITE_RANDOMNESS') {
    const level = message.payload?.level as string | undefined;
    if (level !== 'subtle' && level !== 'moderate' && level !== 'bold') {
      sendResponse({ ok: false, error: '缺少或无效的 level' });
      return true;
    }
    void (async () => {
      try {
        const s = await getSettings();
        await saveSettings({ ...s, oneClickRewriteRandomness: level });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return true;
  }

  return undefined;
};
