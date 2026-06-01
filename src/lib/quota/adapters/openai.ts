import { formatUsd } from '../format';
import type { QuotaAdapterContext } from '../types';
import { baseSnapshot, errorSnapshot, fetchJson, unsupportedSnapshot } from './helpers';

export async function fetchOpenaiQuota(ctx: QuotaAdapterContext) {
  if (!ctx.apiKey.trim()) {
    return baseSnapshot(ctx, { status: 'no_key', label: '未配置 Key' });
  }

  const res = await fetchJson(
    'https://api.openai.com/v1/dashboard/billing/credit_grants',
    ctx.apiKey.trim(),
  );

  if (!res.ok) {
    if (res.status === 401) return errorSnapshot(ctx, 'Key 无效');
    if (res.status === 403 || res.text.includes('session key')) {
      return unsupportedSnapshot(ctx);
    }
    return errorSnapshot(ctx, `HTTP ${res.status}`);
  }

  const data = res.data as {
    total_available?: number;
    total_granted?: number;
    total_used?: number;
    grants?: { grant_amount?: number; used_amount?: number }[];
  };

  let available = data.total_available;
  if (available == null && Array.isArray(data.grants)) {
    available = data.grants.reduce(
      (sum, g) => sum + ((g.grant_amount ?? 0) - (g.used_amount ?? 0)),
      0,
    );
  }
  if (available == null) {
    return unsupportedSnapshot(ctx);
  }

  // OpenAI billing API returns amounts in cents
  const dollars = available / 100;

  return baseSnapshot(ctx, {
    status: 'ok',
    label: formatUsd(dollars),
    detail: '平台赠金额度（非官方稳定接口）',
    lowBalance: dollars < 1,
  });
}
