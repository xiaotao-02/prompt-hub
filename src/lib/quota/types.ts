import type { ProviderId } from '../types';

export type ProviderQuotaStatus = 'ok' | 'unsupported' | 'error' | 'no_key';

export interface ProviderQuotaSnapshot {
  providerId: ProviderId;
  status: ProviderQuotaStatus;
  /** 展示用主文案，如 "12.3 点" / "¥8.66" / "$4.20" */
  label: string;
  /** 可选副文案，如 "含赠金 ¥0" */
  detail?: string;
  /** 是否余额偏低 */
  lowBalance?: boolean;
  fetchedAt: number;
  error?: string;
  docsUrl?: string;
}

export interface QuotaAdapterContext {
  providerId: ProviderId;
  apiKey: string;
  baseUrl?: string;
  docsUrl: string;
}

export type QuotaAdapter = (ctx: QuotaAdapterContext) => Promise<ProviderQuotaSnapshot>;

export type ProviderQuotaCacheMap = Partial<Record<ProviderId, ProviderQuotaSnapshot>>;

/** 缓存 TTL：避免频繁打厂商余额 API */
export const QUOTA_CACHE_TTL_MS = 60_000;
