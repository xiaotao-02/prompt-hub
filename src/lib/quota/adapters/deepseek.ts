import { formatCurrencyAmount } from '../format';
import type { QuotaAdapterContext } from '../types';
import { baseSnapshot, errorSnapshot, fetchJson } from './helpers';

export async function fetchDeepseekQuota(ctx: QuotaAdapterContext) {
  if (!ctx.apiKey.trim()) {
    return baseSnapshot(ctx, { status: 'no_key', label: '未配置 Key' });
  }

  const res = await fetchJson('https://api.deepseek.com/user/balance', ctx.apiKey.trim());
  if (!res.ok) {
    if (res.status === 401) return errorSnapshot(ctx, 'Key 无效');
    return errorSnapshot(ctx, `HTTP ${res.status}`);
  }

  const data = res.data as {
    is_available?: boolean;
    balance_infos?: Array<{
      currency?: string;
      total_balance?: string;
      granted_balance?: string;
      topped_up_balance?: string;
    }>;
  };

  const info = data.balance_infos?.[0];
  const total = info?.total_balance ?? '0';
  const currency = info?.currency;
  const granted = info?.granted_balance;
  const n = parseFloat(total);

  let detail: string | undefined;
  if (granted != null && parseFloat(granted) > 0) {
    detail = `含赠金 ${formatCurrencyAmount(granted, currency)}`;
  }
  if (data.is_available === false) {
    detail = detail ? `${detail} · 余额不足` : '余额不足';
  }

  return baseSnapshot(ctx, {
    status: 'ok',
    label: formatCurrencyAmount(total, currency),
    detail,
    lowBalance: data.is_available === false || (Number.isFinite(n) && n < 1),
  });
}
