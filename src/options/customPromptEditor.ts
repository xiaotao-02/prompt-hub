import type { AppSettings } from '@/lib/types';
import type { StrategyId } from '@/lib/strategies-meta';

export type CustomPromptMode = 'append' | 'replace';

export function detectCustomPromptMode(s: AppSettings): CustomPromptMode {
  if (s.customInstruction?.trim()) return 'replace';
  return 'append';
}

export function readCustomPromptText(s: AppSettings, mode: CustomPromptMode): string {
  return mode === 'replace' ? (s.customInstruction ?? '') : (s.customPromptTemplate ?? '');
}

/** 互斥写入：append → customPromptTemplate；replace → customInstruction */
export function writeCustomPromptText(
  s: AppSettings,
  mode: CustomPromptMode,
  text: string,
): AppSettings {
  if (mode === 'replace') {
    return {
      ...s,
      customInstruction: text.trim() || undefined,
      customPromptTemplate: '',
    };
  }
  return {
    ...s,
    customPromptTemplate: text,
    customInstruction: undefined,
  };
}

export function switchCustomPromptMode(
  s: AppSettings,
  fromMode: CustomPromptMode,
  toMode: CustomPromptMode,
): AppSettings {
  if (fromMode === toMode) return s;
  const text = readCustomPromptText(s, fromMode);
  return writeCustomPromptText(s, toMode, text);
}

/**
 * 离开「自定义组合」时：将 replace 正文迁入 append 字段，避免静默失效。
 */
export function migrateSettingsForBuiltinStrategy(settings: AppSettings): AppSettings {
  if (settings.promptStrategy === 'custom') return settings;
  const instruction = settings.customInstruction?.trim();
  if (!instruction) {
    if (settings.customInstruction === undefined) return settings;
    return { ...settings, customInstruction: undefined };
  }
  const existing = settings.customPromptTemplate?.trim() ?? '';
  const template = existing ? `${existing}\n\n${instruction}` : instruction;
  return {
    ...settings,
    customPromptTemplate: template,
    customInstruction: undefined,
  };
}

export function applyPromptStrategyChange(
  settings: AppSettings,
  newStrategyId: StrategyId,
): AppSettings {
  return migrateSettingsForBuiltinStrategy({
    ...settings,
    promptStrategy: newStrategyId,
  });
}

/** 策略页指纹 / 摘要一行 */
export function briefCustomPromptSummary(s: AppSettings): string | null {
  if (s.customInstruction?.trim()) {
    const n = s.customInstruction.trim().length;
    return `替换指令 · ${n} 字`;
  }
  const t = s.customPromptTemplate?.trim();
  if (!t) return null;
  const preview = t.length > 28 ? `${t.slice(0, 28)}…` : t;
  return `追加：${preview}`;
}

export const CUSTOM_PROMPT_MODE_HINT: Record<CustomPromptMode, string> = {
  append:
    '叠在当前策略的系统提示上；拼接位置由策略版本决定（高保真档前置、经典档以「额外要求：」追加）。',
  replace: '完全替代所选指令集正文，四种输出风格共用同一段；仅在选择「自定义组合」时可用。',
};
