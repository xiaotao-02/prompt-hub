/**
 * 面板「策略 / 输出风格」与当前展示版本 meta 的漂移检测，及空输入时的合成 refine 指令。
 * 仅依赖 strategies-meta 轻量标签，供 content 与单测共用。
 */
import { EXTRACT_STREAM_VERSION_ID, REFINE_STREAM_VERSION_ID } from './streamVersionSentinels';
import { OUTPUT_STYLE_LABELS, STRATEGY_LABELS } from './strategies-meta';
import type { OutputStyle, PromptVersion, StrategyId } from './types';

export type DisplayedVersionMeta = {
  strategy?: StrategyId;
  style?: OutputStyle;
};

export type PromptSettingsDriftInput = {
  strategy?: StrategyId;
  outputStyle?: OutputStyle;
  versions?: PromptVersion[];
  selectedVersionId?: string;
};

export type PromptSettingsDrift = {
  strategyChanged: boolean;
  outputStyleChanged: boolean;
  source: DisplayedVersionMeta;
};

function isStreamSentinelVersionId(id: string | undefined): boolean {
  if (!id) return false;
  return (
    id === REFINE_STREAM_VERSION_ID ||
    id === EXTRACT_STREAM_VERSION_ID ||
    id.startsWith(`${REFINE_STREAM_VERSION_ID}:`) ||
    id.startsWith(`${EXTRACT_STREAM_VERSION_ID}:`)
  );
}

/** 当前编辑器所依据版本的 strategy / style（用于与面板下拉对比）。 */
export function resolveDisplayedVersionMeta(
  versions: PromptVersion[] | undefined,
  selectedVersionId: string | undefined,
): DisplayedVersionMeta {
  const list = versions ?? [];
  if (list.length === 0) return {};

  let version: PromptVersion | undefined;
  if (selectedVersionId && !isStreamSentinelVersionId(selectedVersionId)) {
    version = list.find((v) => v.id === selectedVersionId);
  }
  if (!version) version = list[0];

  const meta = version?.meta;
  if (!meta) return {};
  return {
    ...(meta.strategy ? { strategy: meta.strategy } : {}),
    ...(meta.style ? { style: meta.style } : {}),
  };
}

function strategyLabel(id: StrategyId | undefined): string {
  if (!id) return '未知策略';
  return STRATEGY_LABELS[id] ?? id;
}

function outputStyleLabel(id: OutputStyle | undefined): string {
  if (!id) return '未知格式';
  return OUTPUT_STYLE_LABELS[id] ?? id;
}

/** native 策略反推忽略 outputStyle 档位（与 extract 一致）。 */
export function effectiveOutputStyleForReflow(
  strategy: StrategyId | undefined,
  outputStyle: OutputStyle | undefined,
): OutputStyle | undefined {
  if (strategy === 'native') return 'natural-zh';
  return outputStyle;
}

export function detectPromptSettingsDrift(input: PromptSettingsDriftInput): PromptSettingsDrift {
  const source = resolveDisplayedVersionMeta(input.versions, input.selectedVersionId);
  const currentStrategy = input.strategy;
  const currentStyle = effectiveOutputStyleForReflow(currentStrategy, input.outputStyle);
  const sourceStyle = effectiveOutputStyleForReflow(source.strategy, source.style);

  const strategyChanged =
    currentStrategy != null && source.strategy != null && currentStrategy !== source.strategy;

  const outputStyleChanged =
    currentStyle != null && sourceStyle != null && currentStyle !== sourceStyle && !strategyChanged;

  return {
    strategyChanged,
    outputStyleChanged,
    source,
  };
}

export function buildOutputStyleReflowInstruction(
  fromStyle: OutputStyle,
  toStyle: OutputStyle,
): string {
  const fromLabel = outputStyleLabel(fromStyle);
  const toLabel = outputStyleLabel(toStyle);
  return [
    `用户已将输出格式从「${fromLabel}」切换为「${toLabel}」。`,
    '请根据【当前提示词】中的画面与语义信息，按新输出格式的结构与语种要求，输出一版完整、可直接用于生图的新提示词正文。',
    '保留主体、构图与关键视觉要素，按新格式重组表述；不要只同义词替换。',
    '直接输出最终正文，不要前缀、解释、引号或 Markdown 标题。',
  ].join('\n');
}

export function buildStrategyStyleReflowInstruction(
  fromStrategy: StrategyId | undefined,
  toStrategy: StrategyId,
  fromStyle: OutputStyle | undefined,
  toStyle: OutputStyle,
): string {
  const fromStrat = strategyLabel(fromStrategy);
  const toStrat = strategyLabel(toStrategy);
  const fromFmt = outputStyleLabel(
    effectiveOutputStyleForReflow(fromStrategy, fromStyle) ?? fromStyle,
  );
  const toFmt = outputStyleLabel(toStyle);
  return [
    `用户已将策略从「${fromStrat}」切换为「${toStrat}」，输出格式目标为「${toFmt}」（原格式：${fromFmt}）。`,
    '当前无参考图可重新识图，请根据【当前提示词】按新策略的表述习惯与目标输出格式，输出一版完整、可直接用于生图的新提示词正文。',
    '保留可识别的画面主体与关键视觉信息，可按新策略维度重组；不要只同义词替换。',
    '直接输出最终正文，不要前缀、解释、引号或 Markdown 标题。',
  ].join('\n');
}
