import { formatCurrencyAmount } from '../format';
import type { QuotaAdapterContext } from '../types';
import { baseSnapshot, errorSnapshot, fetchJson, resolveOrigin } from './helpers';

export async function fetchMoonshotQuota(ctx: QuotaAdapterContext) {
  if (!ctx.apiKey.trim()) {
    return baseSnapshot(ctx, { status: 'no_key', label: '未配置 Key' });
  }

  const origin = resolveOrigin(ctx.baseUrl, 'https://api.moonshot.cn');
  const res = await fetchJson(`${origin}/v1/users/me/balance`, ctx.apiKey.trim());
  if (!res.ok) {
    if (res.status === 401) return errorSnapshot(ctx, 'Key 无效');
    return errorSnapshot(ctx, `HTTP ${res.status}`);
  }

  type MoonshotBalancePayload = {
    available_balance?: number | string;
    voucher_balance?: number | string;
    cash_balance?: number | string;
    balance?: number | string;
  };

  const data = res.data as {
    code?: number;
    data?: MoonshotBalancePayload;
    available_balance?: number | string;
    balance?: number | string;
  };

  const payload: MoonshotBalancePayload = data.data ?? data;
  const available =
    payload.available_balance ??
    payload.balance ??
    (typeof payload.cash_balance !== 'undefined'
      ? Number(payload.cash_balance) + Number(payload.voucher_balance ?? 0)
      : undefined);

  const availableStr = available != null ? String(available) : '0';
  const n = parseFloat(availableStr);
  const voucher = payload.voucher_balance;

  return baseSnapshot(ctx, {
    status: 'ok',
    label: formatCurrencyAmount(availableStr, 'CNY'),
    detail:
      voucher != null && parseFloat(String(voucher)) > 0
        ? `代金券 ${formatCurrencyAmount(String(voucher), 'CNY')}`
        : undefined,
    lowBalance: Number.isFinite(n) && n < 1,
  });
}
