import type { ProviderId } from '../../types';
import type { ProviderQuotaSnapshot, QuotaAdapterContext } from '../types';

export function baseSnapshot(
  ctx: QuotaAdapterContext,
  partial: Omit<ProviderQuotaSnapshot, 'providerId' | 'fetchedAt' | 'docsUrl'>,
): ProviderQuotaSnapshot {
  return {
    providerId: ctx.providerId,
    fetchedAt: Date.now(),
    docsUrl: ctx.docsUrl || undefined,
    ...partial,
  };
}

export function unsupportedSnapshot(ctx: QuotaAdapterContext): ProviderQuotaSnapshot {
  return baseSnapshot(ctx, {
    status: 'unsupported',
    label: '暂不支持插件内查询',
    detail: '请前往控制台查看余额',
  });
}

export function errorSnapshot(ctx: QuotaAdapterContext, error: string): ProviderQuotaSnapshot {
  return baseSnapshot(ctx, {
    status: 'error',
    label: '查询失败',
    error,
  });
}

/** 从用户配置的 baseUrl 提取 origin，失败则回退 defaultOrigin */
export function resolveOrigin(baseUrl: string | undefined, defaultOrigin: string): string {
  const fallback = defaultOrigin.replace(/\/$/, '');
  if (!baseUrl?.trim()) return fallback;
  try {
    const u = new URL(baseUrl.trim());
    return u.origin;
  } catch {
    return fallback;
  }
}

export async function fetchJson(
  url: string,
  apiKey: string,
  init?: RequestInit,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; text: string }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, text };
  }
  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: res.status, text: text || 'invalid json' };
  }
}

export function providerIdOf(ctx: QuotaAdapterContext): ProviderId {
  return ctx.providerId;
}
