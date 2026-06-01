import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { HistoryItem } from '@/lib/types';
import { sendOpenInPanel } from '@/lib/messaging/openSurfaces';
import { getHistoryItem } from '@/lib/storage';
import { createPanelRoot, createPanelShadowHost } from '@/content/panel/panelShadowHost';
import type { PanelState } from '@/content/panel/state';
import {
  currentState,
  panelActions,
  setCurrentState,
  setPanel,
  setPanelGeometry,
  type PanelGeometry,
} from '@/content/panel/state';
import { bindEvents, cancelPendingDirtyChromeDeferred } from '@/content/panel/panelShell';
import {
  stopLoadingTicker,
  stopLoadingStallWatchdog,
  stopRefineTicker,
} from '@/content/panel/loading';
import { patchRefineProgress } from '@/content/panel/index';
import {
  applyGeometryToPanel,
  ratioCenteredGeometry,
  resetStableSurfaceHeight,
  scheduleReclampOnViewportChange,
  scheduleStabilizePanelHeight,
} from '@/content/panel/geometry';
import { connectRefineProgressPort } from '@/options/refineProgressPortClient';
import type { RefineProgressPortPayload } from '@/lib/refineProgressPort';
import type { LibraryDockIntent } from './types';
import {
  historyItemToLibraryPanelState,
  hydrateLibraryPanelOneClickRefineRandomness,
} from './libraryPanelState';
import {
  ensureLibraryPanelReactRoot,
  renderLibraryPanelReact,
  setLibraryPanelRenderProps,
  unmountLibraryPanelReact,
} from './libraryPanelReactRoot';
import {
  libraryPanelPromptInSync,
  shouldScheduleLibraryPanelStabilize,
  shouldSuppressLibraryPanelRevRefresh,
} from '@/content/panel/libraryPanelRevGuard';

/** 与 content panel 入场动画时长对齐（shell.ts panelIn .22s + 缓冲）。 */
const PANEL_IN_MS = 260;
/** 与 shell.ts panelOut .18s + 缓冲。 */
const PANEL_OUT_MS = 220;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function markPanelMounted(panel: HTMLElement): void {
  const mark = () => panel.classList.add('mounted');
  panel.addEventListener(
    'animationend',
    (event) => {
      if (event.animationName === 'panelIn') mark();
    },
    { once: true },
  );
  window.setTimeout(mark, PANEL_IN_MS);
}

function ensureLibraryPanelGeometry(): PanelGeometry {
  const clamped = ratioCenteredGeometry();
  setPanelGeometry(clamped);
  return clamped;
}

function finishLibraryPanelShell(root: HTMLElement): void {
  applyGeometryToPanel(root, ensureLibraryPanelGeometry());
  bindEvents(root);
  scheduleStabilizePanelHeight();
}

function bindLibraryPanelViewportListeners(): void {
  window.addEventListener('resize', scheduleReclampOnViewportChange);
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', scheduleReclampOnViewportChange);
    vv.addEventListener('scroll', scheduleReclampOnViewportChange);
  }
}

function unbindLibraryPanelViewportListeners(): void {
  window.removeEventListener('resize', scheduleReclampOnViewportChange);
  const vv = window.visualViewport;
  if (vv) {
    vv.removeEventListener('resize', scheduleReclampOnViewportChange);
    vv.removeEventListener('scroll', scheduleReclampOnViewportChange);
  }
}

function applyRefineProgressPayload(payload: RefineProgressPortPayload): void {
  patchRefineProgress({
    historyId: payload.historyId,
    refineJobId: payload.refineJobId,
    stage: payload.stage,
    partial: payload.partial,
    streamMode: payload.streamMode,
  });
}

export type LibraryFloatingPanelProps = {
  item: HistoryItem;
  dock?: LibraryDockIntent;
  onClose: () => void;
  onItemUpdated?: () => void;
  showTip?: (ok: boolean, msg: string) => void;
};

type LibraryPanelHostProps = LibraryFloatingPanelProps & {
  registerPanelEl: (el: HTMLElement | null) => void;
};

