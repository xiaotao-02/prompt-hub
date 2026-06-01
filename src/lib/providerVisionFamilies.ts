import type { ProviderId } from './types';

/** 全局高置信「非识图」：embed / 语音 / 生图 / 视频等 */
export const GLOBAL_DEFINITE_NO_VISION: RegExp[] = [
  /\bembed/i,
  /\bembedding/i,
  /\btts\b/i,
  /\bwhisper/i,
  /\bdall-?e/i,
  /\bmoderation/i,
  /\bimage-01/i,
  /\bhailuo/i,
  /\bspeech/i,
  /\bmusic/i,
  /\btranscrib/i,
  /\btext-to-image/i,
  /\bvideo/i,
  /\brerank/i,
  /\binstruct-only/i,
  /\bcode-interpreter/i,
  /\brealtime/i,
];

/** 全局对话多模态族（新型号如 gpt-5.5 自动覆盖） */
export const GLOBAL_LIKELY_CHAT_VISION: RegExp[] = [
  /\bgpt-\d/i,
  /\bgpt-5/i,
  /\bchatgpt-/i,
  /\bo\d/i,
  /\bclaude-\d/i,
  /\bclaude-opus/i,
  /\bclaude-sonnet/i,
  /\bclaude-haiku/i,
  /\bgemini-\d/i,
  /\bgemini-\d+\.\d/i,
  /\bgrok-\d/i,
  /\bgrok-vision/i,
  /\bpixtral/i,
  /\bvl\b/i,
  /\b4v\b/i,
  /\bvision\b/i,
  /\bmultimodal\b/i,
  /\bgpt-4o/i,
  /\bglm-4v/i,
  /\bqwen-vl/i,
  /\bqwen2\.?5-vl/i,
  /\bqwen3-vl/i,
  /\bqwen3\.5-vl/i,
  /\bernie-.*vl/i,
  /\bdoubao-.*vision/i,
  /\bseed-.*vision/i,
  /\bstep-1v/i,
  /\byi-vision/i,
  /\bmoonshot-v1.*vision/i,
  /\bMiniMax-VL/i,
];

/** 厂商级高置信非识图 */
export const PROVIDER_DEFINITE_NO_VISION: Partial<Record<ProviderId, RegExp[]>> = {
  minimax: [/^MiniMax-M2/i, /^abab/i],
  deepseek: [/^deepseek-(chat|reasoner)/i],
  qwen: [/^qwen-max$/i, /^qwen-plus$/i, /^text-embedding/i],
  zhipu: [/^embedding/i],
  groq: [/\bmixtral/i, /\bllama-3\.3-70b/i],
};

/** 厂商级补充识图族 */
export const PROVIDER_LIKELY_VISION: Partial<Record<ProviderId, RegExp[]>> = {
  minimax: [/^MiniMax-VL/i],
  qwen: [/qwen3/i, /qwen2\.5/i],
  zhipu: [/glm-4v/i, /glm-4\.\d+v/i],
  doubao: [/doubao-.*vision/i, /seed-.*vision/i],
  baidu: [/ernie-4\.5/i, /ernie-.*vl/i],
  moonshot: [/vision-preview/i, /vision/i],
  xai: [/vision/i],
  stepfun: [/vision/i, /step-1v/i],
};

export function getProviderDefiniteNoVision(providerId: ProviderId): RegExp[] {
  return PROVIDER_DEFINITE_NO_VISION[providerId] ?? [];
}

export function getProviderLikelyVision(providerId: ProviderId): RegExp[] {
  return PROVIDER_LIKELY_VISION[providerId] ?? [];
}
