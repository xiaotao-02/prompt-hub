import { applyStoreExtensionUpdate } from '@/lib/applyExtensionUpdate';
import { refreshRemoteRuntimeConfigNow } from '@/lib/remoteRuntimeConfig';
import { fetchProviderQuota } from '@/lib/quota/fetch';
import type { FetchProviderQuotaResponse } from '@/lib/types';
import { runUpdateCheck } from '@/background/updater';
import type { MessageHandler } from './types';

export const handleUpdateMessage: MessageHandler = (message, _sender, sendResponse) => {
  if (message?.type === 'FETCH_PROVIDER_QUOTA') {
    const payload = (message.payload ?? {}) as {
      providerId?: import('@/lib/types').ProviderId;
      force?: boolean;
    };
    void fetchProviderQuota({ providerId: payload.providerId, force: payload.force })
      .then((snapshot) => {
        sendResponse({ ok: true, snapshot } satisfies FetchProviderQuotaResponse);
      })
      .catch((e) => {
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        } satisfies FetchProviderQuotaResponse);
      });
    return true;
  }

  if (message?.type === 'CHECK_UPDATE') {
    runUpdateCheck()
      .then((result) => {
        sendResponse({ ok: true, result });
      })
      .catch((e) => {
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        });
      });
    return true;
  }

  if (message?.type === 'APPLY_EXTENSION_UPDATE') {
    void refreshRemoteRuntimeConfigNow().catch(() => undefined);
    applyStoreExtensionUpdate()
      .then((result) => {
        sendResponse({ ok: true as const, result });
        if (result.applied && result.willReload) {
          setTimeout(() => {
            chrome.runtime.reload();
          }, 50);
        }
      })
      .catch((e) => {
        sendResponse({
          ok: false as const,
          error: e instanceof Error ? e.message : String(e),
        });
      });
    return true;
  }

  return undefined;
};
