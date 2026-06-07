/**
 * 各策略档位独立覆盖参数的读写、旧字段兼容与反推解析辅助。
 */
import {
  getStrategy,
  resolveCustomStrategy,
  type PromptStrategy,
  type ResolvedStrategy,
} from './strategies';
import { DEFAULT_CUSTOM_COMPONENTS } from './storage/userStrategyPresets';
import type { AppSettings, StrategyOverride, StrategyId } from './types';

export function getStrategyOverrideForId(
  settings: AppSettings,
  strategyId: StrategyId,
): StrategyOverride | undefined {
  const fromTable = settings.strategyOverrides?.[strategyId];
  if (fromTable && Object.keys(fromTable).length > 0) return fromTable;

  // 旧版全局/ custom 专用字段回退
  if (strategyId === 'custom') {
    const legacy: StrategyOverride = {};
    if (settings.customInstruction?.trim()) legacy.instruction = settings.customInstruction.trim();
    if (settings.customTemperature != null) legacy.temperature = settings.customTemperature;
    if (settings.customMaxTokens != null) legacy.maxTokens = settings.customMaxTokens;
    return Object.keys(legacy).length > 0 ? legacy : undefined;
  }

  if (
    strategyId === settings.promptStrategy &&
    settings.customInstruction?.trim() &&
    !settings.strategyOverrides
  ) {
    return { instruction: settings.customInstruction.trim() };
  }

  return undefined;
}

export function patchStrategyOverrideForId(
  settings: AppSettings,
  strategyId: StrategyId,
  patch: StrategyOverride | null,
  options?: { replace?: boolean },
): AppSettings {
  const prev = { ...(settings.strategyOverrides ?? {}) };
  if (patch == null || Object.keys(patch).length === 0) {
    delete prev[strategyId];
  } else {
    const merged = options?.replace ? { ...patch } : { ...prev[strategyId], ...patch };
    const cleaned: StrategyOverride = {};
    if (merged.instruction?.trim()) cleaned.instruction = merged.instruction.trim();
    if (merged.temperature != null) cleaned.temperature = merged.temperature;
    if (merged.maxTokens != null) cleaned.maxTokens = merged.maxTokens;
    if (Object.keys(cleaned).length === 0) {
      delete prev[strategyId];
    } else {
      prev[strategyId] = cleaned;
    }
  }
  const nextOverrides = Object.keys(prev).length > 0 ? prev : undefined;
  const next: AppSettings = {
    ...settings,
    strategyOverrides: nextOverrides,
    customInstruction: undefined,
    customTemperature: undefined,
    customMaxTokens: undefined,
  };
  return next;
}

/** 从旧版 AppSettings 字段构建 strategyOverrides（仅当表中尚无数据时调用）。 */
export function migrateLegacyStrategyOverrides(
  stored: Partial<AppSettings>,
  promptStrategy: StrategyId,
): Partial<Record<StrategyId, StrategyOverride>> | undefined {
  if (stored.strategyOverrides && Object.keys(stored.strategyOverrides).length > 0) {
    return stored.strategyOverrides;
  }

  const out: Partial<Record<StrategyId, StrategyOverride>> = {};

  if (stored.customTemperature != null || stored.customMaxTokens != null) {
    const customOv: StrategyOverride = {};
    if (stored.customTemperature != null) customOv.temperature = stored.customTemperature;
    if (stored.customMaxTokens != null) customOv.maxTokens = stored.customMaxTokens;
    out.custom = customOv;
  }

  const globalInstruction = stored.customInstruction?.trim();
  if (globalInstruction) {
    if (promptStrategy === 'custom') {
      out.custom = { ...(out.custom ?? {}), instruction: globalInstruction };
    } else {
      out[promptStrategy] = { instruction: globalInstruction };
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function applyOverrideToResolved(
  resolved: ResolvedStrategy,
  ov: StrategyOverride | undefined,
): ResolvedStrategy {
  if (!ov) return resolved;
  const next = { ...resolved };
  if (ov.temperature != null) next.temperature = ov.temperature;
  if (ov.maxTokens != null) next.maxTokens = ov.maxTokens;
  return next;
}

/** 按 settings.promptStrategy（或显式 strategyId）解析反推用的扁平策略。 */
export function resolveStrategyForExtract(
  settings: AppSettings,
  strategyId?: StrategyId,
): PromptStrategy {
  const id = strategyId ?? settings.promptStrategy;
  const ov = getStrategyOverrideForId(settings, id);

  if (id === 'custom') {
    const components = settings.customComponents ?? DEFAULT_CUSTOM_COMPONENTS;
    return resolveCustomStrategy(components, {
      instruction: ov?.instruction,
      temperature: ov?.temperature,
      maxTokens: ov?.maxTokens,
    });
  }

  return applyOverrideToResolved(getStrategy(id), ov);
}

export function getReplaceInstructionForStrategy(
  settings: AppSettings,
  strategy: PromptStrategy,
): string | undefined {
  if (strategy.id === 'native') return undefined;
  const ov = getStrategyOverrideForId(settings, strategy.id);
  const text = ov?.instruction?.trim();
  return text || undefined;
}
