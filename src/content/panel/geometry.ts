/**
 * 浮动面板的几何信息（位置 + 尺寸）：加载、保存、clamp、apply。
 *
 * 设计要点：
 * - 默认状态下 width 按视口比例（封顶 1100）并视口居中；height 完全 auto，让内容决定高度。
 *   这样状态切换（loading → success → versions 展开）时面板能"自适应"内容。
 * - 用户主动操作后才把对应字段写成固定 px：
 *   · 拖动 header → 写 left / top
 *   · 拖任意边缘 / 角落 resize → 写 width / height（西/北方向同时写 left/top）
 * - 几何信息持久化到 sessionStorage，刷新当前 tab 后丢失，新 tab 独立，
 *   不污染 chrome.storage.local（用户基本不会期望"上次拖到右下角，下次新打开还在右下角"）。
 */
import { getCachedVersionsSidebarWidth } from '@/lib/versionsSidebarWidth';
import {
  panel,
  panelGeometry,
  setPanelGeometry,
  type PanelGeometry,
  type PanelState,
} from './state';

export type ComposePanelWidthOpts = {
  refCount: number;
  videoMode: boolean;
};

const STORAGE_KEY = '__image_prompt_extractor_panel_geom__';
const PANEL_SURFACE_SELECTOR = '[data-role="panel-surface"]';
/** 略大于 --pe-collapse-duration (220ms) */
const GEOMETRY_TRANSITION_FALLBACK_MS = 320;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
/** 渲染前锁定的面板高度（px）；null 表示未在 FLIP 流程中 */
let autoHeightFlipLocked: number | null = null;
let geometryTransitionFallbackTimer: number | null = null;
let heightFlipFinalizeTimer: number | null = null;
let heightFlipEndHandler: ((e: TransitionEvent) => void) | null = null;

export const MIN_WIDTH = 360;
export const MIN_HEIGHT = 220;
export const VIEWPORT_MARGIN = 8;
/** 初始宽度占视口比例（content panel 与提示词库浮窗共用） */
export const PANEL_WIDTH_RATIO = 0.72;
/** 仅用于垂直居中估算，不写死面板高度 */
export const PANEL_HEIGHT_RATIO = 0.72;
/** 初始宽度上限（侧栏 + 5 张参考图横排） */
export const PANEL_MAX_WIDTH = 1100;
/** 仅用于垂直居中估算 */
export const PANEL_MAX_HEIGHT = 680;
/** compose 态：工具栏 + 输出设置 + 操作栏下限 */
export const COMPOSE_PANEL_MIN_WIDTH = 420;
/** compose 图片模式宽度上限 */
export const COMPOSE_PANEL_MAX_WIDTH = 560;
/** compose 视频采集模式宽度上限 */
export const COMPOSE_VIDEO_PANEL_MAX_WIDTH = 600;
/** 与 compose.ts .ref-item 对齐 */
export const COMPOSE_REF_THUMB = 100;
export const COMPOSE_REF_GAP = 8;
/** .body 16*2 + .compose-card-body 10*2 */
export const COMPOSE_BODY_PAD = 52;
/** @deprecated 使用 getCachedVersionsSidebarWidth()；保留作文档默认宽度 */
export const SIDEBAR_WIDTH = 280;

function currentSidebarWidth(): number {
  return getCachedVersionsSidebarWidth();
}

/**
 * 用于 clamp 的布局盒：优先 Visual Viewport（移动端地址栏、软键盘、 pinch-zoom），
 * 与 `window.innerWidth/innerHeight` 不一致时避免面板被「夹到」不可见区域。
 */
export function getLayoutViewportBox(): {
  width: number;
  height: number;
  originLeft: number;
  originTop: number;
} {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (vv && vv.width > 0 && vv.height > 0) {
    return {
      width: vv.width,
      height: vv.height,
      originLeft: vv.offsetLeft,
      originTop: vv.offsetTop,
    };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    originLeft: 0,
    originTop: 0,
  };
}

function readSession(): PanelGeometry | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (
      v &&
      typeof v.left === 'number' &&
      typeof v.top === 'number' &&
      (v.width === undefined || typeof v.width === 'number') &&
      (v.height === undefined || typeof v.height === 'number') &&
      (v.widthUserLocked === undefined || typeof v.widthUserLocked === 'boolean')
    ) {
      return v;
    }
  } catch {
    // sessionStorage 在某些 sandbox iframe 里会抛 SecurityError，忽略
  }
  return null;
}

