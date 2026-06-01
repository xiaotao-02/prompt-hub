import type { ProviderId } from '../types';
import { PROVIDERS } from '../providers';
import type { QuotaAdapter } from './types';
import { fetchDeepseekQuota } from './adapters/deepseek';
import { unsupportedSnapshot } from './adapters/helpers';
import { fetchMoonshotQuota } from './adapters/moonshot';
import { fetchOpenaiQuota } from './adapters/openai';
import { fetchCustomQuota } from './adapters/custom';
import { fetchNewapiTokenQuota } from './adapters/newapiToken';
import { fetchOpenrouterQuota } from './adapters/openrouter';
import { fetchSiliconflowQuota } from './adapters/siliconflow';

const ADAPTERS: Partial<Record<ProviderId, QuotaAdapter>> = {
  siliconflow: fetchSiliconflowQuota,
  deepseek: fetchDeepseekQuota,
  moonshot: fetchMoonshotQuota,
  openrouter: fetchOpenrouterQuota,
  openai: fetchOpenaiQuota,
  shukelongda: fetchNewapiTokenQuota,
  custom: fetchCustomQuota,
};

export function getQuotaAdapter(providerId: ProviderId): QuotaAdapter {
  const adapter = ADAPTERS[providerId];
  if (adapter) return adapter;
  return (ctx) => Promise.resolve(unsupportedSnapshot(ctx));
}

export function isQuotaSupported(providerId: ProviderId): boolean {
  return providerId in ADAPTERS;
}

export function quotaDocsUrl(providerId: ProviderId): string {
  return PROVIDERS[providerId]?.docsUrl ?? '';
}

export const QUOTA_SUPPORTED_PROVIDER_IDS = Object.keys(ADAPTERS) as ProviderId[];
