import type { StrategyId } from './strategies-meta';
import type { AppSettings, UserStrategyPreset } from './types';
import { findMatchingUserPreset } from './storage/userStrategyPresets';

export function isPresetOptionActive(
  settings: AppSettings,
  preset: UserStrategyPreset,
  presets: UserStrategyPreset[],
): boolean {
  const match = findMatchingUserPreset(settings, presets);
  return match?.id === preset.id;
}

export function isBuiltinStrategyOptionActive(
  settings: AppSettings,
  strategyId: StrategyId,
  presets: UserStrategyPreset[],
): boolean {
  if (settings.promptStrategy !== strategyId) return false;
  if (strategyId === 'custom' && findMatchingUserPreset(settings, presets)) return false;
  return true;
}

export function resolveStrategySelectTriggerLabel(
  settings: AppSettings,
  strategyId: StrategyId,
  presets: UserStrategyPreset[],
  builtinLabelFor: (id: StrategyId) => string,
): string {
  const match = findMatchingUserPreset(settings, presets);
  if (match) return match.name;
  return builtinLabelFor(strategyId);
}

export function resolveStrategySectionDescription(
  settings: AppSettings,
  presets: UserStrategyPreset[],
  builtinDescription: string,
): string {
  const match = findMatchingUserPreset(settings, presets);
  if (match) return '已保存的自定义组合';
  return builtinDescription;
}
