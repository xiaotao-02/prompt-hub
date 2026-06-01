import { getSettings } from '../storage/settings';
import type { ProviderId } from '../types';
import { getCachedQuota, writeQuotaCache } from './cache';
import { getQuotaAdapter, quotaDocsUrl } from './registry';
import type { ProviderQuotaSnapshot } from './types';

export interface FetchProviderQuotaOptions {
  providerId?: ProviderId;
  force?: boolean;
}

async function resolveApiKey(providerId: ProviderId): Promise<string> {
  const settings = await getSettings();
  return settings.providers[providerId]?.apiKey?.trim() ?? '';
}

async function resolveBaseUrl(providerId: ProviderId): Promise<string | undefined> {
  const settings = await getSettings();
  return settings.providers[providerId]?.baseUrl;
}

export async function fetchProviderQuota(
  options: FetchProviderQuotaOptions = {},
): Promise<ProviderQuotaSnapshot> {
  const settings = await getSettings();
  const providerId = options.providerId ?? settings.activeProvider;

  if (!options.force) {
    const cached = await getCachedQuota(providerId);
    if (cached) return cached;
  }

  const apiKey = await resolveApiKey(providerId);
  const baseUrl = await resolveBaseUrl(providerId);
  const docsUrl = quotaDocsUrl(providerId);
  const adapter = getQuotaAdapter(providerId);

  let snapshot: ProviderQuotaSnapshot;
  try {
    snapshot = await adapter({
      providerId,
      apiKey,
      baseUrl,
      docsUrl,
    });
  } catch (e) {
    snapshot = {
      providerId,
      status: 'error',
      label: '查询失败',
      error: e instanceof Error ? e.message : String(e),
      fetchedAt: Date.now(),
      docsUrl: docsUrl || undefined,
    };
  }

  await writeQuotaCache(providerId, snapshot);
  return snapshot;
}
