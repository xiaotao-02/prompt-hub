import { describe, expect, it } from 'vitest';
import type { AppSettings } from '@/lib/types';
import {
  applyPromptStrategyChange,
  briefCustomPromptSummary,
  readReplaceInstruction,
  writeReplaceInstruction,
} from './customPromptEditor';

const base = {
  customPromptTemplate: '旧追加文案',
  promptStrategy: 'v036',
} as Pick<AppSettings, 'customPromptTemplate' | 'promptStrategy'>;

describe('customPromptEditor', () => {
  it('readReplaceInstruction returns per-strategy override', () => {
    expect(readReplaceInstruction(base as AppSettings)).toBe('');
    const withOv = {
      ...base,
      strategyOverrides: { v036: { instruction: '整段替换' } },
    } as AppSettings;
    expect(readReplaceInstruction(withOv)).toBe('整段替换');
  });

  it('readReplaceInstruction falls back to legacy customInstruction on active strategy', () => {
    expect(readReplaceInstruction({ ...base, customInstruction: '旧全局' } as AppSettings)).toBe(
      '旧全局',
    );
  });

  it('writeReplaceInstruction stores in strategyOverrides and clears customPromptTemplate', () => {
    const next = writeReplaceInstruction(base as AppSettings, '仅替换');
    expect(next.strategyOverrides?.v036?.instruction).toBe('仅替换');
    expect(next.customPromptTemplate).toBe('');
    expect(next.customInstruction).toBeUndefined();

    const cleared = writeReplaceInstruction(
      {
        ...base,
        strategyOverrides: { v036: { instruction: 'x', temperature: 0.3 } },
      } as AppSettings,
      '   ',
    );
    expect(cleared.strategyOverrides?.v036?.instruction).toBeUndefined();
    expect(cleared.strategyOverrides?.v036?.temperature).toBe(0.3);
  });

  it('briefCustomPromptSummary only for replace text', () => {
    expect(briefCustomPromptSummary(base as AppSettings)).toBeNull();
    expect(
      briefCustomPromptSummary({
        ...base,
        strategyOverrides: { v036: { instruction: 'abc' } },
      } as AppSettings),
    ).toBe('替换指令 · 3 字');
  });

  it('applyPromptStrategyChange only switches promptStrategy', () => {
    const s = {
      ...base,
      promptStrategy: 'custom',
      strategyOverrides: { custom: { instruction: '替换正文' } },
    } as AppSettings;
    const m = applyPromptStrategyChange(s, 'classic');
    expect(m.promptStrategy).toBe('classic');
    expect(m.strategyOverrides?.custom?.instruction).toBe('替换正文');
  });
});
