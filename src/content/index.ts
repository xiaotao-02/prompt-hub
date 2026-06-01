import type { OneClickRefineRandomness, RuntimeMessage, StrategyId } from '@/lib/types';
import { postCtxMenuPrepViaKeepalivePort } from '@/content/bgPort';
import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';
import { SETTINGS_KEY } from '@/lib/storage/keys';
import {
  renderPanel,
  renderPanelForExtractPending,
  applyExtractStreamProgress,
  applyExtractStreamResult,
  applyExtractStreamError,
  patchRefineProgress,
  closePanel,
  applyHistoryReady,
  applyHistoryPrefetch,
  applyStoredPromptStrategy,
  applyStoredOneClickRefineRandomness,
  applyStoredPanelAutofocus,
  appendReferenceFromBackground,
  openVideoReferenceFromBackground,
} from './panel';
import { expandPanelForSidebar } from './panel/geometry';
import {
  startRegionCaptureFromExtension,
  abortRegionCaptureIfActive,
} from '@/content/regionCapture';
import { isExtensionContextValid, safeSendMessage } from '@/content/extensionBridge';
import { computeCtxMenuPrep } from '@/content/mediaHit';

export { safeSendMessage } from '@/content/extensionBridge';

try {
  chrome.storage.sync.get(SETTINGS_KEY, (r) => {
    try {
      const raw = r[SETTINGS_KEY] as { panelAutofocus?: boolean } | undefined;
      if (raw && typeof raw === 'object' && 'panelAutofocus' in raw) {
        applyStoredPanelAutofocus(raw.panelAutofocus);
      }
    } catch {
      /* ignore */
    }
  });

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type === 'START_REGION_CAPTURE') {
      if (window.top !== window) {
        sendResponse({ ok: false, skipped: true });
        return false;
      }
      startRegionCaptureFromExtension();
      sendResponse({ ok: true });
      return false;
    }
    if (message.type === 'PING') {
      sendResponse({ ok: true });
      return true;
    }
    if (message.type === 'EXTRACT_PENDING') {
      renderPanelForExtractPending({
        sessionRequestId: message.payload.requestId,
        imageUrl: message.payload.imageUrl,
        imageUrls: message.payload.imageUrls,
        strategy: message.payload.strategy,
        oneClickRefineRandomness: message.payload.oneClickRewriteRandomness,
      });
      return false;
    }
    if (message.type === 'EXTRACT_PROGRESS') {
      applyExtractStreamProgress(message.payload.requestId, {
        stage: message.payload.stage,
        partial: message.payload.partial,
        streamMode: message.payload.streamMode,
        strategy: message.payload.strategy,
        provider: message.payload.provider,
        model: message.payload.model,
        oneClickRefineRandomness: message.payload.oneClickRewriteRandomness,
      });
      return false;
    }
    if (message.type === 'EXTRACT_RESULT') {
      applyExtractStreamResult(message.payload.requestId, {
        prompt: message.payload.prompt,
        provider: message.payload.provider,
        model: message.payload.model,
      });
      return false;
    }
    if (message.type === 'EXTRACT_ERROR') {
      applyExtractStreamError(message.payload.requestId, message.payload.error);
      return false;
    }
    if (message.type === 'HISTORY_READY') {
      // ?????? requestId ?? storage ????? actualId?????????????
      // ???? versions ? prompt?????? "save / restore ????" ???? bug?
      applyHistoryReady(
        message.payload.requestId,
        message.payload.actualId,
        message.payload.versions,
        message.payload.prompt,
      );
      return false;
    }
    if (message.type === 'HISTORY_PREFETCH') {
      const p = message.payload;
      applyHistoryPrefetch(p.requestId, {
        storageId: p.storageId,
        versions: p.versions,
        prompt: p.prompt,
      });
      return false;
    }
    if (message.type === 'PANEL_APPEND_REFERENCE') {
      appendReferenceFromBackground(message.payload.imageUrl);
      return false;
    }
    if (message.type === 'PANEL_OPEN_VIDEO_REFERENCE') {
      openVideoReferenceFromBackground(message.payload.videoIndex);
      return false;
    }
    if (message.type === 'PANEL_FROM_HISTORY') {
      // ? popup / ?????????????????? background ??????
      // content script ???? indexedDB ???????????? chrome-extension://?
      // ???? getHistoryItem ?????????????????????
      const { historyId, item, dock } = message.payload;
      try {
        if (!item || item.id !== historyId) {
          console.warn('[PromptHub] PANEL_FROM_HISTORY: invalid payload', historyId);
          return false;
        }
        const versionsOpen = dock === 'versions';
        const refineOpen = dock === 'refine';
        const imageUrls = item.imageUrls?.length
          ? item.imageUrls
          : [item.thumbnail || item.imageUrl || ''];
        const primary = imageUrls[0] || item.imageUrl;
        renderPanel({
          sessionRequestId: item.id,
          imageUrl: primary,
          imageUrls,
          status: 'success',
          prompt: item.prompt,
          draft: item.prompt,
          provider: item.provider,
          model: item.model,
          versions: item.versions,
          strategy: item.strategy,
          oneClickRefineRandomness: normalizeOneClickRefineRandomness(
            message.payload.oneClickRewriteRandomness,
          ),
          versionsOpen,
          ...(refineOpen ? { refineOpen: true } : {}),
        });
        if (versionsOpen) {
          requestAnimationFrame(() => expandPanelForSidebar());
        }
      } catch (err) {
        console.warn('[PromptHub] PANEL_FROM_HISTORY failed', err);
      }
      return false;
    }
    if (message.type === 'REFINE_PROGRESS') {
      patchRefineProgress({
        historyId: message.payload.historyId,
        refineJobId: message.payload.refineJobId,
        stage: message.payload.stage,
        partial: message.payload.partial,
        streamMode: message.payload.streamMode,
      });
      return false;
    }
    return false;
  });
  chrome.storage.onChanged.addListener((changes, _area) => {
    const ch = changes[SETTINGS_KEY];
    if (!ch?.newValue || typeof ch.newValue !== 'object') return;
    const nv = ch.newValue as {
      promptStrategy?: StrategyId;
      oneClickRewriteRandomness?: OneClickRefineRandomness;
      panelAutofocus?: boolean;
    };
    const ps = nv.promptStrategy;
    const rr = nv.oneClickRewriteRandomness;
    if (ps != null) applyStoredPromptStrategy(ps);
    if (rr != null) applyStoredOneClickRefineRandomness(normalizeOneClickRefineRandomness(rr));
    if ('panelAutofocus' in nv) applyStoredPanelAutofocus(nv.panelAutofocus);
  });
} catch {
  // Extension context already invalidated at registration time
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (abortRegionCaptureIfActive()) return;
    closePanel();
  }
});

