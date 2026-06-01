import { PROVIDER_QUOTA_CACHE_KEY } from '../storage/keys';
import type { ProviderId } from '../types';
import {
  QUOTA_CACHE_TTL_MS,
  type ProviderQuotaCacheMap,
  type ProviderQuotaSnapshot,
} from './types';

export async function readQuotaCache(): Promise<ProviderQuotaCacheMap> {
  try {
    const row = await chrome.storage.local.get(PROVIDER_QUOTA_CACHE_KEY);
    const raw = row[PROVIDER_QUOTA_CACHE_KEY];
    return raw && typeof raw === 'object' ? (raw as ProviderQuotaCacheMap) : {};
  } catch {
    return {};
  }
}

export async function getCachedQuota(
  providerId: ProviderId,
  maxAgeMs = QUOTA_CACHE_TTL_MS,
): Promise<ProviderQuotaSnapshot | null> {
  const map = await readQuotaCache();
  const snap = map[providerId];
  if (!snap) return null;
  if (Date.now() - snap.fetchedAt > maxAgeMs) return null;
  return snap;
}

export async function writeQuotaCache(
  providerId: ProviderId,
  snapshot: ProviderQuotaSnapshot,
): Promise<void> {
  const map = await readQuotaCache();
  map[providerId] = snapshot;
  await chrome.storage.local.set({ [PROVIDER_QUOTA_CACHE_KEY]: map });
}

export async function clearQuotaCache(providerId: ProviderId): Promise<void> {
  const map = await readQuotaCache();
  if (!(providerId in map)) return;
  delete map[providerId];
  await chrome.storage.local.set({ [PROVIDER_QUOTA_CACHE_KEY]: map });
}
