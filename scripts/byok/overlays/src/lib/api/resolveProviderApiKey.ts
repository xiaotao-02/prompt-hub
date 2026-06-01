import type { ProviderConfig, ProviderId } from '../types';

/** BYOK：仅从 settings 槽位读取 API Key */
export async function resolveProviderApiKey(
  providerId: ProviderId,
  cfg: ProviderConfig,
): Promise<string> {
  if (!cfg.apiKey.trim()) {
    throw new Error(`请先在「设置」中为 ${providerId} 配置 API Key`);
  }
  return cfg.apiKey.trim();
}
