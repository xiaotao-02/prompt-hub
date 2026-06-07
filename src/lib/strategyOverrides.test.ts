import { describe, expect, it } from 'vitest';
import {
  getStrategyOverrideForId,
  migrateLegacyStrategyOverrides,
  patchStrategyOverrideForId,
  resolveStrategyForExtract,
  getReplaceInstructionForStrategy,
} from './strategyOverrides';
import { getStrategy } from './strategies';
import type { AppSettings } from './types';

const base = {
  promptStrategy: 'v036',
  outputStyle: 'natural-zh',
} as AppSettings;

describe('migrateLegacyStrategyOverrides', () => {
  it('maps custom temp/max to custom and instruction to active strategy', () => {
    const migrated = migrateLegacyStrategyOverrides(
      {
        customTemperature: 0.25,
        customMaxTokens: 2000,
        customInstruction: '全局替换',
        promptStrategy: 'v036',
      },
      'v036',
    );
    expect(migrated?.custom).toEqual({ temperature: 0.25, maxTokens: 2000 });
    expect(migrated?.v036?.instruction).toBe('全局替换');
  });

  it('puts instruction on custom when active strategy is custom', () => {
    const migrated = migrateLegacyStrategyOverrides(
      {
        customInstruction: '自定义替换',
        customTemperature: 0.2,
        promptStrategy: 'custom',
      },
      'custom',
    );
    expect(migrated?.custom).toEqual({
      instruction: '自定义替换',
      temperature: 0.2,
    });
  });
});

describe('strategyOverrides per strategy', () => {
  it('stores and reads override per strategy id', () => {
    let s = patchStrategyOverrideForId(base, 'v036', {
      instruction: 'v036 专用',
      temperature: 0.35,
    });
    s = patchStrategyOverrideForId(s, 'classic', { temperature: 0.5 });
    expect(getStrategyOverrideForId(s, 'v036')?.instruction).toBe('v036 专用');
    expect(getStrategyOverrideForId(s, 'classic')?.temperature).toBe(0.5);
    expect(getStrategyOverrideForId(s, 'classic')?.instruction).toBeUndefined();
  });

  it('resolveStrategyForExtract applies per-strategy temperature', () => {
    const s = patchStrategyOverrideForId(base, 'v036', { temperature: 0.11 });
    const resolved = resolveStrategyForExtract(s, 'v036');
    expect(resolved.temperature).toBe(0.11);
    expect(resolved.maxTokens).toBe(getStrategy('v036').maxTokens);
  });

  it('native ignores replace instruction', () => {
    const s = patchStrategyOverrideForId({ ...base, promptStrategy: 'native' }, 'native', {
      instruction: '不应生效',
    });
    const strategy = resolveStrategyForExtract(s, 'native');
    expect(getReplaceInstructionForStrategy(s, strategy)).toBeUndefined();
  });
});
