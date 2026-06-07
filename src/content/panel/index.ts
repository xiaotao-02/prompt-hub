/**
 * 浮动面板对外的入口：renderPanel / extract & refine 流式补丁 / closePanel。
 */
import type { PromptVersion, RefineStage } from '@/lib/types';
import { commitPanelEvent } from './dispatchPanel';
import { normalizeReferenceList } from '@/lib/referenceImages';
import {
  HOST_ID,
  host,
  shadow,
  panel,
  currentState,
  setHost,
  setShadow,
  setPanel,
  setCurrentState,
  resetComposeCollectMode,
  resetComposeVideoSegment,
  setComposeCollectMode,
  getComposeCollectMode,
  setComposeSelectedVideoIndex,
  clampComposeSelectedVideoIndex,
  applyDefaultComposeVideoSegment,
  getComposeSelectedVideoIndex,
  panelActions,
  type PanelState,
  panelReferenceUrls,
  libraryStorageId,
  panelHasActiveRefine,
} from './state';
import {
  stopLoadingTicker,
  stopLoadingStallWatchdog,
  stopRefineStallWatchdog,
  stopRefineTicker,
  manageRefineStallWatchdog,
  applyRefinePatch,
} from './loading';
import { bindEvents, cancelPendingDirtyChromeDeferred } from './panelShell';
export {
  applyExtractStreamError,
  applyExtractStreamProgress,
  applyExtractStreamResult,
  renderPanelForExtractPending,
} from './extractStream';

export {
  applyStoredActiveModel,
  applyStoredPromptStrategy,
  applyStoredOutputStyle,
  applyStoredOneClickRefineRandomness,
} from './panelShell';
export { patchStrategyDropdownSelection } from './strategyDisplay';
export { applyStoredPanelAutofocus } from './focusPolicy';
import {
  ensureGeometry,
  applyGeometryToPanel,
  scheduleReclampOnViewportChange,
  scheduleStabilizePanelHeight,
  resetStableSurfaceHeight,
  maybeResetStableSurfaceForPanelStatus,
  maybeAdjustGeometryForPanelStatus,
  capturePanelHeightBeforeRender,
} from './geometry';
import { ensurePanelReactRoot, renderPanelReact, unmountPanelReact } from './panelReactRoot';
import {
  appendPanelResizeHandles,
  createPanelShadowHost,
  PANEL_SURFACE_SELECTOR,
} from './panelShadowHost';
import {
  buildComposeAfterAppendReference,
  shouldEnqueueAppendReference,
} from './appendReferencePlan';
import {
  clearPendingAppendReferenceQueue,
  enqueuePendingAppendReference,
} from './pendingReferenceQueue';
import { patchVersionList } from './versionListUi';
import { listViewportVideos } from '@/content/videoSegmentSample';
import {
  bindPanelOutsideClose,
  panelOutsideCloseActions,
  unbindPanelOutsideClose,
} from './panelOutsideClose';

let viewportListenerBound = false;

/** 最近一次 renderPanel 的 status；关闭面板后清空，用于 a11y 播报与 autofocus */
let lastRenderedPanelStatus: PanelState['status'] | null = null;

function ensureHost(): { host: HTMLDivElement; shadow: ShadowRoot } {
  if (host && shadow) return { host, shadow };
  const { host: h, shadow: s } = createPanelShadowHost({
    hostId: HOST_ID,
    hostStyleCss:
      'position: fixed; inset: 0; z-index: 2147483647; width: 0; height: 0; color-scheme: light dark;',
  });
  document.documentElement.appendChild(h);
  setHost(h);
  setShadow(s);
  // 视口尺寸变化时，把当前几何 clamp 回安全范围；避免「窗口缩小后面板留在屏幕外」。
  if (!viewportListenerBound) {
    window.addEventListener('resize', scheduleReclampOnViewportChange);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', scheduleReclampOnViewportChange);
      vv.addEventListener('scroll', scheduleReclampOnViewportChange);
    }
    viewportListenerBound = true;
  }
  return { host: h, shadow: s };
}

function ensurePanelSurface(root: HTMLElement): HTMLElement {
  let surface = root.querySelector<HTMLElement>(PANEL_SURFACE_SELECTOR);
  if (!surface) {
    surface = document.createElement('div');
    surface.dataset.role = 'panel-surface';
    root.insertBefore(surface, root.firstChild);
  }
  ensurePanelReactRoot(surface);
  return surface;
}

function renderPanelSurface(
  root: HTMLElement,
  state: PanelState,
  prevStatus: PanelState['status'] | null,
): void {
  ensurePanelSurface(root);
  renderPanelReact(state, prevStatus);
}

function finishRenderPanel(
  root: HTMLElement,
  state: PanelState,
  prevStatus: PanelState['status'] | null,
): void {
  maybeResetStableSurfaceForPanelStatus(state.status, prevStatus);
  maybeAdjustGeometryForPanelStatus(state.status, prevStatus, {
    refCount: panelReferenceUrls(state).length,
    videoMode: getComposeCollectMode() === 'video' && listViewportVideos().length > 0,
  });
  applyGeometryToPanel(root, ensureGeometry());
  bindEvents(root);
  scheduleStabilizePanelHeight();
  bindPanelOutsideClose();
}

