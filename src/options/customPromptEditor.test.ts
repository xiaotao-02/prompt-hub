import { describe, expect, it } from 'vitest';
import type { AppSettings } from '@/lib/types';
import {
  applyPromptStrategyChange,
  detectCustomPromptMode,
  migrateSettingsForBuiltinStrategy,
  switchCustomPromptMode,
  writeCustomPromptText,
} from './customPromptEditor';

const base = {
  customPromptTemplate: '追加文案',
  customInstruction: undefined,
  promptStrategy: 'v036',
} as Pick<AppSettings, 'customPromptTemplate' | 'customInstruction' | 'promptStrategy'>;

describe('customPromptEditor', () => {
  it('infers replace when customInstruction is set', () => {
    expect(
      detectCustomPromptMode({
        ...base,
        customInstruction: '整段替换',
      } as AppSettings),
    ).toBe('replace');
  });

  it('writeText is mutually exclusive', () => {
    const appended = writeCustomPromptText(base as AppSettings, 'append', '仅追加');
    expect(appended.customPromptTemplate).toBe('仅追加');
    expect(appended.customInstruction).toBeUndefined();

    const replaced = writeCustomPromptText(base as AppSettings, 'replace', '仅替换');
    expect(replaced.customInstruction).toBe('仅替换');
    expect(replaced.customPromptTemplate).toBe('');
  });

  it('switchCustomPromptMode moves text between fields', () => {
    const s = { ...base, customPromptTemplate: '氛围描写' } as AppSettings;
    const next = switchCustomPromptMode(s, 'append', 'replace');
    expect(next.customInstruction).toBe('氛围描写');
    expect(next.customPromptTemplate).toBe('');
  });

  it('migrateSettingsForBuiltinStrategy merges replace into append', () => {
    const s = {
      ...base,
      promptStrategy: 'classic',
      customInstruction: '自写指令',
      customPromptTemplate: '已有追加',
    } as AppSettings;
    const m = migrateSettingsForBuiltinStrategy(s);
    expect(m.customInstruction).toBeUndefined();
    expect(m.customPromptTemplate).toBe('已有追加\n\n自写指令');
  });

  it('applyPromptStrategyChange migrates when leaving custom', () => {
    const s = {
      ...base,
      promptStrategy: 'custom',
      customInstruction: '替换正文',
    } as AppSettings;
    const m = applyPromptStrategyChange(s, 'classic');
    expect(m.promptStrategy).toBe('classic');
    expect(m.customInstruction).toBeUndefined();
    expect(m.customPromptTemplate).toContain('替换正文');
  });
});