function writeSession(g: PanelGeometry): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(g));
  } catch {
    // 同上：忽略 SecurityError / QuotaExceededError
  }
}

/**
 * 把任意几何 clamp 到当前视口范围内，避免被拖出屏幕或调到比视口还大。
 *
 * - width / height 上限：视口减去左右 / 上下各一个 margin
 * - left / top 上限：让面板至少有 32px 露在视口里（这里直接保留 margin 当下限）
 */
export function clampGeometry(g: PanelGeometry): PanelGeometry {
  const { width: vw, height: vh, originLeft, originTop } = getLayoutViewportBox();
  const w =
    g.width !== undefined
      ? Math.max(MIN_WIDTH, Math.min(g.width, vw - VIEWPORT_MARGIN * 2))
      : undefined;
  const h =
    g.height !== undefined
      ? Math.max(MIN_HEIGHT, Math.min(g.height, vh - VIEWPORT_MARGIN * 2))
      : undefined;
  // left / top 的可移动上限：保证整个面板（按当前 width / height 估算）至少有
  // 一小条留在视口里。如果 width/height 是 undefined，就用一个最小估值兜底。
  const estW = w ?? Math.min(720, vw - 48);
  const estH = h ?? Math.min(480, vh - 48);
  const minL = originLeft + VIEWPORT_MARGIN;
  const minT = originTop + VIEWPORT_MARGIN;
  const maxLeft = originLeft + vw - estW - VIEWPORT_MARGIN;
  const maxTop = originTop + vh - estH - VIEWPORT_MARGIN;
  const left = Math.max(minL, Math.min(g.left, Math.max(minL, maxLeft)));
  const top = Math.max(minT, Math.min(g.top, Math.max(minT, maxTop)));
  return { left, top, width: w, height: h, widthUserLocked: g.widthUserLocked };
}

/**
 * 比例宽度 + 视口居中初始几何（content panel 与提示词库浮窗共用）。
 * height 不写，保留按内容自适应。
 */
export function ratioCenteredGeometry(): PanelGeometry {
  const { width: vw, height: vh, originLeft, originTop } = getLayoutViewportBox();
  const width = Math.max(
    MIN_WIDTH,
    Math.min(Math.round(vw * PANEL_WIDTH_RATIO), PANEL_MAX_WIDTH, vw - VIEWPORT_MARGIN * 2),
  );
  const estHeight = Math.max(
    MIN_HEIGHT,
    Math.min(Math.round(vh * PANEL_HEIGHT_RATIO), PANEL_MAX_HEIGHT, vh - VIEWPORT_MARGIN * 2),
  );
  const minL = originLeft + VIEWPORT_MARGIN;
  const minT = originTop + VIEWPORT_MARGIN;
  const left = Math.max(minL, Math.round(originLeft + (vw - width) / 2));
  const top = Math.max(minT, Math.round(originTop + (vh - estHeight) / 2));
  return clampGeometry({ left, top, width });
}

/** compose 态按参考图数量与模式计算合适宽度（px）。 */
export function computeComposePanelWidth(opts: ComposePanelWidthOpts): number {
  const { width: vw } = getLayoutViewportBox();
  const strip =
    opts.refCount <= 0
      ? 0
      : opts.refCount * COMPOSE_REF_THUMB + (opts.refCount - 1) * COMPOSE_REF_GAP;
  const natural = Math.max(COMPOSE_PANEL_MIN_WIDTH, strip + COMPOSE_BODY_PAD);
  const cap = opts.videoMode ? COMPOSE_VIDEO_PANEL_MAX_WIDTH : COMPOSE_PANEL_MAX_WIDTH;
  return Math.max(MIN_WIDTH, Math.min(natural, cap, vw - VIEWPORT_MARGIN * 2));
}

/** compose 态几何：保持当前 top，按内容宽度水平居中。 */
export function composeCenteredGeometry(opts: ComposePanelWidthOpts): PanelGeometry {
  const base = panelGeometry ?? ensureGeometry();
  const width = computeComposePanelWidth(opts);
  const { width: vw, originLeft } = getLayoutViewportBox();
  const minL = originLeft + VIEWPORT_MARGIN;
  const left = Math.max(minL, Math.round(originLeft + (vw - width) / 2));
  return clampGeometry({
    left,
    top: base.top,
    width,
    height: base.height,
    widthUserLocked: base.widthUserLocked,
  });
}

