import {
  appendPromptVersion,
  getHistoryItem,
  getSettings,
  removePromptVersion,
  restorePromptVersion,
  saveSettings,
} from '@/lib/storage';
import { normalizeReferenceList } from '@/lib/referenceImages';
import { parseRegionCaptureConfirmPayload } from '@/lib/regionCaptureCrop';
import { applyStoreExtensionUpdate } from '@/lib/applyExtensionUpdate';
import { refreshRemoteRuntimeConfigNow } from '@/lib/remoteRuntimeConfig';
import { fetchProviderQuota } from '@/lib/quota/fetch';
import type {
  ExtractFocus,
  FetchProviderQuotaResponse,
  RefineResponse,
  StrategyId,
} from '@/lib/types';
import { applyCtxMenuPrep } from './context-menu';
import { parsePayloadVideoSegment, runExtraction } from './extraction';
import { runRefine } from './refine';
import { handleRegionCaptureConfirm, relayRegionCaptureToFocusedWebTab } from './regionCapture';
import {
  findTabByUrl,
  pickPanelTargetTab,
  sendToTabReliably,
  waitForTabComplete,
} from './tabMessaging';
import { runUpdateCheck } from './updater';

export function registerRuntimeMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'OPEN_OPTIONS') {
      const raw = (message.payload || {}) as {
        tab?: 'settings' | 'library';
        focusId?: string;
        dock?: 'refine' | 'versions';
      };
      let { tab } = raw;
      const { focusId, dock } = raw;
      if (focusId && tab == null) {
        tab = 'library';
      }
      if (!tab && !focusId) {
        chrome.runtime.openOptionsPage();
        sendResponse({ ok: true });
        return true;
      }
      const params = new URLSearchParams();
      if (tab) params.set('tab', tab);
      if (focusId) params.set('focus', focusId);
      if (dock === 'refine' || dock === 'versions') params.set('dock', dock);
      const optionsPath = 'src/options/index.html';
      const targetUrl = chrome.runtime.getURL(optionsPath) + '#' + params.toString();
      const existingMatch = chrome.runtime.getURL(optionsPath) + '*';
      chrome.tabs.query({ url: existingMatch }, (tabs) => {
        const found = tabs[0];
        if (found?.id != null) {
          chrome.tabs.update(found.id, { url: targetUrl, active: true });
          if (found.windowId != null) {
            chrome.windows.update(found.windowId, { focused: true });
          }
        } else {
          chrome.tabs.create({ url: targetUrl });
        }
      });
      sendResponse({ ok: true });
      return true;
    }
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
    if (message?.type === 'SET_PROMPT_STRATEGY') {
      const strategy = message.payload?.strategy as StrategyId | undefined;
      if (!strategy) {
        sendResponse({ ok: false, error: '缺少 strategy' });
        return true;
      }
      void (async () => {
        try {
          const s = await getSettings();
          await saveSettings({ ...s, promptStrategy: strategy });
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      })();
      return true;
    }
    if (message?.type === 'SET_ONE_CLICK_REWRITE_RANDOMNESS') {
      const level = message.payload?.level;
      if (level !== 'subtle' && level !== 'moderate' && level !== 'bold') {
        sendResponse({ ok: false, error: '缺少或无效的 level' });
        return true;
      }
      void (async () => {
        try {
          const s = await getSettings();
          await saveSettings({ ...s, oneClickRewriteRandomness: level });
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      })();
      return true;
    }
    if (message?.type === 'GET_HISTORY_ITEM') {
      const id = message.payload?.id;
      if (!id) {
        sendResponse({ ok: false, error: '缺少 id' });
        return true;
      }
      void getHistoryItem(id).then((item) => sendResponse({ ok: true, item }));
      return true;
    }
    if (message?.type === 'APPEND_PROMPT_VERSION') {
      const p = message.payload;
      if (!p?.id || typeof p.prompt !== 'string') {
        sendResponse({ ok: false, error: '参数缺失' });
        return true;
      }
      void appendPromptVersion(p.id, p.prompt, p.source ?? 'edited', p.note, p.meta).then((item) =>
        sendResponse({ ok: true, item }),
      );
      return true;
    }
    if (message?.type === 'RESTORE_PROMPT_VERSION') {
      const p = message.payload;
      if (!p?.id || !p.versionId) {
        sendResponse({ ok: false, error: '参数缺失' });
        return true;
      }
      void restorePromptVersion(p.id, p.versionId).then((item) => sendResponse({ ok: true, item }));
      return true;
    }
    if (message?.type === 'REMOVE_PROMPT_VERSION') {
      const p = message.payload;
      if (!p?.id || !p.versionId) {
        sendResponse({ ok: false, error: '参数缺失' });
        return true;
      }
      void removePromptVersion(p.id, p.versionId).then((item) => sendResponse({ ok: true, item }));
      return true;
    }
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
    if (message?.type === 'REFINE_PROMPT') {
      const { historyId, instruction, current, refineJobId } = message.payload || {};
      if (!historyId || !instruction || typeof current !== 'string') {
        sendResponse({ ok: false, error: '参数缺失' } satisfies RefineResponse);
        return true;
      }
      runRefine(historyId, current, instruction, sender.tab?.id, refineJobId)
        .then((res) => sendResponse(res))
        .catch((e) => {
          sendResponse({
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          } satisfies RefineResponse);
        });
      return true;
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
    if (message?.type === 'OPEN_IN_PANEL') {
      const { historyId, dock } = (message.payload || {}) as {
        historyId?: string;
        dock?: 'refine' | 'versions';
      };
      if (!historyId) {
        sendResponse({ ok: false, error: '缺少 historyId' });
        return true;
      }
      void (async () => {
        try {
          const item = await getHistoryItem(historyId);
          if (!item) {
            sendResponse({ ok: false, error: '未找到该条历史记录' });
            return;
          }

          const appSettings = await getSettings();

          const pageUrl = item.pageUrl;
          const isHttpPage = /^https?:/i.test(pageUrl);

          let targetId: number | undefined;
          let targetWindowId: number | undefined;

          if (isHttpPage) {
            const existing = await findTabByUrl(pageUrl);
            if (existing?.id) {
              targetId = existing.id;
              targetWindowId = existing.windowId ?? undefined;
              try {
                await chrome.tabs.update(targetId, { active: true });
                if (existing.windowId != null) {
                  await chrome.windows.update(existing.windowId, { focused: true });
                }
              } catch {
                /* ignore */
              }
              try {
                const live = await chrome.tabs.get(targetId);
                if (live.status !== 'complete') {
                  await waitForTabComplete(targetId);
                }
              } catch {
                /* ignore */
              }
            } else {
              const tab = await chrome.tabs.create({ url: pageUrl, active: true });
              if (!tab.id) {
                sendResponse({ ok: false, error: '打开来源页失败' });
                return;
              }
              targetId = tab.id;
              targetWindowId = tab.windowId;
              if (tab.windowId != null) {
                try {
                  await chrome.windows.update(tab.windowId, { focused: true });
                } catch {
                  /* ignore */
                }
              }
              await waitForTabComplete(targetId);
            }
          } else {
            const target = await pickPanelTargetTab();
            if (!target?.id) {
              sendResponse({
                ok: false,
                error: '未找到可注入悬浮窗的网页标签页，请先打开任意普通网页（http/https/file）',
              });
              return;
            }
            targetId = target.id;
            targetWindowId = target.windowId ?? undefined;
            try {
              await chrome.tabs.update(targetId, { active: true });
              if (target.windowId != null) {
                await chrome.windows.update(target.windowId, { focused: true });
              }
            } catch {
              /* ignore */
            }
          }

          const delivered = await sendToTabReliably(targetId, {
            type: 'PANEL_FROM_HISTORY',
            payload: {
              historyId,
              item,
              oneClickRewriteRandomness: appSettings.oneClickRewriteRandomness,
              ...(dock === 'refine' || dock === 'versions' ? { dock } : {}),
            },
          });
          if (!delivered) {
            sendResponse({
              ok: false,
              error: '无法在目标网页显示悬浮窗，请刷新该页面后重试',
            });
            return;
          }
          sendResponse({ ok: true, tabId: targetId, windowId: targetWindowId });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        }
      })();
      return true;
    }
    if (message?.type === 'EXTRACT_PROMPT') {
      const payload = message.payload || {};
      const tabId = sender.tab?.id;
      const imageUrls = normalizeReferenceList(
        payload.imageUrls?.length ? payload.imageUrls : payload.imageUrl ? [payload.imageUrl] : [],
      );
      if (!tabId || imageUrls.length === 0) {
        sendResponse({ ok: false, error: 'invalid params' });
        return true;
      }
      const { pageUrl, pageTitle, requestId, strategyOverride, extractFocus: rawFocus } = payload;
      const extractFocus: ExtractFocus | undefined =
        rawFocus === 'material' || rawFocus === 'style' ? rawFocus : undefined;
      const videoSegment = parsePayloadVideoSegment(
        (payload as { videoSegment?: unknown }).videoSegment,
      );
      runExtraction({
        tabId,
        imageUrls,
        pageUrl: pageUrl || sender.tab?.url || '',
        pageTitle: pageTitle || sender.tab?.title || '',
        requestId,
        strategyOverride,
        extractFocus,
        videoSegment,
      });
      sendResponse({ ok: true });
      return true;
    }
    return false;
  });
}
