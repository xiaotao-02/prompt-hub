import { getHistoryItem, getSettings } from '@/lib/storage';
import {
  findTabByUrl,
  pickPanelTargetTab,
  sendToTabReliably,
  waitForTabComplete,
} from '@/background/tabMessaging';
import { openOptionsDeepLink } from '@/lib/messaging/openOptionsDeepLink';
import type { MessageHandler } from './types';

export const handleSurfacesMessage: MessageHandler = (message, _sender, sendResponse) => {
  if (message?.type === 'OPEN_OPTIONS') {
    const raw = (message.payload || {}) as {
      tab?: 'settings' | 'library';
      focusId?: string;
      dock?: 'refine' | 'versions';
    };
    openOptionsDeepLink(raw);
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

  return undefined;
};