export function renderPanel(state: PanelState): void {
  const { shadow } = ensureHost();
  const prevStatus = lastRenderedPanelStatus;
  setCurrentState(state);
  lastRenderedPanelStatus = state.status;

  if (panel) {
    const surface = panel.querySelector(PANEL_SURFACE_SELECTOR);
    if (surface) {
      capturePanelHeightBeforeRender();
      renderPanelSurface(panel, state, prevStatus);
      finishRenderPanel(panel, state, prevStatus);
      return;
    }
  }

  const hadExistingPanel = panel !== null;
  if (panel) panel.remove();
  const next = document.createElement('div');
  next.className = 'panel';
  renderPanelSurface(next, state, prevStatus);
  appendPanelResizeHandles(next);
  shadow.appendChild(next);
  setPanel(next);
  const markMounted = () => next.classList.add('mounted');
  if (hadExistingPanel) {
    markMounted();
  } else {
    next.addEventListener('animationend', markMounted, { once: true });
    setTimeout(markMounted, 260);
  }
  finishRenderPanel(next, state, prevStatus);
}

/**
 * 右键「添加到参考」：并入参考列表，进入 compose，不触发反推。
 */
export function appendReferenceFromBackground(imageUrl: string): void {
  const url = (imageUrl || '').trim();
  if (!url) return;
  const cur = currentState;
  if (shouldEnqueueAppendReference(cur)) {
    enqueuePendingAppendReference(url);
    return;
  }

  renderPanel(buildComposeAfterAppendReference(cur, url, crypto.randomUUID()));
}

/**
 * 右键「添加视频参考」：打开 compose 并切到「采集视频帧」，预选命中的页面视频。
 */
export function openVideoReferenceFromBackground(videoIndex?: number): void {
  setComposeCollectMode('video');
  if (videoIndex != null && videoIndex >= 0) {
    setComposeSelectedVideoIndex(videoIndex);
  } else {
    clampComposeSelectedVideoIndex(listViewportVideos().length);
  }
  applyDefaultComposeVideoSegment(getComposeSelectedVideoIndex(), { force: true });

  const freshCompose = (
    sessionRequestId: string,
    urls: string[],
    inherit?: Pick<PanelState, 'strategy' | 'outputStyle' | 'oneClickRefineRandomness'>,
  ): PanelState => {
    const list = normalizeReferenceList(urls);
    const first = list[0] || '';
    return {
      sessionRequestId,
      imageUrl: first,
      imageUrls: list,
      status: 'compose',
      strategy: inherit?.strategy,
      outputStyle: inherit?.outputStyle,
      oneClickRefineRandomness: inherit?.oneClickRefineRandomness,
    };
  };

  const cur = currentState;
  if (!cur) {
    renderPanel(freshCompose(crypto.randomUUID(), []));
    return;
  }
  if (cur.status === 'success' || cur.status === 'error') {
    renderPanel(
      freshCompose(crypto.randomUUID(), [], {
        strategy: cur.strategy,
        outputStyle: cur.outputStyle,
        oneClickRefineRandomness: cur.oneClickRefineRandomness,
      }),
    );
    return;
  }
  if (cur.status === 'compose') {
    renderPanel({ ...cur });
    return;
  }
  renderPanel(
    freshCompose(crypto.randomUUID(), panelReferenceUrls(cur), {
      strategy: cur.strategy,
      outputStyle: cur.outputStyle,
      oneClickRefineRandomness: cur.oneClickRefineRandomness,
    }),
  );
}

export function patchRefineProgress(payload: {
  historyId: string;
  refineJobId?: string;
  stage?: RefineStage;
  partial?: string;
  streamMode?: import('@/lib/types').StreamDeliveryMode;
}): void {
  const cur = currentState;
  if (!cur || libraryStorageId(cur) !== payload.historyId) return;

  const merged =
    commitPanelEvent({
      type: 'refine.progress',
      refineJobId: payload.refineJobId,
      stage: payload.stage,
      partial: payload.partial,
      streamMode: payload.streamMode,
    }) ?? cur;

  const refineLightUpdate =
    panelHasActiveRefine(merged) &&
    (payload.stage !== undefined ||
      payload.partial !== undefined ||
      payload.streamMode !== undefined);

  if (refineLightUpdate && panel) {
    applyRefinePatch(merged);
    manageRefineStallWatchdog(merged);
    return;
  }
  renderPanel(merged);
}

/**
 * 同图识图：落库前把库中已有 versions 填进面板，避免 loading 阶段「历史版本 · 0」。
 */
export function applyHistoryPrefetch(
  sessionRequestId: string,
  payload: {
    storageId: string;
    versions: PromptVersion[];
    prompt: string;
  },
): void {
  if (
    !commitPanelEvent({
      type: 'history.prefetch',
      sessionRequestId,
      prefetchStorageId: payload.storageId,
      versions: payload.versions,
      prompt: payload.prompt,
    })
  ) {
    return;
  }
  patchVersionList();
}

/**
 * Background 端 persistHistory 完成后：对齐 storage id，并从并行队列移除已完成反推。
 */
export function applyHistoryReady(
  sessionRequestId: string,
  actualId: string,
  versions: PromptVersion[],
  prompt: string,
): void {
  const next = commitPanelEvent({
    type: 'history.ready',
    sessionRequestId,
    persistedHistoryId: actualId,
    versions,
    prompt,
  });
  if (next) renderPanel(next);
}

export function closePanel(): void {
  cancelPendingDirtyChromeDeferred();
  clearPendingAppendReferenceQueue();
  resetComposeCollectMode();
  resetComposeVideoSegment();
  lastRenderedPanelStatus = null;
  resetStableSurfaceHeight();
  stopLoadingTicker();
  stopLoadingStallWatchdog();
  stopRefineTicker();
  stopRefineStallWatchdog();
  unbindPanelOutsideClose();
  unmountPanelReact();
  if (panel) {
    panel.remove();
    setPanel(null);
  }
  setCurrentState(null);
}

panelActions.renderPanel = renderPanel;
panelActions.closePanel = closePanel;
panelOutsideCloseActions.closePanel = closePanel;
