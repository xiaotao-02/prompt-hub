import { PROVIDERS } from './providers';
import type { ProviderId } from './types';

export type ProviderInferenceSource = 'model_id' | 'model_list' | 'owned_by' | 'aggregator';

export interface ProviderInferenceResult {
  providerId: ProviderId;
  confidence: 'high' | 'medium';
  source: ProviderInferenceSource;
  reason: string;
}

/** OpenRouter 式 vendor/model（vendor 段全小写，如 openai/gpt-4o） */
const OPENROUTER_SLASH = /^[a-z][a-z0-9-]*\/[a-z0-9._+-]+$/;

/** HuggingFace / SiliconFlow 式 Org/Model（Org 首字母大写，如 Qwen/…） */
const HF_ORG_MODEL = /^[A-Z][A-Za-z0-9-]*\/[A-Za-z0-9._+-]+$/;

/** SiliconFlow 常见小写 org + 大写模型名（如 deepseek-ai/DeepSeek-V3） */
const HF_LOWERCASE_ORG = /^[a-z0-9-]+\/[A-Z][A-Za-z0-9._+-]+$/;

interface VendorIdRule {
  providerId: ProviderId;
  label: string;
  test: (id: string) => boolean;
}

/** 单厂商 model id 规则（不含 openai / anthropic / gemini 官方端点） */
const VENDOR_ID_RULES: VendorIdRule[] = [
  {
    providerId: 'minimax',
    label: 'MiniMax',
    test: (id) => /^MiniMax/i.test(id) || /^abab/i.test(id),
  },
  { providerId: 'zhipu', label: '智谱 GLM', test: (id) => /^glm-/i.test(id) },
  { providerId: 'qwen', label: '通义千问', test: (id) => /^qwen/i.test(id) },
  {
    providerId: 'deepseek',
    label: 'DeepSeek',
    test: (id) => /^deepseek/i.test(id) && !HF_ORG_MODEL.test(id),
  },
  {
    providerId: 'moonshot',
    label: 'Moonshot',
    test: (id) => /^moonshot-/i.test(id) || /^kimi-/i.test(id),
  },
  { providerId: 'doubao', label: '豆包', test: (id) => /^doubao-/i.test(id) || /^ep-20/i.test(id) },
  { providerId: 'yi', label: '零一万物 Yi', test: (id) => /^yi-/i.test(id) },
  { providerId: 'baidu', label: '百度千帆', test: (id) => /^ernie-/i.test(id) },
  { providerId: 'xai', label: 'xAI', test: (id) => /^grok-/i.test(id) },
  { providerId: 'stepfun', label: '阶跃星辰', test: (id) => /^step-/i.test(id) },
  {
    providerId: 'mistral',
    label: 'Mistral',
    test: (id) => /^pixtral-/i.test(id) || /^mistral-/i.test(id),
  },
  { providerId: 'groq', label: 'Groq', test: (id) => /^llama-3\.[12]/i.test(id) },
];

const OWNED_BY_MAP: Record<string, ProviderId> = {
  openai: 'openai',
  'openai-internal': 'openai',
  system: 'openai',
  anthropic: 'anthropic',
  google: 'gemini',
  'google-ai': 'gemini',
  deepseek: 'deepseek',
  'deepseek-ai': 'deepseek',
  minimax: 'minimax',
  'zhipu-ai': 'zhipu',
  zhipuai: 'zhipu',
  alibaba: 'qwen',
  dashscope: 'qwen',
  moonshot: 'moonshot',
  'moonshot-ai': 'moonshot',
  bytedance: 'doubao',
  volcengine: 'doubao',
  baidu: 'baidu',
  qianfan: 'baidu',
  '01-ai': 'yi',
  '01ai': 'yi',
  xai: 'xai',
  mistralai: 'mistral',
  mistral: 'mistral',
  groq: 'groq',
  together: 'together',
  fireworks: 'fireworks',
  'fireworks-ai': 'fireworks',
  openrouter: 'openrouter',
  siliconflow: 'siliconflow',
};

function matchVendorIdRule(modelId: string): VendorIdRule | null {
  const id = modelId.trim();
  if (!id) return null;
  for (const rule of VENDOR_ID_RULES) {
    if (rule.test(id)) return rule;
  }
  return null;
}

function isOpenRouterStyleId(modelId: string): boolean {
  return OPENROUTER_SLASH.test(modelId.trim());
}

function isHfOrgModelId(modelId: string): boolean {
  const id = modelId.trim();
  return HF_ORG_MODEL.test(id) || HF_LOWERCASE_ORG.test(id);
}

function detectOpenRouterAggregator(modelIds: string[]): ProviderInferenceResult | null {
  if (modelIds.length === 0) return null;
  const matching = modelIds.filter(isOpenRouterStyleId);
  const ratio = matching.length / modelIds.length;
  if (ratio < 0.3) return null;
  const prefixes = new Set(matching.map((id) => id.split('/')[0]!.toLowerCase()));
  if (prefixes.size < 3) return null;
  const samples = [...prefixes].slice(0, 3).join('、');
  return {
    providerId: 'openrouter',
    confidence: 'high',
    source: 'aggregator',
    reason: `模型列表含多种 vendor/model 前缀（如 ${samples}），识别为聚合端点 OpenRouter`,
  };
}

