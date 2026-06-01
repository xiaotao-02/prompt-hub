import { useEffect } from 'react';
import type { PanelState } from '../state';
import { panel, currentState } from '../state';
import {
  manageLoadingStallWatchdog,
  manageLoadingTicker,
  manageRefineTicker,
  stopLoadingStallWatchdog,
  stopLoadingTicker,
  stopRefineTicker,
} from '../loading';
import { shouldPanelContentAutofocus } from '../focusPolicy';
import {
  bindPanelQuotaStorageSync,
  ensureQuotaBadgeHost,
  refreshPanelQuotaBadge,
} from '../quotaBadge';
import { getVersionsListDensity } from '@/lib/versionsListDensity';
import { getVersionsSidebarWidth } from '@/lib/versionsSidebarWidth';
import { applyVersionsListDensityUi, applyVersionsSidebarWidthUi } from '../versionListUi';
import { updateDirtyChromeImmediate } from '../dirtyChrome';

function panelAnnounceText(state: PanelState): string {
  if (state.status === 'loading') return '正在提取提示词，请稍候';
  if (state.status === 'success') return '提示词提取完成';
  if (state.status === 'error') return `提取失败：${state.error?.trim() || '未知错误'}`;
  return '已打开参考合成';
}

export function usePanelEffects(state: PanelState, prevStatus: PanelState['status'] | null): void {
  useEffect(() => {
    manageLoadingTicker(state);
    manageLoadingStallWatchdog(state);
    manageRefineTicker(state);
    return () => {
      stopLoadingTicker();
      stopLoadingStallWatchdog();
      stopRefineTicker();
    };
  }, [state]);

  useEffect(() => {
    if (state.status === 'success') {
      updateDirtyChromeImmediate();
    }
  }, [state]);

  useEffect(() => {
    if (!panel) return;
    ensureQuotaBadgeHost(panel);
    bindPanelQuotaStorageSync(panel);
    void refreshPanelQuotaBadge(panel, false);
  }, [state.sessionRequestId, state.status]);

  useEffect(() => {
    void Promise.all([getVersionsListDensity(), getVersionsSidebarWidth()]).then(() => {
      if (panel) {
        applyVersionsListDensityUi(panel);
        applyVersionsSidebarWidthUi(panel);
      }
    });
  }, [state.sessionRequestId]);

  useEffect(() => {
    if (prevStatus === state.status) return;
    const el = panel?.querySelector('[data-role="panel-announce"]');
    if (el) el.textContent = panelAnnounceText(state);
  }, [state, prevStatus]);

  useEffect(() => {
    if (!shouldPanelContentAutofocus()) return;
    if (prevStatus === state.status) return;
    if (state.status !== 'success' && state.status !== 'compose' && state.status !== 'error') {
      return;
    }
    const rid = state.sessionRequestId;
    requestAnimationFrame(() => {
      if (!panel || !currentState || currentState.sessionRequestId !== rid) return;
      const ta = panel.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
      if (!ta || ta.disabled) return;
      try {
        ta.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    });
  }, [state, prevStatus]);
}

export function PanelAnnounce({
  state,
  prevStatus,
}: {
  state: PanelState;
  prevStatus: PanelState['status'] | null;
}) {
  const text = prevStatus === state.status ? undefined : panelAnnounceText(state);
  return (
    <div
      data-role="panel-announce"
      aria-live="polite"
      aria-atomic="true"
      className="panel-sr-announce"
    >
      {text ?? ''}
    </div>
  );
}
