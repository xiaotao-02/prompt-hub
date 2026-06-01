import { forEachAccessibleSameOriginDocument } from '@/content/sameOriginIframes';
import { captureVideoFrameToDataUrl, findViewportVideoIndex } from '@/content/videoSegmentSample';

/** 全页扫描上限，避免超重型瀑布流一次右键卡死主线程 */
const RECT_HIT_MAX_NODES = 2000;
/** 忽略过小的占位/追踪图，避免矩形命中误选 */
const RECT_HIT_MIN_EDGE = 8;

export type CtxMenuPrepResult = {
  extractionUrl: string;
  showFallback: boolean;
  videoIndex?: number;
};

function videoIndexIfInViewport(video: HTMLVideoElement): number | undefined {
  const idx = findViewportVideoIndex(video);
  return idx >= 0 ? idx : undefined;
}

function prepFromVideo(video: HTMLVideoElement, showFallback: boolean): CtxMenuPrepResult {
  const videoIndex = videoIndexIfInViewport(video);
  return {
    extractionUrl: extractVideoBestUrl(video),
    showFallback,
    ...(videoIndex != null ? { videoIndex } : {}),
  };
}

/** `composedPath` + `elementsFromPoint` 合并，减轻 Shadow / 层叠上下文下的漏检。 */
function hitStack(ev: MouseEvent, x: number, y: number): Element[] {
  const fromPoint =
    typeof document.elementsFromPoint === 'function'
      ? document.elementsFromPoint(x, y)
      : (() => {
          const hit = document.elementFromPoint(x, y);
          return hit ? [hit] : [];
        })();

  let fromComposed: Element[] = [];
  if (typeof ev.composedPath === 'function') {
    try {
      fromComposed = ev.composedPath().filter((node): node is Element => node instanceof Element);
    } catch {
      fromComposed = [];
    }
  }

  const seen = new Set<Element>();
  const out: Element[] = [];
  const push = (el: Element) => {
    if (seen.has(el)) return;
    seen.add(el);
    out.push(el);
  };

  // composedPath（事件路径）先于视口自上而下命中栈——通常对用户「点中了谁」更准确
  for (const el of fromComposed) push(el);
  for (const el of fromPoint) push(el);

  return out;
}

function resolveVideoPosterUrl(video: HTMLVideoElement): string {
  const raw = video.getAttribute('poster')?.trim() || '';
  if (!raw) return '';
  const base =
    video.ownerDocument?.baseURI ?? (typeof location !== 'undefined' ? location.href : '');
  try {
    return new URL(raw, base || undefined).href;
  } catch {
    try {
      return base ? new URL(raw, base).href : raw;
    } catch {
      return raw;
    }
  }
}

/**
 * video 解码帧 → JPEG；失败后依次 poster、`currentSrc`。
 */
function extractVideoBestUrl(video: HTMLVideoElement): string {
  const frame = captureVideoFrameToDataUrl(video);
  if (frame) return frame;
  const poster = resolveVideoPosterUrl(video);
  if (poster) return poster;
  return video.currentSrc || video.src || '';
}

/** Chrome 会认为属于原生 image 上下文的右键 target；这类情况不写 fallback 兜底菜单以免重复入口。 */
function isNativeMediaContextSurface(target: Element | null): boolean {
  if (!target) return false;
  if (target instanceof HTMLImageElement) return true;
  const tag = target.tagName;
  return tag === 'SOURCE' || tag === 'PICTURE';
}