/**
 * 取当前应用到面板上的几何：内存 → sessionStorage → 比例居中默认值。
 */
export function ensureGeometry(): PanelGeometry {
  if (panelGeometry) return panelGeometry;
  const stored = readSession();
  if (stored) {
    const c = clampGeometry(stored);
    setPanelGeometry(c);
    return c;
  }
  const g = ratioCenteredGeometry();
  setPanelGeometry(g);
  return g;
}

/**
 * 把几何写入到当前 panel 元素的 inline style。
 *
 * width / height 没设时显式抹掉对应的 inline style，让 CSS 默认值（包括
 * max-height）继续生效，从而保留"按内容自适应"的能力。
 */
export function applyGeometryToPanel(p: HTMLElement, g: PanelGeometry): void {
  p.style.left = `${g.left}px`;
  p.style.top = `${g.top}px`;
  if (g.width !== undefined) p.style.width = `${g.width}px`;
  else p.style.removeProperty('width');
  if (g.height !== undefined) {
    p.style.height = `${g.height}px`;
  } else if (autoHeightFlipLocked === null) {
    p.style.removeProperty('height');
  }
  p.classList.toggle('panel-locked-height', g.height !== undefined);
  if (g.height !== undefined) {
    applyStableSurfaceMinHeight(p, 0);
  }
}

/**
 * 合并 patch 到模块级 panelGeometry，clamp 后写回 sessionStorage，
 * 并把结果应用到当前 panel 节点（如果存在）。
 *
 * 拖拽过程中频繁调用：拖动 = patch left/top；resize = patch width/height。
 */
export function updateGeometry(patch: Partial<PanelGeometry>): PanelGeometry {
  const base = panelGeometry ?? ensureGeometry();
  const merged: PanelGeometry = { ...base };
  if (patch.left !== undefined) merged.left = patch.left;
  if (patch.top !== undefined) merged.top = patch.top;
  if (patch.width !== undefined) merged.width = patch.width;
  if (patch.height !== undefined) merged.height = patch.height;
  if (patch.widthUserLocked !== undefined) merged.widthUserLocked = patch.widthUserLocked;
  const clamped = clampGeometry(merged);
  setPanelGeometry(clamped);
  writeSession(clamped);
  if (panel) applyGeometryToPanel(panel, clamped);
  return clamped;
}

/**
 * 视口尺寸变化时调用一次，把当前几何 clamp 回安全范围。
 * 避免用户先把 panel 拉到 1800px 宽，再把浏览器窗口缩到 800px 后看不到 panel。
 */
export function reclampOnViewportChange(): void {
  if (!panelGeometry) return;
  const next = clampGeometry(panelGeometry);
  setPanelGeometry(next);
  writeSession(next);
  if (panel) applyGeometryToPanel(panel, next);
  if (stableSurfaceMinHeight > 0) {
    stableSurfaceMinHeight = clampStableSurfaceHeight(stableSurfaceMinHeight);
    if (panel) applyStableSurfaceMinHeight(panel, stableSurfaceMinHeight);
  }
}

let reclampViewportRafQueued = false;

/**
 * 把视口 clamp 延后到下一帧：resize 拖拽会连续触发，合并到单次 rAF
 * 减少 clamp + sessionStorage + style 写入的抖动。
 */
export function scheduleReclampOnViewportChange(): void {
  if (reclampViewportRafQueued) return;
  reclampViewportRafQueued = true;
  requestAnimationFrame(() => {
    reclampViewportRafQueued = false;
    reclampOnViewportChange();
  });
}

// ── 几何过渡动画（侧栏宽/位置 + auto 高度 FLIP）────────────────────────

function clearGeometryTransitionTimer(): void {
  if (geometryTransitionFallbackTimer !== null) {
    window.clearTimeout(geometryTransitionFallbackTimer);
    geometryTransitionFallbackTimer = null;
  }
}

function clearHeightFlipListeners(): void {
  if (heightFlipFinalizeTimer !== null) {
    window.clearTimeout(heightFlipFinalizeTimer);
    heightFlipFinalizeTimer = null;
  }
  if (heightFlipEndHandler && panel) {
    panel.removeEventListener('transitionend', heightFlipEndHandler);
    heightFlipEndHandler = null;
  }
}

function finalizeAutoHeightFlip(): void {
  clearHeightFlipListeners();
  if (!panel) {
    autoHeightFlipLocked = null;
    return;
  }
  const g = panelGeometry ?? ensureGeometry();
  if (g.height === undefined) {
    panel.style.removeProperty('height');
  }
  autoHeightFlipLocked = null;
}

