import { classifyModel, getRecommendedVisionModel, shouldBlockExtract } from '../modelVision';
import type { ModelVisionSupport } from '../modelVision';
import type { ProviderId } from '../types';

export type ExtractModelValidation =
  | { ok: true }
  | { ok: false; message: string; recommendedModel?: string };

const MINIMAX_RECOMMENDED_VISION_MODEL = 'MiniMax-VL-01';

const MINIMAX_M2_REFERENCE_IMAGE_MESSAGE = `MiniMax-M2* / MiniMax-M2*-highspeed 不适合本扩展的参考图（image_url）反推：厂商侧常不按多模态处理，易反复出现「未见图」。请在「设置」中将模型改为多模态型号，例如 ${MINIMAX_RECOMMENDED_VISION_MODEL}（以控制台所列 id 为准）。完整说明见 docs/troubleshooting-minimax.zh.md。`;

export function isMiniMaxTextOnlyImageModel(model: string): boolean {
  return /^MiniMax-M2/i.test(model.trim());
}

export function validateExtractModel(
  providerId: ProviderId,
  model: string,
  hasImages: boolean,
  visionById?: Record<string, ModelVisionSupport>,
): ExtractModelValidation {
  if (!hasImages || !model.trim()) {
    return { ok: true };
  }

  const trimmed = model.trim();
  if (visionById?.[trimmed] === 'vision') {
    return { ok: true };
  }

  if (providerId === 'minimax' && isMiniMaxTextOnlyImageModel(model)) {
    return {
      ok: false,
      message: MINIMAX_M2_REFERENCE_IMAGE_MESSAGE,
      recommendedModel: MINIMAX_RECOMMENDED_VISION_MODEL,
    };
  }

  const classified = classifyModel(providerId, model);
  if (!shouldBlockExtract(classified)) {
    return { ok: true };
  }

  const recommended = getRecommendedVisionModel(providerId);
  const providerLabel =
    providerId === 'deepseek'
      ? 'DeepSeek 官方端点不支持识图，请改用 SiliconFlow 等渠道的 VL 模型'
      : `当前模型「${trimmed}」不适合参考图（image_url）反推。请改用识图模型，例如 ${recommended}（以端点列表标注为准）。`;

  return {
    ok: false,
    message: providerLabel,
    recommendedModel: recommended,
  };
}
