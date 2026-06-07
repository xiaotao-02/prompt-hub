import '@/styles/globals.css';
import { useEffect, useLayoutEffect, useRef, useState, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { installChromePreviewShim } from './chromeShim';
import { ensurePreviewLibrarySeed, PREVIEW_DEMO_PANEL_DEFAULT_ID } from './seedPreviewLibrary';
import { historyItemToPanelPreviewState } from './historyToPanelPreviewState';
import { syntheticPanelStateFromScene } from './panelPreviewScenes';
import { getDevPreviewScene } from './previewScene';
import type { HistoryItem } from '@/lib/types';
import { getHistoryItem } from '@/lib/storage';
import { STYLE } from '@/content/panel/styles';
import type { PanelState } from '@/content/panel/state';
import {
  setCurrentState,
  setPanel,
  panelActions,
  panel,
  panelReferenceUrls,
  setComposeCollectMode,
  getComposeCollectMode,
  setComposeSelectedVideoIndex,
  applyDefaultComposeVideoSegment,
  setPanelGeometry,
} from '@/content/panel/state';
import { listViewportVideos } from '@/content/videoSegmentSample';
import {
  applyGeometryToPanel,
  ensureGeometry,
  maybeAdjustGeometryForPanelStatus,
  ratioCenteredGeometry,
} from '@/content/panel/geometry';
import { bindEvents, cancelPendingDirtyChromeDeferred } from '@/content/panel/panelShell';
import {
  stopLoadingTicker,
  stopLoadingStallWatchdog,
  stopRefineTicker,
} from '@/content/panel/loading';
import {
  ensurePanelReactRoot,
  renderPanelReact,
  unmountPanelReact,
} from '@/content/panel/panelReactRoot';

installChromePreviewShim();

/** 插在 STYLE 之后，仅开发预览 iframe：解除 `.panel` 的 fixed，便于外层 flex 居中。 */
const PREVIEW_PANEL_LAYOUT_CSS = `
.panel.panel--dev-preview {
  position: relative !important;
  top: auto !important;
  left: auto !important;
}`;

const RESIZE_DIRS = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] as const;

/** 开发预览 compose-video 场景：页面内可识别的演示视频（仅 dev iframe）。 */
const DEV_PREVIEW_COMPOSE_VIDEO_SRC =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm';

function appendComposeVideoDevDemo(parent: HTMLElement): void {
  const demoVideo = document.createElement('video');
  demoVideo.width = 320;
  demoVideo.height = 180;
  demoVideo.muted = true;
  demoVideo.controls = true;
  demoVideo.playsInline = true;
  demoVideo.setAttribute('aria-label', '开发预览演示视频');
  demoVideo.title = '演示视频';
  demoVideo.poster = '/icons/icon-128.png';
  demoVideo.src = DEV_PREVIEW_COMPOSE_VIDEO_SRC;
  demoVideo.className =
    'rounded-xl border border-zinc-300/80 shadow-sm dark:border-zinc-700 object-contain bg-black';
  parent.appendChild(demoVideo);
}

function initComposeVideoPreviewMode(state: PanelState): void {
  setComposeCollectMode('video');
  setComposeSelectedVideoIndex(0);
  applyDefaultComposeVideoSegment(0, { force: true });
  previewRenderPanel(state);
}

function appendResizeHandles(p: HTMLElement): void {
  for (const d of RESIZE_DIRS) {
    const h = document.createElement('div');
    h.className = `resize-handle ${d}`;
    h.dataset.dir = d;
    p.appendChild(h);
  }
}

let previewLastStatus: PanelState['status'] | null = null;

function applyPreviewPanelGeometry(
  state: PanelState,
  prevStatus: PanelState['status'] | null,
): void {
  const root = panel;
  if (!root) return;
  if (prevStatus === null) {
    setPanelGeometry(ratioCenteredGeometry());
  }
  maybeAdjustGeometryForPanelStatus(state.status, prevStatus, {
    refCount: panelReferenceUrls(state).length,
    videoMode: getComposeCollectMode() === 'video' && listViewportVideos().length > 0,
  });
  applyGeometryToPanel(root, ensureGeometry());
}

function previewRenderPanel(state: PanelState): void {
  const prevStatus = previewLastStatus;
  setCurrentState(state);
  previewLastStatus = state.status;
  const root = panel;
  if (!root) return;
  const surface = root.querySelector<HTMLElement>('[data-role="panel-surface"]');
  if (!surface) return;
  ensurePanelReactRoot(surface);
  renderPanelReact(state, prevStatus);
  applyPreviewPanelGeometry(state, prevStatus);
}

/** 预览不关 DOM，仅停定时器，避免 content `closePanel` 拆掉 iframe 内的面板节点。 */
function previewClosePanel(): void {
  cancelPendingDirtyChromeDeferred();
  stopLoadingTicker();
  stopLoadingStallWatchdog();
  stopRefineTicker();
}

