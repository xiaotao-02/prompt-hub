import type { QuotaAdapterContext } from '../types';
import { baseSnapshot, unsupportedSnapshot } from './helpers';
import { fetchNewapiTokenQuotaCore } from './newapiToken';

/**
 * 自定义 OpenAI 兼容端点：尝试 NewAPI/OneAPI 余额接口。
 * 端点不支持时返回 unsupported，避免误报为查询失败。
 */
export async function fetchCustomQuota(ctx: QuotaAdapterContext) {
  if (!ctx.apiKey.trim()) {
    return baseSnapshot(ctx, { status: 'no_key', label: '未配置 Key' });
  }
  if (!ctx.baseUrl?.trim()) {
    return unsupportedSnapshot(ctx);
  }

  try {
    new URL(ctx.baseUrl.trim());
  } catch {
    return unsupportedSnapshot(ctx);
  }

  return fetchNewapiTokenQuotaCore(ctx, {
    defaultOrigin: ctx.baseUrl.trim(),
    softUnsupported: true,
  });
}
