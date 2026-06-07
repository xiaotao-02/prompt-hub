import { parseRegionCaptureConfirmPayload } from '@/lib/regionCaptureCrop';
import { applyCtxMenuPrep } from '@/background/context-menu';
import {
  handleRegionCaptureConfirm,
  relayRegionCaptureToFocusedWebTab,
} from '@/background/regionCapture';
import type { MessageHandler } from './types';

export const handleCaptureMessage: MessageHandler = (message, sender, sendResponse) => {
  if (message?.type === 'REQUEST_REGION_CAPTURE') {
    void relayRegionCaptureToFocusedWebTab().then(sendResponse);
    return true;
  }

  if (message?.type === 'REGION_CAPTURE_CONFIRM') {
    const p = parseRegionCaptureConfirmPayload((message as { payload?: unknown }).payload);
    const tabId = sender.tab?.id;
    if (tabId == null || !p) {
      sendResponse({ ok: false, error: 'invalid' });
      return false;
    }
    void handleRegionCaptureConfirm(tabId, p).catch((err) =>
      console.warn('[PromptHub] handleRegionCaptureConfirm', err),
    );
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'CTX_MENU_PREP') {
    const tabId = sender.tab?.id;
    const raw = message.payload as
      | {
          extractionUrl?: unknown;
          showFallback?: unknown;
          videoIndex?: unknown;
        }
      | undefined;
    if (tabId != null) {
      const extractionUrl = typeof raw?.extractionUrl === 'string' ? raw.extractionUrl : '';
      const showFallback = raw?.showFallback === true;
      const videoIndex =
        typeof raw?.videoIndex === 'number' &&
        Number.isInteger(raw.videoIndex) &&
        raw.videoIndex >= 0
          ? raw.videoIndex
          : undefined;
      applyCtxMenuPrep(tabId, { extractionUrl, showFallback, videoIndex });
    }
    sendResponse({ ok: true });
    return true;
  }

  return undefined;
};
