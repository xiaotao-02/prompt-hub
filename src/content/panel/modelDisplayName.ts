import { platformModelDisplayName } from '@/lib/modelVision';

/** 网页浮动面板 header / loading 补丁：仅展示模型名，不拼接 provider 前缀。 */
export function panelModelDisplayName(
  provider: string | undefined,
  model: string | undefined,
): string {
  if (!model) return '';
  return provider === 'platform' ? platformModelDisplayName(model) : model;
}
