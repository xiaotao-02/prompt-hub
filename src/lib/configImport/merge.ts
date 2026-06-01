import { PROVIDERS } from '../providers';
import type { AppSettings, ProviderConfig, ProviderId } from '../types';

export function mergeOneProvider(
  base: AppSettings,
  pid: ProviderId,
  patch: { apiKey?: string; baseUrl?: string; model?: string },
): AppSettings {
  const prev = base.providers[pid];
  const meta = PROVIDERS[pid];
  const merged: ProviderConfig = {
    ...prev,
    id: pid,
    apiKey: patch.apiKey ?? prev.apiKey,
    baseUrl: patch.baseUrl?.trim() || prev.baseUrl || meta.defaultBaseUrl,
    model:
      patch.model?.trim() || (prev.model && prev.model.trim() ? prev.model : meta.defaultModel),
  };
  return {
    ...base,
    activeProvider: pid,
    providers: { ...base.providers, [pid]: merged },
  };
}
