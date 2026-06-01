import { formatCny } from '../format';
import type { QuotaAdapterContext } from '../types';
import { baseSnapshot, errorSnapshot, fetchJson, resolveOrigin } from './helpers';

export async function fetchSiliconflowQuota(ctx: QuotaAdapterContext) {
  if (!ctx.apiKey.trim()) {
    return baseSnapshot(ctx, { status: 'no_key', label: '未配置 Key' });
  }

  const origin = resolveOrigin(ctx.baseUrl, 'https://api.siliconflow.cn');
  const res = await fetchJson(`${origin}/v1/user/info`, ctx.apiKey.trim());
  if (!res.ok) {
    if (res.status === 401) return errorSnapshot(ctx, 'Key 无效');
    return errorSnapshot(ctx, `HTTP ${res.status}`);
  }

  const root = res.data as {
    data?: { totalBalance?: string; balance?: string; chargeBalance?: string };
  };
  const d = root.data;
  const total = d?.totalBalance ?? d?.balance ?? '0';
  const n = parseFloat(total);
  const charge = d?.chargeBalance;

  return baseSnapshot(ctx, {
    status: 'ok',
    label: formatCny(total),
    detail: charge != null ? `充值 ${formatCny(charge)}` : undefined,
    lowBalance: Number.isFinite(n) && n < 1,
  });
}