function LibraryPanelHost({
  item,
  dock,
  onClose,
  showTip,
  registerPanelEl,
}: LibraryPanelHostProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const libraryStabilizePrevRef = useRef<PanelState | null>(null);
  const jumpBusyRef = useRef(false);
  const [jumpBusy, setJumpBusy] = useState(false);
  const itemRef = useRef(item);
  itemRef.current = item;
  jumpBusyRef.current = jumpBusy;

  const handleJumpToOriginal = useCallback(() => {
    const current = itemRef.current;
    const dockNow: LibraryDockIntent = currentState?.refineOpen
      ? 'refine'
      : currentState?.versionsOpen
        ? 'versions'
        : null;
    setJumpBusy(true);
    sendOpenInPanel(current.id, {
      dock: dockNow ?? undefined,
      onResponse: (resp, lastErr) => {
        setJumpBusy(false);
        if (lastErr || !resp) {
          showTip?.(false, lastErr || '后台未响应');
          return;
        }
        if (!resp.ok) {
          showTip?.(false, resp.error || '跳转失败');
          return;
        }
        onClose();
        showTip?.(true, '已跳转到原图页面');
      },
    });
  }, [onClose, showTip]);

  useEffect(() => {
    setLibraryPanelRenderProps({
      pageUrl: item.pageUrl,
      onJumpToOriginal: handleJumpToOriginal,
      jumpBusy,
      onClose,
    });
    if (currentState && currentState.sessionRequestId === item.id) {
      renderLibraryPanelReact(currentState);
    }
  }, [item.pageUrl, item.id, handleJumpToOriginal, jumpBusy, onClose]);

  useLayoutEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    mount.innerHTML = '';

    void (async () => {
      const base = historyItemToLibraryPanelState(item, dock);
      const panelState = await hydrateLibraryPanelOneClickRefineRandomness(base);
      if (cancelled || !mountRef.current) return;

      const { host: panelHost, shadow } = createPanelShadowHost({
        hostStyleCss:
          'position:fixed;inset:0;z-index:1;pointer-events:none;color-scheme:light dark;',
      });
      const { panelRoot, surface } = createPanelRoot();
      panelRoot.style.pointerEvents = 'auto';
      shadow.appendChild(panelRoot);
      mount.appendChild(panelHost);

      registerPanelEl(panelRoot);
      markPanelMounted(panelRoot);

      setPanel(panelRoot);
      setCurrentState(panelState);

      setLibraryPanelRenderProps({
        pageUrl: item.pageUrl,
        onJumpToOriginal: handleJumpToOriginal,
        jumpBusy: jumpBusyRef.current,
        onClose,
      });
      ensureLibraryPanelReactRoot(surface);
      renderLibraryPanelReact(panelState);
      libraryStabilizePrevRef.current = panelState;
      finishLibraryPanelShell(panelRoot);
      bindLibraryPanelViewportListeners();

      panelActions.renderPanel = (next: PanelState) => {
        setCurrentState(next);
        renderLibraryPanelReact(next);
        if (shouldScheduleLibraryPanelStabilize(libraryStabilizePrevRef.current, next)) {
          scheduleStabilizePanelHeight();
        }
        libraryStabilizePrevRef.current = next;
      };
      panelActions.closePanel = onClose;
    })();

    const onRuntimeMessage = (message: unknown) => {
      if (!message || typeof message !== 'object' || !('type' in message)) return;
      if ((message as { type: string }).type !== 'REFINE_PROGRESS') return;
      const payload = (message as { payload?: RefineProgressPortPayload }).payload;
      if (!payload) return;
      applyRefineProgressPayload(payload);
    };

    chrome.runtime.onMessage.addListener(onRuntimeMessage);
    const disconnectPort = connectRefineProgressPort(applyRefineProgressPayload);

    const refreshItem = () => {
      if (shouldSuppressLibraryPanelRevRefresh()) return;
      void getHistoryItem(itemRef.current.id).then((fresh) => {
        if (!fresh || !currentState || currentState.sessionRequestId !== fresh.id) return;
        if (libraryPanelPromptInSync(currentState, fresh)) return;
        panelActions.renderPanel({
          ...currentState,
          prompt: fresh.prompt,
          draft: currentState.draft ?? fresh.prompt,
          versions: fresh.versions,
        });
      });
    };

    const storageListener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local' && area !== 'sync') return;
      if (!('library_rev' in changes)) return;
      refreshItem();
    };
    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      cancelled = true;
      registerPanelEl(null);
      chrome.runtime.onMessage.removeListener(onRuntimeMessage);
      disconnectPort();
      chrome.storage.onChanged.removeListener(storageListener);
      unbindLibraryPanelViewportListeners();
      cancelPendingDirtyChromeDeferred();
      stopLoadingTicker();
      stopLoadingStallWatchdog();
      stopRefineTicker();
      resetStableSurfaceHeight();
      unmountLibraryPanelReact();
      setPanel(null);
      setPanelGeometry(null);
      setCurrentState(null);
      panelActions.renderPanel = () => {};
      panelActions.closePanel = () => {};
      mount.innerHTML = '';
    };
    // 仅首挂载定位面板，不随 item 内容变化重挂载 React 根
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per item.id
  }, [item.id, dock, onClose, handleJumpToOriginal, registerPanelEl]);

  return <div ref={mountRef} className="fixed inset-0 z-[60] pointer-events-none" />;
}

export function LibraryFloatingPanel(props: LibraryFloatingPanelProps) {
  const { onClose, ...hostProps } = props;
  const [closing, setClosing] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const panelElRef = useRef<HTMLElement | null>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    setBackdropVisible(true);
  }, []);

  const registerPanelEl = useCallback((el: HTMLElement | null) => {
    panelElRef.current = el;
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    if (prefersReducedMotion()) {
      onClose();
      return;
    }

    closingRef.current = true;
    setClosing(true);

    const panel = panelElRef.current;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onClose();
    };

    if (panel) {
      panel.classList.add('library-closing');
      panel.addEventListener(
        'animationend',
        (event) => {
          if (event.animationName === 'panelOut') finish();
        },
        { once: true },
      );
    }

    window.setTimeout(finish, PANEL_OUT_MS);
  }, [onClose]);

  const backdropOpacity = closing || !backdropVisible ? 'opacity-0' : 'opacity-100';

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-[55] bg-black/40 backdrop-blur-[1px] cursor-default transition-opacity duration-200 ease-out ${backdropOpacity}`}
        aria-label="关闭浮动面板"
        onClick={requestClose}
      />
      <LibraryPanelHost {...hostProps} onClose={requestClose} registerPanelEl={registerPanelEl} />
    </>
  );
}
