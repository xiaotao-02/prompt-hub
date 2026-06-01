/** 平台点数：保留 1 位小数 */
export function formatPoints(value: number): string {
  const n = Math.round(value * 10) / 10;
  return `${n.toFixed(1)} 点`;
}

export function formatCny(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '¥—';
  return `¥${n.toFixed(2)}`;
}

export function formatUsd(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '$—';
  return `$${n.toFixed(2)}`;
}

export function currencySymbol(currency?: string): string {
  const c = (currency ?? '').toUpperCase();
  if (c === 'CNY' || c === 'RMB') return '¥';
  if (c === 'USD') return '$';
  return c ? `${c} ` : '';
}

export function formatCurrencyAmount(value: string | number, currency?: string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return `${currencySymbol(currency)}—`;
  const sym = currencySymbol(currency);
  return `${sym}${n.toFixed(2)}`;
}
