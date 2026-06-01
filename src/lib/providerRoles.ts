import { resolveProviderApiKey } from './api/resolveProviderApiKey';
import type { AppSettings, ProviderConfig, ProviderId } from './types';

/** 次选 API 未配置时 refine / 洗稿 应展示的提示（与设置页路径一致） */
export const REFINE_PROVIDER_NOT_CONFIGURED =
  '请先在「设置 → 模型与连接」中配置次选 API（用于提示词调整）。';

export class RefineProviderNotConfiguredError extends Error {
  constructor(message = REFINE_PROVIDER_NOT_CONFIGURED) {
    super(message);
    this.name = 'RefineProviderNotConfiguredError';
  }
}

/** 首选 API：识图反推、重新生成 */
export function resolveExtractProvider(settings: AppSettings): ProviderId {
  return settings.activeProvider;
}

/** 次选有效供应商：未显式设置时跟随首选 */
export function resolveEffectiveRefineProvider(settings: AppSettings): ProviderId {
  return settings.refineProvider ?? settings.activeProvider;
}

/** 次选有效模型：未显式 refineModel 时，同供应商或默认跟随首选模型 */
export function resolveEffectiveRefineModel(settings: AppSettings): string {
  const explicit = settings.refineModel?.trim();
  if (explicit) return explicit;

  const refinePid = settings.refineProvider;
  if (!refinePid || refinePid === settings.activeProvider) {
    return settings.providers[settings.activeProvider]?.model ?? '';
  }
  return settings.providers[refinePid]?.model ?? '';
}

/** 次选 API：AI 调整 / 一键洗稿；未显式 refineProvider 时回落到 activeProvider */
export function resolveRefineProvider(settings: AppSettings): ProviderId {
  return resolveEffectiveRefineProvider(settings);
}

export type RefineSettingsValidation = { ok: true } | { ok: false; error: string };

/** 发送 REFINE 前同步校验次选 API 槽位（不含 platform Token 异步读取）。 */
export function validateRefineSettings(settings: AppSettings): RefineSettingsValidation {
  const providerId = resolveEffectiveRefineProvider(settings);
  const base = settings.providers[providerId];
  if (!base) {
    return { ok: false, error: REFINE_PROVIDER_NOT_CONFIGURED };
  }
  const model = resolveEffectiveRefineModel(settings).trim();
  if (!model) {
    return {
      ok: false,
      error: '请先在「设置 → 模型与连接 → 次选 API」中填写模型名',
    };
  }
  if (!base.baseUrl?.trim()) {
    return {
      ok: false,
      error: '请先在「设置 → 模型与连接 → 次选 API」中填写接口地址（需含 /v1）',
    };
  }
  if (!base.apiKey?.trim()) {
    return { ok: false, error: REFINE_PROVIDER_NOT_CONFIGURED };
  }
  return { ok: true };
}

export function isRefineProviderConfigured(settings: AppSettings): boolean {
  return validateRefineSettings(settings).ok;
}

export function isRefineProviderNotConfiguredMessage(msg: string | undefined): boolean {
  if (!msg) return false;
  return msg === REFINE_PROVIDER_NOT_CONFIGURED || msg.includes('次选 API');
}

const REFINE_SETTINGS_SESSION_KEYS = {
  tab: 'options_active_tab_v1',
  panel: 'options_settings_panel_v1',
  role: 'options_provider_role_v1',
} as const;

/** 打开选项页并定位到「次选 API」配置 */
export function openRefineProviderSettings(): void {
  try {
    sessionStorage.setItem(REFINE_SETTINGS_SESSION_KEYS.tab, 'settings');
    sessionStorage.setItem(REFINE_SETTINGS_SESSION_KEYS.panel, 'provider');
    sessionStorage.setItem(REFINE_SETTINGS_SESSION_KEYS.role, 'refine');
  } catch {
    /* ignore */
  }
  chrome.runtime.openOptionsPage();
}

/**
 * 次选供应商配置；`refineModel` 非空时覆盖；否则按 effective 规则解析模型。
 */
export async function resolveRefineConfig(
  settings: AppSettings,
): Promise<{ providerId: ProviderId; cfg: ProviderConfig }> {
  const providerId = resolveEffectiveRefineProvider(settings);
  const base = settings.providers[providerId];
  if (!base) {
    throw new RefineProviderNotConfiguredError();
  }
  const model = resolveEffectiveRefineModel(settings).trim();
  if (!model) {
    throw new RefineProviderNotConfiguredError(
      '请先在「设置 → 模型与连接 → 次选 API」中填写模型名',
    );
  }
  if (!base.baseUrl?.trim()) {
    throw new RefineProviderNotConfiguredError(
      '请先在「设置 → 模型与连接 → 次选 API」中填写接口地址（需含 /v1）',
    );
  }
  const cfg: ProviderConfig = { ...base, model };
  cfg.apiKey = await resolveProviderApiKey(providerId, cfg);
  return { providerId, cfg };
}
