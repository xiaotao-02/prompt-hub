import type { ProviderId } from './types';
import { PROVIDERS } from './providers';
import { STRATEGY_LABELS, type StrategyId } from './strategies-meta';

const STRATEGY_CHIP_LABELS: Record<StrategyId, string> = {
  classic: '经典',
  v022: 'v0.2.2',
  v030: 'v0.3.0',
  v035: 'v0.3.5',
  v036: 'v0.3.6',
  native: '原生',
  custom: '自定义',
};

const PROVIDER_CHIP_LABELS: Partial<Record<ProviderId, string>> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
};

/** 版本列表 chip 用的策略短标签；完整名见 STRATEGY_LABELS。 */
export function strategyChipLabel(id: StrategyId | undefined): string {
  if (!id) return '';
  if (STRATEGY_CHIP_LABELS[id]) return STRATEGY_CHIP_LABELS[id];
  const full = STRATEGY_LABELS[id];
  if (!full) return id;
  return full.replace(/ 通用高还原$/, '').replace(/ 策略$/, '');
}

function shortProviderLabel(provider: string): string {
  const id = provider as ProviderId;
  const mapped = PROVIDER_CHIP_LABELS[id];
  if (mapped) return mapped;

  const meta = PROVIDERS[id];
  if (meta?.label) {
    const parts = meta.label.split(/\s+/).filter(Boolean);
    if (parts.length > 1) return parts[parts.length - 1]!;
    return parts[0] ?? provider;
  }

  return provider;
}

function shortModelName(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) return trimmed;

  const m = trimmed.replace(/-latest$/i, '');

  const claudeMatch = /^claude(?:-[\d]+)+-(.+)$/i.exec(m);
  if (claudeMatch) return claudeMatch[1]!;

  if (/^gpt-/i.test(m)) return m.replace(/^gpt-/i, '');

  const parts = m.split('-').filter(Boolean);
  if (parts.length <= 2) return m;
  return parts.slice(-2).join('-');
}

/** 版本列表 chip：short 用于展示，full 用于 title 悬停。 */
export function providerModelChipLabel(
  provider: string,
  model: string,
): { short: string; full: string } {
  const full = `${provider} · ${model}`;
  const short = `${shortProviderLabel(provider)} · ${shortModelName(model)}`;
  return { short, full };
}