function detectSiliconFlowStyle(modelIds: string[]): ProviderInferenceResult | null {
  if (modelIds.length === 0) return null;
  const matching = modelIds.filter(isHfOrgModelId);
  if (matching.length / modelIds.length < 0.5) return null;
  return {
    providerId: 'siliconflow',
    confidence: 'medium',
    source: 'model_list',
    reason: '模型列表多为 Org/Model 格式（如 Qwen/、deepseek-ai/），可能为 SiliconFlow 等聚合端点',
  };
}

function detectDominantVendor(modelIds: string[]): ProviderInferenceResult | null {
  if (modelIds.length === 0) return null;
  const counts = new Map<ProviderId, { count: number; label: string }>();
  for (const id of modelIds) {
    const rule = matchVendorIdRule(id);
    if (!rule) continue;
    const prev = counts.get(rule.providerId);
    counts.set(rule.providerId, {
      count: (prev?.count ?? 0) + 1,
      label: rule.label,
    });
  }
  let best: { providerId: ProviderId; count: number; label: string } | null = null;
  for (const [providerId, { count, label }] of counts) {
    if (!best || count > best.count) {
      best = { providerId, count, label };
    }
  }
  if (!best || best.count / modelIds.length < 0.8) return null;
  const meta = PROVIDERS[best.providerId];
  return {
    providerId: best.providerId,
    confidence: 'high',
    source: 'model_list',
    reason: `${Math.round((best.count / modelIds.length) * 100)}% 模型符合「${best.label}」命名，自动识别为「${meta.label}」`,
  };
}

function detectOwnedByConsensus(ownedByValues: string[]): ProviderInferenceResult | null {
  const values = ownedByValues.map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let topKey = '';
  let topCount = 0;
  for (const [k, c] of counts) {
    if (c > topCount) {
      topKey = k;
      topCount = c;
    }
  }
  if (topCount / values.length < 0.8) return null;
  const mapped = OWNED_BY_MAP[topKey];
  if (!mapped) return null;
  const meta = PROVIDERS[mapped];
  return {
    providerId: mapped,
    confidence: 'medium',
    source: 'owned_by',
    reason: `端点返回的 owned_by 多为「${topKey}」，可能对应「${meta.label}」`,
  };
}

/**
 * 从单个 model id 推断内置 Provider（导入配置时同步使用）。
 * 聚合端点格式优先于单厂商规则。
 */
export function inferProviderFromModelId(modelId: string): ProviderInferenceResult | null {
  const id = modelId.trim();
  if (!id) return null;

  if (isHfOrgModelId(id)) {
    return {
      providerId: 'siliconflow',
      confidence: 'medium',
      source: 'model_id',
      reason: `模型 id「${id}」符合 SiliconFlow 等平台常用 Org/Model 命名`,
    };
  }

  if (isOpenRouterStyleId(id)) {
    return {
      providerId: 'openrouter',
      confidence: 'high',
      source: 'aggregator',
      reason: `模型 id「${id}」为聚合端点格式（vendor/model），建议选 OpenRouter`,
    };
  }

  if (isHfOrgModelId(id)) {
    return {
      providerId: 'siliconflow',
      confidence: 'medium',
      source: 'model_id',
      reason: `模型 id「${id}」符合 SiliconFlow 等平台常用 Org/Model 命名`,
    };
  }

  const rule = matchVendorIdRule(id);
  if (!rule) return null;
  const meta = PROVIDERS[rule.providerId];
  return {
    providerId: rule.providerId,
    confidence: 'high',
    source: 'model_id',
    reason: `模型 id「${id}」符合「${rule.label}」，推断为「${meta.label}」`,
  };
}

/**
 * 从 `/models` 拉取的完整列表推断内置 Provider。
 * 优先级：OpenRouter 聚合 → 单厂商主导 → SiliconFlow 风格 → owned_by 共识。
 */
export function inferProviderFromModelList(
  modelIds: string[],
  opts?: { ownedByValues?: string[] },
): ProviderInferenceResult | null {
  const ids = modelIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return null;

  const aggregator = detectOpenRouterAggregator(ids);
  if (aggregator) return aggregator;

  const dominant = detectDominantVendor(ids);
  if (dominant) return dominant;

  const silicon = detectSiliconFlowStyle(ids);
  if (silicon) return silicon;

  if (opts?.ownedByValues?.length) {
    return detectOwnedByConsensus(opts.ownedByValues);
  }

  return null;
}

/** 导入流程用的薄封装：接受 high / medium 置信度。 */
export function matchProviderByModel(model: string): ProviderId | null {
  const result = inferProviderFromModelId(model);
  if (!result) return null;
  return result.providerId;
}
