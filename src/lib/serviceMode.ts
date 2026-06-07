import { PROVIDER_LIST } from '@/lib/providers';
import type { AppSettings, ProviderId } from '@/lib/types';

export type ServiceMode = 'builtin' | 'custom';

/** BYOK 开源版仅支持自定义 API */
export function serviceModeFromProvider(_id: ProviderId): ServiceMode {
  return 'custom';
}

/** 回落：优先首个已填 Key 的供应商，否则 openai */
export function resolveCustomProviderFallback(settings: AppSettings): ProviderId {
  for (const p of PROVIDER_LIST) {
    const key = settings.providers[p.id]?.apiKey?.trim() ?? '';
    if (key.length >= 6) return p.id;
  }
  return 'openai';
}