/** 右键位置综合探测：返回值同时驱动 tab 缓存与兜底菜单 visibility。 */
export function computeCtxMenuPrep(ev: MouseEvent): CtxMenuPrepResult {
  const x = ev.clientX;
  const y = ev.clientY;
  const stack = hitStack(ev, x, y);
  const target = ev.target instanceof Element ? ev.target : null;

  // 直接点到 <video>：原生 video 上下文 + 「添加参考」菜单项；不写 showFallback；仍缓存抓拍 JPEG 供菜单点击优于 srcUrl。
  if (target instanceof HTMLVideoElement) {
    return prepFromVideo(target, false);
  }

  // <video> 优先（遮罩、「假 GIF」video）
  for (const el of stack) {
    if (el instanceof HTMLVideoElement) {
      const url = extractVideoBestUrl(el);
      if (url) return prepFromVideo(el, true);
    }
  }

  // <img> 分两种命中模式：
  //
  //   A. 右键直接命中 <img>（event.target 本身是 img，或是 <picture> 里的 <source>
  //      ——后者 Chrome 仍会按图像上下文菜单处理）→ 原生 image 菜单会自动弹出，
  //      返回空串让 fallback 菜单保持隐藏，避免和原生菜单重复。
  //
  //   B. <img> 被透明 overlay 罩住 ——
  //      Behance / Pinterest / Dribbble / Unsplash / 各种作品集站点惯用做法：
  //      在 <img> 之上盖一个吃指针事件的 <div>，目的是拦截"另存为/拖拽下载"。
  //      这种情况下 contextmenu 的 target 是上层 div，Chrome 不会判定为 image
  //      上下文，原生菜单不出；如果我们这里再傻乎乎返回空串，fallback 菜单也
  //      被藏起来，用户就什么入口都看不到（这就是"Behance 上右键失效"的根因）。
  //      所以这里主动把被覆盖的 <img> 的 currentSrc 抛给后台，让 fallback 菜单
  //      显示。currentSrc 比 src 更准确——能拿到 srcset 实际选中的那张分辨率。
  //      栈里多张图时取包围盒面积较小者，减轻瀑布流重叠时的误选。
  //      点到 `<picture>` 外层等价于结构化图片上下文，亦不写兜底。
  //
  if (isNativeMediaContextSurface(target)) return { extractionUrl: '', showFallback: false };

  const imgsInStack: HTMLImageElement[] = [];
  for (const el of stack) {
    if (el instanceof HTMLImageElement) imgsInStack.push(el);
  }
  if (imgsInStack.length > 0) {
    const pick =
      imgsInStack.length === 1
        ? imgsInStack[0]
        : imgsInStack.reduce((a, b) =>
            rectArea(a.getBoundingClientRect()) <= rectArea(b.getBoundingClientRect()) ? a : b,
          );
    const src = pick.currentSrc || pick.src || '';
    if (src) return { extractionUrl: src, showFallback: true };
  }

  // <canvas>：很多动画 / 渲染场景（webgl 图表、游戏画面）走 canvas。
  for (const el of stack) {
    if (el instanceof HTMLCanvasElement) {
      try {
        return { extractionUrl: el.toDataURL('image/png'), showFallback: true };
      } catch {
        // tainted canvas，没辙
        return { extractionUrl: '', showFallback: false };
      }
    }
  }

  // 内联 <svg>（图标、矢量插画）：序列化成 data:image/svg+xml
  for (const el of stack) {
    if (el instanceof SVGSVGElement) {
      try {
        const xml = new XMLSerializer().serializeToString(el);
        return {
          extractionUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`,
          showFallback: true,
        };
      } catch {
        // ignore
      }
    }
  }

  // CSS background-image / mask-image
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const url = readCssBgUrl(el);
    if (url) return { extractionUrl: url, showFallback: true };
  }

  // <video> 设了 pointer-events:none、或不在命中栈里时，用矩形命中兜底。
  const fromRect = pickMediaByRectHit(x, y);
  if (fromRect) {
    return {
      extractionUrl: fromRect.url,
      showFallback: true,
      ...(fromRect.videoIndex != null ? { videoIndex: fromRect.videoIndex } : {}),
    };
  }

  return { extractionUrl: '', showFallback: false };
}

function rectArea(r: DOMRectReadOnly): number {
  return Math.max(0, r.width) * Math.max(0, r.height);
}

function rectContainsClientPoint(r: DOMRectReadOnly, x: number, y: number): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function isRoughlyInViewportForElement(el: Element, r: DOMRectReadOnly): boolean {
  const win = el.ownerDocument?.defaultView;
  if (!win) return false;
  const h = win.innerHeight;
  const w = win.innerWidth;
  return r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;
}

/**
 * 将当前 content script 所在 window 的视口坐标映射到 `targetDoc` 对应视口
 *（用于主帧收到的 clientX/Y 与 iframe 内元素的 getBoundingClientRect 对齐）。
 */
function mapClientPointToDocumentViewport(
  anchorWin: Window,
  clientX: number,
  clientY: number,
  targetDoc: Document,
): { x: number; y: number } | null {
  if (targetDoc.defaultView === anchorWin) {
    return { x: clientX, y: clientY };
  }
  let x = clientX;
  let y = clientY;
  let w: Window | null = targetDoc.defaultView;
  while (w && w !== anchorWin) {
    const fe = w.frameElement as HTMLIFrameElement | null;
    if (!fe) return null;
    const r = fe.getBoundingClientRect();
    x -= r.left;
    y -= r.top;
    w = w.parent;
  }
  return w === anchorWin ? { x, y } : null;
}

function collectVideoImgFromAccessibleDocuments(
  rootDoc: Document,
): (HTMLVideoElement | HTMLImageElement)[] {
  const out: (HTMLVideoElement | HTMLImageElement)[] = [];
  forEachAccessibleSameOriginDocument(rootDoc, (doc) => {
    out.push(...collectVideoImgRoots(doc));
  });
  return out;
}

/**
 * 在视口内、包含点击点的 video/img 中，取包围盒面积最小者；含 open ShadowRoot 与同源 iframe。
 */
function pickMediaByRectHit(x: number, y: number): { url: string; videoIndex?: number } | null {
  const candidates = collectVideoImgFromAccessibleDocuments(document);
  let bestEl: HTMLVideoElement | HTMLImageElement | undefined;
  let bestArea = Infinity;

  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    if (r.width < RECT_HIT_MIN_EDGE || r.height < RECT_HIT_MIN_EDGE) continue;
    if (!isRoughlyInViewportForElement(el, r)) continue;
    const mapped = mapClientPointToDocumentViewport(window, x, y, el.ownerDocument);
    if (!mapped) continue;
    if (!rectContainsClientPoint(r, mapped.x, mapped.y)) continue;
    const area = rectArea(r);
    if (area < bestArea) {
      bestArea = area;
      bestEl = el;
    }
  }

  if (!bestEl) return null;
  if (bestEl instanceof HTMLVideoElement) {
    const videoIndex = videoIndexIfInViewport(bestEl);
    return {
      url: extractVideoBestUrl(bestEl),
      ...(videoIndex != null ? { videoIndex } : {}),
    };
  }
  return { url: bestEl.currentSrc || bestEl.src || '' };
}

function collectVideoImgRoots(top: Document | ShadowRoot): (HTMLVideoElement | HTMLImageElement)[] {
  const out: (HTMLVideoElement | HTMLImageElement)[] = [];
  let seenMedia = 0;
  let hostScan = 0;
  const MAX_HOST_SCAN = 4000;

  const visitRoot = (root: Document | ShadowRoot): void => {
    root.querySelectorAll('video, img').forEach((el) => {
      if (!(el instanceof HTMLVideoElement || el instanceof HTMLImageElement)) return;
      if (seenMedia >= RECT_HIT_MAX_NODES) return;
      seenMedia += 1;
      out.push(el);
    });

    if (seenMedia >= RECT_HIT_MAX_NODES) return;

    for (const host of root.querySelectorAll('*')) {
      if (hostScan >= MAX_HOST_SCAN || seenMedia >= RECT_HIT_MAX_NODES) return;
      hostScan += 1;
      const sr = host.shadowRoot;
      if (sr?.mode !== 'open') continue;
      visitRoot(sr);
    }
  };

  visitRoot(top);
  return out;
}

export function parseFirstCssImageUrl(value: string): string {
  if (!value || value === 'none') return '';
  const m = /url\((?:"|')?([^"')]+)(?:"|')?\)/.exec(value);
  return m?.[1] ?? '';
}

function readCssBgUrl(el: Element): string {
  let style: CSSStyleDeclaration;
  try {
    style = getComputedStyle(el);
  } catch {
    return '';
  }
  // 优先看 background-image，再看 mask-image / -webkit-mask-image
  const candidates = [
    style.backgroundImage,
    style.getPropertyValue('mask-image'),
    style.getPropertyValue('-webkit-mask-image'),
  ];
  for (const v of candidates) {
    const url = parseFirstCssImageUrl(v);
    if (url) return url;
  }
  return '';
}
