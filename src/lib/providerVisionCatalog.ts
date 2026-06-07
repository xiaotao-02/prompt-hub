import type { ProviderId } from './types';

/** 静态示例目录最近审计月份（发版前可更新） */
export const CATALOG_UPDATED = '2026-06';

export interface ProviderVisionCatalogEntry {
  visionExamples: string[];
  nonVisionExamples: string[];
  notes?: string;
}

/**
 * 各内置供应商的识图模型示例（未拉取端点时用于设置页卡片展示）。
 * 仅作展示；拦截逻辑见 modelVision + providerVisionFamilies。
 */
export const PROVIDER_VISION_CATALOG: Record<ProviderId, ProviderVisionCatalogEntry> = {
  openai: {
    visionExamples: ['gpt-5.5', 'gpt-5.4', 'gpt-4o', 'gpt-4o-mini', 'o4-mini', 'o3-mini'],
    nonVisionExamples: ['text-embedding-3-small', 'tts-1', 'dall-e-3'],
  },
  anthropic: {
    visionExamples: [
      'claude-sonnet-4-6',
      'claude-opus-4-8',
      'claude-opus-4-20250514',
      'claude-3-7-sonnet-latest',
    ],
    nonVisionExamples: [],
    notes: 'Claude Sonnet 4.6 / Opus 4.8 多模态；以控制台为准',
  },
  gemini: {
    visionExamples: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    nonVisionExamples: ['gemini-embedding-001'],
  },
  zhipu: {
    visionExamples: ['glm-4.6v', 'glm-4v-plus', 'glm-4v-flash'],
    nonVisionExamples: ['glm-4-flash', 'glm-4-plus', 'glm-4.6', 'embedding-3'],
  },
  qwen: {
    visionExamples: [
      'qwen3-vl-plus',
      'qwen3-vl-235b-a22b-instruct',
      'qwen-vl-max-latest',
      'qwen2.5-vl-72b-instruct',
    ],
    nonVisionExamples: ['qwen-max', 'qwen-plus', 'text-embedding-v3'],
  },
  siliconflow: {
    visionExamples: [
      'Qwen/Qwen3-VL-32B-Instruct',
      'Qwen/Qwen3-VL-30B-A3B-Instruct',
      'zai-org/GLM-4.6V',
      'deepseek-ai/deepseek-vl2',
    ],
    nonVisionExamples: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'],
  },
  deepseek: {
    visionExamples: [],
    nonVisionExamples: ['deepseek-chat', 'deepseek-reasoner'],
    notes: '官方 API 不支持识图；请用 SiliconFlow 等聚合的 DeepSeek-VL',
  },
  moonshot: {
    visionExamples: ['moonshot-v1-32k-vision-preview', 'moonshot-v1-8k-vision-preview'],
    nonVisionExamples: [],
    notes: '纯 moonshot-v1-* 无 vision 后缀时以端点标注为准',
  },
  doubao: {
    visionExamples: ['doubao-1-5-vision-pro-32k-250115', 'doubao-1-5-thinking-vision-pro'],
    nonVisionExamples: ['doubao-pro-32k', 'doubao-lite-32k'],
  },
  stepfun: {
    visionExamples: ['step-1v-32k', 'step-1o-turbo-vision'],
    nonVisionExamples: ['step-2-mini', 'step-1-8k'],
  },
  minimax: {
    visionExamples: ['MiniMax-VL-01'],
    nonVisionExamples: [
      'MiniMax-M2-latest',
      'MiniMax-M2.5-highspeed',
      'MiniMax-M2.7-highspeed',
      'abab6.5-chat',
    ],
    notes: '识图请选 VL；M2 系列勿用于参考图反推',
  },
  yi: {
    visionExamples: ['yi-vision-v2', 'yi-vl-plus'],
    nonVisionExamples: ['yi-large', 'yi-medium'],
  },
  baidu: {
    visionExamples: ['ernie-4.5-turbo-vl-32k', 'ernie-4.0-turbo-8k-vl'],
    nonVisionExamples: ['ernie-4.0-turbo-8k', 'embedding-v1'],
  },
  openrouter: {
    visionExamples: [
      'openai/gpt-5.5',
      'anthropic/claude-sonnet-4.6',
      'google/gemini-2.5-flash',
      'openai/gpt-4o-mini',
    ],
    nonVisionExamples: ['openai/text-embedding-3-small'],
    notes: '拉取端点后可按 input_modalities 精确标注',
  },
  xai: {
    visionExamples: ['grok-4.3', 'grok-3', 'grok-2-vision-latest', 'grok-vision-beta'],
    nonVisionExamples: [],
    notes: '无 vision 后缀的 grok 型号以端点列表为准',
  },
  mistral: {
    visionExamples: ['pixtral-large-latest', 'pixtral-12b-2409'],
    nonVisionExamples: [],
    notes: 'mistral-large 等纯文本型号可能仍支持图，以端点为准',
  },
  groq: {
    visionExamples: ['llama-3.2-90b-vision-preview', 'llama-3.2-11b-vision-preview'],
    nonVisionExamples: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  },
  together: {
    visionExamples: [
      'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      'Qwen/Qwen3-VL-32B-Instruct',
      'Qwen/Qwen2.5-VL-72B-Instruct',
    ],
    nonVisionExamples: ['meta-llama/Llama-3.1-70B-Instruct-Turbo'],
  },
  fireworks: {
    visionExamples: ['accounts/fireworks/models/llama-v3p2-90b-vision-instruct'],
    nonVisionExamples: ['accounts/fireworks/models/llama-v3p1-70b-instruct'],
  },
  shukelongda: {
    visionExamples: ['gpt-5.5', 'gpt-4o-mini', 'gpt-4o'],
    nonVisionExamples: ['text-embedding-3-small'],
    notes: '具体以中转站模型列表为准',
  },
  custom: {
    visionExamples: ['gpt-5.5', 'gpt-4o-mini', 'gpt-4o'],
    nonVisionExamples: ['text-embedding-3-small'],
    notes: '自定义端点请拉取模型列表后查看识图标注',
  },
};

export function getProviderVisionCatalog(providerId: ProviderId): ProviderVisionCatalogEntry {
  return PROVIDER_VISION_CATALOG[providerId];
}

/**
 * 暂不支持识图的供应商：visionExamples 为空（platform 除外，其按拉取模型识图）。
 * 名单随 CATALOG_UPDATED 每月复核，无需单独维护。
 */
export const PROVIDERS_WITHOUT_VISION: ReadonlySet<ProviderId> = new Set(
  (Object.keys(PROVIDER_VISION_CATALOG) as ProviderId[]).filter(
    (id) => PROVIDER_VISION_CATALOG[id].visionExamples.length === 0,
  ),
);

export function isProviderVisionUnsupported(id: ProviderId): boolean {
  return PROVIDERS_WITHOUT_VISION.has(id);
}