// ===================================================================
//  contextmenu ?????? <video> / <canvas> / ?? <svg> / CSS ???
//  ??"? <video> ??? GIF"??????Twitter / Reddit / Discord
//  ? .gif ?? mp4 ????????
//
//  Chrome ??? <img>?image?? <video>?video?????????????
//  ??? / pointer-events / ????????? fallback????????????
//    1. ???????????"???????"
//    2. ????? ? ????? canvas ? toDataURL?????
//    3. ??? canvas/svg/??? ? ???? data URL
//    4. ???? CTX_MENU_PREP ? extractionUrl + showFallback ?????
//       tab ?????????? showFallback:false????? `<video>`
//       ?????????? JPEG??showFallback ????????
//
//  ?????? capture phase??????? stopPropagation?
//  ???? prep ???????????? await ?????? Chrome
//  ?? contextmenu ??????????????????????
//  contextMenus.update ??????
// ===================================================================

window.addEventListener(
  'contextmenu',
  (ev: MouseEvent) => {
    try {
      if (!isExtensionContextValid()) return;
      const payload = computeCtxMenuPrep(ev);
      postCtxMenuPrepViaKeepalivePort(payload);
      safeSendMessage(
        {
          type: 'CTX_MENU_PREP',
          payload,
        } satisfies RuntimeMessage,
        () => void chrome.runtime.lastError,
      );
    } catch (err) {
      console.debug('[PromptHub] ctxmenu prep failed', err);
    }
  },
  true,
);