/**
 * 临时启用 width/height/left/top CSS 过渡；可重入（延长 fallback）。
 * prefers-reduced-motion 时不加 class。
 */
export function runPanelGeometryTransition(): void {
  if (!panel || prefersReducedMotion()) return;

  panel.classList.add('geometry-transition');
  clearGeometryTransitionTimer();
  geometryTransitionFallbackTimer = window.setTimeout(() => {
    geometryTransitionFallbackTimer = null;
    panel?.classList.remove('geometry-transition');
  }, GEOMETRY_TRANSITION_FALLBACK_MS);
}

/**
 * React 重渲前：auto 高度模式下锁定当前高度并启用过渡，供后续 FLIP 补完。
 */
export function capturePanelHeightBeforeRender(): void {
  if (!panel) return;
  const g = panelGeometry ?? ensureGeometry();
  if (g.height !== undefined) return;
  if (prefersReducedMotion()) return;

  const before = Math.ceil(panel.getBoundingClientRect().height);
  if (before <= 0) return;

  autoHeightFlipLocked = before;
  panel.style.height = `${before}px`;
  runPanelGeometryTransition();
}

function scheduleHeightFlipFinalize(): void {
  clearHeightFlipListeners();
  if (!panel) return;

  const done = () => finalizeAutoHeightFlip();

  heightFlipEndHandler = (e: TransitionEvent) => {
    if (e.target !== panel) return;
    if (e.propertyName !== 'height') return;
    done();
  };

  panel.addEventListener('transitionend', heightFlipEndHandler);
  heightFlipFinalizeTimer = window.setTimeout(done, GEOMETRY_TRANSITION_FALLBACK_MS);
}

/** rAF 内：测量新内容自然高度并过渡到目标值 */
function animatePanelAutoHeightIfNeeded(): void {
  if (!panel || autoHeightFlipLocked === null) return;
  const g = panelGeometry ?? ensureGeometry();
  if (g.height !== undefined) {
    autoHeightFlipLocked = null;
    return;
  }
  if (prefersReducedMotion()) {
    finalizeAutoHeightFlip();
    return;
  }

  const before = autoHeightFlipLocked;

  panel.style.removeProperty('height');
  void panel.offsetHeight;
  const natural = Math.ceil(panel.getBoundingClientRect().height);

  if (Math.abs(natural - before) < 2) {
    finalizeAutoHeightFlip();
    return;
  }

  panel.style.height = `${before}px`;
  void panel.offsetHeight;

  if (!panel.classList.contains('geometry-transition')) {
    runPanelGeometryTransition();
  }

  panel.style.height = `${natural}px`;
  scheduleHeightFlipFinalize();
}

// ── 侧栏展开 / 收起时自动调整面板宽度 ──────────────────────────────

let _sidebarLeftShift = 0;

/**
 * 侧栏展开时：面板向左扩展 SIDEBAR_WIDTH，编辑区保持原始大小。
 * 如果向左空间不足，剩余部分由 clampGeometry 向右扩展并截断。
 */
export function expandPanelForSidebar(): void {
  if (!panel) return;
  runPanelGeometryTransition();
  panel.style.setProperty('--pe-versions-width', `${currentSidebarWidth()}px`);
  const base = panelGeometry ?? ensureGeometry();
  const { originLeft } = getLayoutViewportBox();
  const edgeMinLeft = originLeft + VIEWPORT_MARGIN;
  const currentWidth = base.width ?? panel.offsetWidth;
  const sidebarW = currentSidebarWidth();
  const desiredLeft = base.left - sidebarW;
  const clampedLeft = Math.max(edgeMinLeft, desiredLeft);
  _sidebarLeftShift = base.left - clampedLeft;
  updateGeometry({ left: clampedLeft, width: currentWidth + sidebarW });
}

/**
 * 侧栏收起时：面板向右收缩 SIDEBAR_WIDTH，恢复到展开前的位置与宽度。
 */
export function collapsePanelForSidebar(): void {
  if (!panel) return;
  const base = panelGeometry ?? ensureGeometry();
  if (base.width === undefined) return;
  runPanelGeometryTransition();
  const newWidth = Math.max(MIN_WIDTH, base.width - currentSidebarWidth());
  updateGeometry({ left: base.left + _sidebarLeftShift, width: newWidth });
  _sidebarLeftShift = 0;
}

