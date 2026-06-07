import type { AppSettings, StrategyId } from '@/lib/types';
import { getStrategyOverrideForId, patchStrategyOverrideForId } from '@/lib/strategyOverrides';

export const REPLACE_INSTRUCTION_HINT =
  '完全替代当前策略下的系统指令正文；清空或重置后恢复显示并使用策略档位与输出风格组合的默认指令。原生识别策略始终使用内置极简中文指令，不受此处影响。';

export function readReplaceInstruction(s: AppSettings, strategyId?: StrategyId): string {
  const id = strategyId ?? s.promptStrategy;
  return getStrategyOverrideForId(s, id)?.instruction ?? '';
}

export function writeReplaceInstruction(
  s: AppSettings,
  text: string,
  strategyId?: StrategyId,
): AppSettings {
  const id = strategyId ?? s.promptStrategy;
  const trimmed = text.trim();
  const prev = getStrategyOverrideForId(s, id) ?? {};
  const nextOv = { ...prev };
  if (trimmed) {
    nextOv.instruction = trimmed;
  } else {
    delete nextOv.instruction;
  }
  const patched = patchStrategyOverrideForId(
    s,
    id,
    Object.keys(nextOv).length > 0 ? nextOv : null,
    { replace: true },
  );
  return {
    ...patched,
    customPromptTemplate: '',
  };
}

export function applyPromptStrategyChange(
  settings: AppSettings,
  newStrategyId: StrategyId,
): AppSettings {
  return {
    ...settings,
    promptStrategy: newStrategyId,
  };
}

/** 策略页指纹 / 摘要一行 */
export function briefCustomPromptSummary(s: AppSettings, strategyId?: StrategyId): string | null {
  const instruction = readReplaceInstruction(s, strategyId).trim();
  if (!instruction) return null;
  return `替换指令 · ${instruction.length} 字`;
}
