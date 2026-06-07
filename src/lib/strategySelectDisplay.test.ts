import { describe, expect, it } from 'vitest';
import type { AppSettings, UserStrategyPreset } from './types';
import {
  isBuiltinStrategyOptionActive,
  isPresetOptionActive,
  resolveStrategySelectTriggerLabel,
} from './strategySelectDisplay';
import { DEFAULT_CUSTOM_COMPONENTS } from './storage/userStrategyPresets';

const baseSettings = {
  promptStrategy: 'custom',
  customComponents: { ...DEFAULT_CUSTOM_COMPONENTS },
  customPromptTemplate: '',
} as AppSettings;

const presetA: UserStrategyPreset = {
  id: 'preset-a',
  name: '我的高还原',
  createdAt: 1,
  updatedAt: 1,
  customComponents: { ...DEFAULT_CUSTOM_COMPONENTS },
  customPromptTemplate: '',
  strategyOverride: { temperature: 0.25 },
};

const presetB: UserStrategyPreset = {
  ...presetA,
  id: 'preset-b',
  name: '另一档',
  strategyOverride: { temperature: 0.5 },
};

describe('strategySelectDisplay', () => {
  it('shows preset name in trigger when settings match', () => {
    const settings: AppSettings = {
      ...baseSettings,
      strategyOverrides: { custom: { temperature: 0.25 } },
    };
    expect(
      resolveStrategySelectTriggerLabel(settings, 'custom', [presetA, presetB], () => '自定义组合'),
    ).toBe('我的高还原');
  });

  it('falls back to builtin label when custom params drift from preset', () => {
    const settings: AppSettings = {
      ...baseSettings,
      strategyOverrides: { custom: { temperature: 0.99 } },
    };
    expect(
      resolveStrategySelectTriggerLabel(settings, 'custom', [presetA], () => '自定义组合'),
    ).toBe('自定义组合');
  });

  it('marks builtin custom active only when no preset matches', () => {
    const matching: AppSettings = {
      ...baseSettings,
      strategyOverrides: { custom: { temperature: 0.25 } },
    };
    const drift: AppSettings = {
      ...baseSettings,
      strategyOverrides: { custom: { temperature: 0.99 } },
    };
    expect(isBuiltinStrategyOptionActive(matching, 'custom', [presetA])).toBe(false);
    expect(isBuiltinStrategyOptionActive(drift, 'custom', [presetA])).toBe(true);
    expect(isPresetOptionActive(matching, presetA, [presetA])).toBe(true);
    expect(isPresetOptionActive(drift, presetA, [presetA])).toBe(false);
  });
});