// ── 内容高度稳定：状态切换时不突然收缩 ──────────────────────────────

/** 会话内观测到的 panel-surface 最大高度；关闭面板后清零 */
let stableSurfaceMinHeight = 0;
let stabilizeRafQueued = false;

function clampStableSurfaceHeight(h: number): number {
  const { height: vh } = getLayoutViewportBox();
  return Math.max(0, Math.min(Math.ceil(h), vh - VIEWPORT_MARGIN * 2));
}

export function resetStableSurfaceHeight(): void {
  stableSurfaceMinHeight = 0;
  if (panel) applyStableSurfaceMinHeight(panel, 0);
}

/** 测试用：读取会话内稳定 min-height 观测值 */
export function getStableSurfaceMinHeight(): number {
  return stableSurfaceMinHeight;
}

const TALL_PANEL_STATUSES: PanelState['status'][] = ['loading', 'success', 'error'];
const LEAVE_COMPOSE_STATUSES: PanelState['status'][] = ['loading', 'success', 'error'];

/**
 * compose ↔ 宽面板状态切换时自动调整宽度；用户 edge-resize 锁宽后跳过。
 */
export function maybeAdjustGeometryForPanelStatus(
  status: PanelState['status'],
  prevStatus: PanelState['status'] | null,
  opts: ComposePanelWidthOpts,
): void {
  const g = panelGeometry ?? ensureGeometry();
  if (g.widthUserLocked) return;

  const enteringCompose = status === 'compose' && prevStatus !== 'compose';
  const leavingCompose = prevStatus === 'compose' && LEAVE_COMPOSE_STATUSES.includes(status);

  if (!enteringCompose && !leavingCompose) return;
  if (enteringCompose && g.height !== undefined) return;

  runPanelGeometryTransition();

  if (enteringCompose) {
    const next = composeCenteredGeometry(opts);
    updateGeometry({ width: next.width, left: next.left });
    return;
  }

  const wide = ratioCenteredGeometry();
  updateGeometry({ width: wide.width, left: wide.left });
}

/**
 * 进入「收集参考图」等较短内容时，在自动高度模式下清掉此前 success/loading
 * 留下的稳定 min-height，让面板随当前内容收缩。
 * 用户已手动锁高（geometry.height）时不改动。
 */
export function maybeResetStableSurfaceForPanelStatus(
  status: PanelState['status'],
  prevStatus: PanelState['status'] | null,
): void {
  if (status !== 'compose') return;
  const g = panelGeometry ?? ensureGeometry();
  if (g.height !== undefined) return;
  if (prevStatus != null && !TALL_PANEL_STATUSES.includes(prevStatus)) return;
  resetStableSurfaceHeight();
}

export function applyStableSurfaceMinHeight(p: HTMLElement, minH: number): void {
  const surface = p.querySelector<HTMLElement>(PANEL_SURFACE_SELECTOR);
  if (!surface) return;
  const clamped = clampStableSurfaceHeight(minH);
  if (clamped > 0) {
    surface.style.setProperty('--pe-panel-surface-min-h', `${clamped}px`);
  } else {
    surface.style.removeProperty('--pe-panel-surface-min-h');
  }
}

function measureSurfaceHeight(p: HTMLElement): number {
  const surface = p.querySelector<HTMLElement>(PANEL_SURFACE_SELECTOR);
  if (!surface) return 0;
  return Math.ceil(surface.getBoundingClientRect().height);
}

/** 渲染后测量并抬升稳定 min-height（仅 auto 高度模式） */
export function stabilizePanelHeightNow(): void {
  if (!panel) return;
  const g = panelGeometry ?? ensureGeometry();
  if (g.height !== undefined) return;

  const measured = measureSurfaceHeight(panel);
  if (measured <= 0) return;
  if (measured > stableSurfaceMinHeight) {
    stableSurfaceMinHeight = clampStableSurfaceHeight(measured);
  }
  applyStableSurfaceMinHeight(panel, stableSurfaceMinHeight);
}

/** 合并到下一帧，避免 React commit 与 layout 测量竞态 */
export function scheduleStabilizePanelHeight(): void {
  if (stabilizeRafQueued) return;
  stabilizeRafQueued = true;
  requestAnimationFrame(() => {
    stabilizeRafQueued = false;
    stabilizePanelHeightNow();
    animatePanelAutoHeightIfNeeded();
  });
}
