import type { FetchProviderQuotaResponse, ProviderId, RuntimeMessage } from '@/lib/types';

export function requestProviderQuota(options?: {
  providerId?: ProviderId;
  force?: boolean;
}): Promise<FetchProviderQuotaResponse> {
  return new Promise((resolve) => {
    const msg: RuntimeMessage = {
      type: 'FETCH_PROVIDER_QUOTA',
      payload: options,
    };
    chrome.runtime.sendMessage(msg, (resp: FetchProviderQuotaResponse | undefined) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message || '后台未响应' });
        return;
      }
      if (resp?.ok === true || resp?.ok === false) {
        resolve(resp);
        return;
      }
      resolve({ ok: false, error: '无效响应' });
    });
  });
}
