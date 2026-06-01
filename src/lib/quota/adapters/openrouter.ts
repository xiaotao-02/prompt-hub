import { formatUsd } from '../format';
import type { QuotaAdapterContext } from '../types';
import { baseSnapshot, errorSnapshot, fetchJson } from './helpers';

export async function fetchOpenrouterQuota(ctx: QuotaAdapterContext) {
  if (!ctx.apiKey.trim()) {
    return baseSnapshot(ctx, { status: 'no_key', label: '未配置 Key' });
  }

  const res = await fetchJson('https://openrouter.ai/api/v1/key', ctx.apiKey.trim());
  if (!res.ok) {
    if (res.status === 401) return errorSnapshot(ctx, 'Key 无效');
    return errorSnapshot(ctx, `HTTP ${res.status}`);
  }

  const root = res.data as {
    data?: {
      limit?: number | null;
      limit_remaining?: number | null;
      usage?: number;
      usage_daily?: number;
    };
  };
  const d = root.data;
  if (!d) return errorSnapshot(ctx, '响应格式异常');

  const remaining = d.limit_remaining;
  const limit = d.limit;
  const usage = d.usage ?? 0;

  if (remaining != null && Number.isFinite(remaining)) {
    return baseSnapshot(ctx, {
      status: 'ok',
      label: formatUsd(remaining),
      detail: limit != null ? `限额 ${formatUsd(limit)}` : undefined,
      lowBalance: remaining < 1,
    });
  }

  if (limit != null && Number.isFinite(limit)) {
    const left = Math.max(0, limit - usage);
    return baseSnapshot(ctx, {
      status: 'ok',
      label: formatUsd(left),
      detail: `已用 ${formatUsd(usage)}`,
      lowBalance: left < 1,
    });
  }

  return baseSnapshot(ctx, {
    status: 'ok',
    label: '无额度上限',
    detail: d.usage_daily != null ? `今日 ${formatUsd(d.usage_daily)}` : `累计 ${formatUsd(usage)}`,
  });
}