panelActions.renderPanel = previewRenderPanel;
panelActions.closePanel = previewClosePanel;

/** `#focus=` 与 Options deep-link 对齐；`item=` 为别名。 */
function readPanelPreviewPreferredHistoryId(): string {
  const raw = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
  const params = new URLSearchParams(raw);
  const fromHash = params.get('focus')?.trim() || params.get('item')?.trim();
  return fromHash || PREVIEW_DEMO_PANEL_DEFAULT_ID;
}

async function fetchHistoryWithRetry(id: string): Promise<HistoryItem | null> {
  let item = await getHistoryItem(id);
  if (!item) {
    await new Promise((r) => setTimeout(r, 80));
    item = await getHistoryItem(id);
  }
  return item;
}

async function resolvePreviewPanelState(): Promise<PanelState | null> {
  const syn = syntheticPanelStateFromScene(getDevPreviewScene());
  if (syn) return syn;

  await ensurePreviewLibrarySeed();
  const preferredId = readPanelPreviewPreferredHistoryId();
  let item = await fetchHistoryWithRetry(preferredId);
  if (!item && preferredId !== PREVIEW_DEMO_PANEL_DEFAULT_ID) {
    item = await fetchHistoryWithRetry(PREVIEW_DEMO_PANEL_DEFAULT_ID);
  }
  return item ? historyItemToPanelPreviewState(item) : null;
}

/** 生产级 `bindEvents` + shim 路由；不向 `document.documentElement` 挂宿主。 */
function PanelPeek({ panelState }: { panelState: PanelState }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mount = hostRef.current;
    if (!mount) return;

    mount.innerHTML = '';
    mount.style.margin = '0 auto';
    mount.style.padding = '2rem';
    mount.style.boxSizing = 'border-box';

    const isComposeVideoScene = getDevPreviewScene() === 'compose-video';

    const layout = document.createElement('div');
    const layoutFlex = isComposeVideoScene
      ? 'flex flex-row items-start justify-center gap-6'
      : 'flex flex-col items-center gap-6';
    layout.className = `min-h-[min(600px,calc(100vh-96px))] ${layoutFlex} bg-gradient-to-br from-indigo-200/40 via-zinc-100 to-violet-200/35 dark:from-indigo-900/35 dark:via-zinc-900 dark:to-violet-900/35`;
    layout.style.colorScheme = 'light dark';

    if (isComposeVideoScene) {
      appendComposeVideoDevDemo(layout);
    }

    const panelHost = document.createElement('div');
    panelHost.className = isComposeVideoScene
      ? 'flex shrink-0 items-start justify-center'
      : 'flex w-full items-start justify-center';

    const shadow = panelHost.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = STYLE + PREVIEW_PANEL_LAYOUT_CSS;
    shadow.appendChild(styleEl);

    const panelRoot = document.createElement('div');
    panelRoot.className = 'panel mounted panel--dev-preview';
    panelRoot.style.margin = '48px auto 0';

    const surface = document.createElement('div');
    surface.dataset.role = 'panel-surface';
    panelRoot.appendChild(surface);
    appendResizeHandles(panelRoot);

    shadow.appendChild(panelRoot);
    layout.appendChild(panelHost);
    mount.appendChild(layout);

    setPanel(panelRoot);
    previewLastStatus = null;
    if (isComposeVideoScene) {
      initComposeVideoPreviewMode(panelState);
    } else {
      previewRenderPanel(panelState);
    }
    bindEvents(panelRoot);

    return () => {
      previewLastStatus = null;
      cancelPendingDirtyChromeDeferred();
      stopLoadingTicker();
      stopLoadingStallWatchdog();
      stopRefineTicker();
      unmountPanelReact();
      setPanel(null);
      setCurrentState(null);
      mount.innerHTML = '';
    };
  }, [panelState]);

  return <div ref={hostRef} className="min-h-screen w-full" />;
}

function PanelPreviewApp(): React.JSX.Element {
  const [panelState, setPanelState] = useState<PanelState | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    void resolvePreviewPanelState().then((s) => {
      if (s) setPanelState(s);
      else setLoadError(true);
    });
  }, []);

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
        预览数据未就绪：IndexedDB 中找不到 `{PREVIEW_DEMO_PANEL_DEFAULT_ID}`（或 hash
        指定的记录）。请清空库后刷新，或先打开 Popup 预览触发种子写入。
      </div>
    );
  }

  if (!panelState) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-sm text-zinc-500 dark:text-zinc-500">
        加载预览…
      </div>
    );
  }

  return <PanelPeek panelState={panelState} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PanelPreviewApp />
  </StrictMode>,
);
