/**
 * 从页面 `<video>` 按时间片段 seek，采样多帧为 JPEG dataURL，
 * 供 compose 面板「采样到参考 / 时间段反推」使用。
 */

import { MAX_REFERENCE_IMAGES } from '@/lib/referenceImages';
import { forEachAccessibleSameOriginDocument } from '@/content/sameOriginIframes';

/** 与 content/index.ts 矩形命中一致，缩小误扫与漏扫差异 */
const RECT_HIT_MAX_NODES = 2000;
const RECT_HIT_MIN_EDGE = 8;
const HOST_SCAN_LIMIT = 4000;

const SEEK_TIMEOUT_MS = 2800;
const DEFAULT_VIDEO_CAPTURE_MAX_DIM = 1536;
const DEFAULT_VIDEO_CAPTURE_QUALITY = 0.92;
const MAX_VIDEO_SEGMENT_CANDIDATES = 16;
const FRAME_ANALYSIS_DIM = 16;
const LOW_CONTRAST_THRESHOLD = 2.5;
const LOW_SHARPNESS_THRESHOLD = 0.7;
const NEAR_DUPLICATE_HAMMING_THRESHOLD = 3;

export interface VideoFrameCaptureOptions {
  maxDim?: number;
  quality?: number;
}

interface CapturedVideoFrame {
  dataUrl: string;
  signature?: string;
  contrast?: number;
  sharpness?: number;
}

export interface VideoFrameCandidateForSelection extends CapturedVideoFrame {
  timeSec: number;
}

function rectArea(r: DOMRectReadOnly): number {
  return Math.max(0, r.width) * Math.max(0, r.height);
}

/** `getBoundingClientRect` 相对于元素所在 browsing context 的视口；应用该 document 的 window 尺寸判断是否在视口内 */
function isRoughlyInViewportForElement(el: Element, r: DOMRectReadOnly): boolean {
  const win = el.ownerDocument?.defaultView;
  if (!win) return false;
  const h = typeof win.innerHeight === 'number' ? win.innerHeight : 0;
  const w = typeof win.innerWidth === 'number' ? win.innerWidth : 0;
  return r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;
}

/**
 * 顶层 document + 可达同源 iframe 内文档中的 `<video>`（含 open Shadow）。
 */
function collectVideoElementsFromAccessibleDocuments(rootDoc: Document): HTMLVideoElement[] {
  const out: HTMLVideoElement[] = [];
  forEachAccessibleSameOriginDocument(rootDoc, (doc) => {
    out.push(...collectVideoElementsFromRoots(doc));
  });
  return out;
}

export function captureVideoFrameToDataUrl(
  video: HTMLVideoElement,
  opts?: VideoFrameCaptureOptions,
): string {
  return captureVideoFrameSnapshot(video, opts)?.dataUrl ?? '';
}

function captureVideoFrameSnapshot(
  video: HTMLVideoElement,
  opts?: VideoFrameCaptureOptions,
): CapturedVideoFrame | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null;
  }

  const w = video.videoWidth || video.clientWidth;
  const h = video.videoHeight || video.clientHeight;
  if (!w || !h) return null;
  const longest = Math.max(w, h);
  const maxDim = Math.max(1, Math.floor(opts?.maxDim ?? DEFAULT_VIDEO_CAPTURE_MAX_DIM));
  const quality = Math.min(1, Math.max(0.1, opts?.quality ?? DEFAULT_VIDEO_CAPTURE_QUALITY));
  const scale = longest > maxDim ? maxDim / longest : 1;
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const off = document.createElement('canvas');
  off.width = cw;
  off.height = ch;
  const ctx = off.getContext('2d');
  if (!ctx) return null;
  try {
    ctx.drawImage(video, 0, 0, cw, ch);
    const analysis = analyzeCurrentVideoFrame(video);
    return analysis
      ? { dataUrl: off.toDataURL('image/jpeg', quality), ...analysis }
      : { dataUrl: off.toDataURL('image/jpeg', quality) };
  } catch (err) {
    console.debug('[PromptHub] video frame capture tainted', err);
    return null;
  }
}

function analyzeCurrentVideoFrame(
  video: HTMLVideoElement,
): Pick<CapturedVideoFrame, 'signature' | 'contrast' | 'sharpness'> | undefined {
  try {
    const c = document.createElement('canvas');
    c.width = FRAME_ANALYSIS_DIM;
    c.height = FRAME_ANALYSIS_DIM;
    const ctx = c.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(video, 0, 0, FRAME_ANALYSIS_DIM, FRAME_ANALYSIS_DIM);
    const data = ctx.getImageData(0, 0, FRAME_ANALYSIS_DIM, FRAME_ANALYSIS_DIM).data;
    const gray: number[] = [];
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const g = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
      gray.push(g);
      sum += g;
    }
    if (gray.length === 0) return undefined;
    const avg = sum / gray.length;
    let variance = 0;
    for (const g of gray) variance += (g - avg) ** 2;
    const contrast = Math.sqrt(variance / gray.length);

    let diffSum = 0;
    let diffCount = 0;
    for (let y = 0; y < FRAME_ANALYSIS_DIM; y += 1) {
      for (let x = 0; x < FRAME_ANALYSIS_DIM; x += 1) {
        const idx = y * FRAME_ANALYSIS_DIM + x;
        if (x + 1 < FRAME_ANALYSIS_DIM) {
          diffSum += Math.abs(gray[idx]! - gray[idx + 1]!);
          diffCount += 1;
        }
        if (y + 1 < FRAME_ANALYSIS_DIM) {
          diffSum += Math.abs(gray[idx]! - gray[idx + FRAME_ANALYSIS_DIM]!);
          diffCount += 1;
        }
      }
    }
    const sharpness = diffCount > 0 ? diffSum / diffCount : 0;
    const signature = gray.map((g) => (g >= avg ? '1' : '0')).join('');
    return { signature, contrast, sharpness };
  } catch {
    return undefined;
  }
}

export function collectVideoElementsFromRoots(top: Document | ShadowRoot): HTMLVideoElement[] {
  const out: HTMLVideoElement[] = [];
  let seenMedia = 0;
  let hostScan = 0;

  const visitRoot = (root: Document | ShadowRoot): void => {
    root.querySelectorAll('video').forEach((el) => {
      if (!(el instanceof HTMLVideoElement)) return;
      if (seenMedia >= RECT_HIT_MAX_NODES) return;
      seenMedia += 1;
      out.push(el);
    });

    if (seenMedia >= RECT_HIT_MAX_NODES) return;

    for (const host of root.querySelectorAll('*')) {
      if (hostScan >= HOST_SCAN_LIMIT || seenMedia >= RECT_HIT_MAX_NODES) return;
      hostScan += 1;
      const sr = host.shadowRoot;
      if (sr?.mode !== 'open') continue;
      visitRoot(sr);
    }
  };

  visitRoot(top);
  return out;
}

/**
 * 视口内、尺寸足够的 `<video>` 列表（与右键矩形命中观感一致）。
 */
export function listViewportVideos(): HTMLVideoElement[] {
  const all = collectVideoElementsFromAccessibleDocuments(document);
  return all.filter((v) => {
    const r = v.getBoundingClientRect();
    if (r.width < RECT_HIT_MIN_EDGE || r.height < RECT_HIT_MIN_EDGE) return false;
    if (!isRoughlyInViewportForElement(v, r)) return false;
    const area = rectArea(r);
    return area >= RECT_HIT_MIN_EDGE * RECT_HIT_MIN_EDGE;
  });
}

/** 在视口视频列表中查找元素序号；未命中返回 -1。 */
export function findViewportVideoIndex(video: HTMLVideoElement): number {
  return listViewportVideos().indexOf(video);
}

function formatDurationLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '?';

  try {
    // 避免出现 599.994s 这一类过长小数
    if (seconds >= 3600 * 48) return '很长';
    if (seconds < 60) return `${seconds.toFixed(2).replace(/\.?0+$/, '')}s`;

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m${String(s).padStart(2, '0')}s`;
  } catch {
    return '?';
  }
}

const VIDEO_TITLE_MAX_LEN = 48;
const MIN_ANCESTOR_LABEL_LEN = 3;
const MAX_ANCESTOR_DEPTH = 6;

const SD_ARROW_SVG =
  '<svg class="sd-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export interface ViewportVideoMeta {
  index: number;
  title: string;
  width: number;
  height: number;
  durationLabel: string;
}

function escapeTextHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncateVideoTitle(s: string): string {
  const t = s.trim();
  if (t.length <= VIDEO_TITLE_MAX_LEN) return t;
  return `${t.slice(0, VIDEO_TITLE_MAX_LEN - 1)}…`;
}

function isMeaningfulUrlBasename(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower !== 'blob' && lower !== 'index' && lower !== 'video' && lower !== 'stream';
}

/** 从 video 元素及其 DOM 上下文推断可读标题。 */
export function inferVideoDisplayTitle(video: HTMLVideoElement, index: number): string {
  const direct = video.title?.trim() || video.getAttribute('aria-label')?.trim();
  if (direct) return truncateVideoTitle(direct);

  const fig = video.closest('figure');
  const caption = fig?.querySelector('figcaption')?.textContent?.trim();
  if (caption) return truncateVideoTitle(caption);

  let el: Element | null = video.parentElement;
  for (let depth = 0; el && depth < MAX_ANCESTOR_DEPTH; depth += 1, el = el.parentElement) {
    const label = el.getAttribute('aria-label')?.trim() || el.getAttribute('title')?.trim();
    if (label && label.length >= MIN_ANCESTOR_LABEL_LEN) return truncateVideoTitle(label);
  }

  const src = video.currentSrc || video.src;
  if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
    try {
      const base = video.ownerDocument?.baseURI ?? undefined;
      const pathname = new URL(src, base).pathname;
      const raw = decodeURIComponent(pathname.split('/').pop() || '');
      const name = raw.replace(/\.[^.]+$/, '');
      if (isMeaningfulUrlBasename(name)) return truncateVideoTitle(name);
    } catch {
      // ignore malformed URL
    }
  }

  return `视频 ${index + 1}`;
}

export function listViewportVideoMetas(): ViewportVideoMeta[] {
  return listViewportVideos().map((v, i) => ({
    index: i,
    title: inferVideoDisplayTitle(v, i),
    width: v.videoWidth || 0,
    height: v.videoHeight || 0,
    durationLabel: formatDurationLabel(v.duration),
  }));
}

function formatVideoMetaLine(meta: ViewportVideoMeta): string {
  return `${meta.index + 1} · ${meta.width}×${meta.height} · ${meta.durationLabel}`;
}

export function formatVideoPickerTriggerLabel(meta: ViewportVideoMeta): string {
  return `${meta.title} · ${meta.width}×${meta.height} · ${meta.durationLabel}`;
}

export function getVideoPickerTriggerLabel(index: number): string {
  const meta = listViewportVideoMetas()[index];
  if (!meta) return '无页面内视频';
  return formatVideoPickerTriggerLabel(meta);
}

/**
 * 供 compose 模板渲染自定义视频下拉（value 为 0-based 序号）。
 */
export function composeVideoPickerHtml(selectedIndex = 0): string {
  const metas = listViewportVideoMetas();
  if (metas.length === 0) {
    return `
    <div class="strategy-dropdown compose-video-dropdown is-disabled" data-role="video-seg-picker-dropdown" aria-label="选择页面视频">
      <input type="hidden" data-role="video-seg-picker-value" value="" disabled />
      <button class="sd-trigger" type="button" disabled>
        <span class="sd-label">无页面内视频</span>
        ${SD_ARROW_SVG}
      </button>
      <ul class="sd-menu"></ul>
    </div>`;
  }

  const clampedIndex = Math.min(Math.max(0, selectedIndex), metas.length - 1);
  const current = metas[clampedIndex]!;

  const items = metas
    .map((m) => {
      const active = m.index === clampedIndex ? ' active' : '';
      return `<li class="sd-item${active}" data-video-index="${m.index}" role="option">
        <span class="sd-item-title">${escapeTextHtml(m.title)}</span>
        <span class="sd-item-meta">${escapeTextHtml(formatVideoMetaLine(m))}</span>
      </li>`;
    })
    .join('');

  return `
    <div class="strategy-dropdown compose-video-dropdown" data-role="video-seg-picker-dropdown" aria-label="选择页面视频">
      <input type="hidden" data-role="video-seg-picker-value" value="${clampedIndex}" />
      <button class="sd-trigger" type="button" aria-haspopup="listbox">
        <span class="sd-label">${escapeTextHtml(formatVideoPickerTriggerLabel(current))}</span>
        ${SD_ARROW_SVG}
      </button>
      <ul class="sd-menu" role="listbox">${items}</ul>
    </div>`;
}

export function resolveViewportVideoAtIndex(idx: number): HTMLVideoElement | undefined {
  const vids = listViewportVideos();
  if (idx < 0 || idx >= vids.length) return undefined;
  return vids[idx];
}

function clampTimeToFiniteDuration(t: number, duration: number): number {
  if (!Number.isFinite(t)) return t;
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, t);
  return Math.min(Math.max(0, t), duration);
}

/**
 * open 区间的均匀采样时间点（含首尾），长度为 `frameCount`，至少 2 个。
 */
export function uniformSampleTimes(startSec: number, endSec: number, frameCount: number): number[] {
  const n = Math.max(2, Math.floor(frameCount));
  const span = endSec - startSec;
  if (span <= 0 || !Number.isFinite(span)) return [startSec, endSec];

  const out: number[] = [];
  if (n === 1) return [startSec];

  for (let i = 0; i < n; i += 1) {
    const t = startSec + (span * i) / (n - 1);
    out.push(t);
  }
  return out;
}

function isLowInformationFrame(frame: VideoFrameCandidateForSelection): boolean {
  if (frame.contrast == null || frame.sharpness == null) return false;
  return frame.contrast < LOW_CONTRAST_THRESHOLD || frame.sharpness < LOW_SHARPNESS_THRESHOLD;
}

function hammingDistance(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let d = Math.abs(a.length - b.length);
  for (let i = 0; i < n; i += 1) {
    if (a[i] !== b[i]) d += 1;
  }
  return d;
}

function isNearDuplicateFrame(
  frame: VideoFrameCandidateForSelection,
  others: readonly VideoFrameCandidateForSelection[],
): boolean {
  if (!frame.signature) return false;
  return others.some(
    (o) =>
      !!o.signature &&
      o.signature.length === frame.signature!.length &&
      hammingDistance(o.signature, frame.signature!) <= NEAR_DUPLICATE_HAMMING_THRESHOLD,
  );
}

function pickEvenlyByTime<T>(items: readonly T[], limit: number): T[] {
  if (limit <= 0 || items.length === 0) return [];
  if (items.length <= limit) return [...items];
  if (limit === 1) return [items[Math.floor(items.length / 2)]!];

  const out: T[] = [];
  const last = items.length - 1;
  const seen = new Set<number>();
  for (let i = 0; i < limit; i += 1) {
    const idx = Math.round((last * i) / (limit - 1));
    if (seen.has(idx)) continue;
    seen.add(idx);
    out.push(items[idx]!);
  }
  return out;
}

export function selectVideoFrameCandidates(
  candidates: readonly VideoFrameCandidateForSelection[],
  maxFrames = MAX_REFERENCE_IMAGES,
): VideoFrameCandidateForSelection[] {
  const cap = Math.min(MAX_REFERENCE_IMAGES, Math.max(2, Math.floor(maxFrames)));
  const sorted = [...candidates].sort((a, b) => a.timeSec - b.timeSec);
  if (sorted.length <= 1) return sorted;

  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const endpoints = first === last ? [first] : [first, last];
  const middle = sorted.slice(1, -1);
  const keptMiddle: VideoFrameCandidateForSelection[] = [];

  for (const frame of middle) {
    if (isLowInformationFrame(frame)) continue;
    if (isNearDuplicateFrame(frame, [...endpoints, ...keptMiddle])) continue;
    keptMiddle.push(frame);
  }

  const middleSlots = Math.max(0, cap - endpoints.length);
  const selected = [
    first,
    ...pickEvenlyByTime(keptMiddle, middleSlots),
    ...(last === first ? [] : [last]),
  ].sort((a, b) => a.timeSec - b.timeSec);

  return selected.slice(0, cap);
}

async function seekVideoTo(video: HTMLVideoElement, t: number): Promise<void> {
  const view = video.ownerDocument?.defaultView ?? window;
  const target = Number.isFinite(t) ? Math.max(0, t) : 0;

  if (Math.abs(video.currentTime - target) < 1e-4) {
    await new Promise<void>((resolve) => view.requestAnimationFrame(() => resolve()));
    return;
  }

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    const onSeeked = () => finish();

    video.addEventListener('seeked', onSeeked, { passive: true });
    try {
      video.currentTime = target;
    } catch {
      finish();
      return;
    }

    view.setTimeout(finish, SEEK_TIMEOUT_MS);
  });

  await new Promise<void>((resolve) => view.requestAnimationFrame(() => resolve()));
}

interface PlaybackSnapshot {
  currentTime: number;
  paused: boolean;
}

async function pauseForSampling(video: HTMLVideoElement): Promise<PlaybackSnapshot> {
  const view = video.ownerDocument?.defaultView ?? window;
  const snap: PlaybackSnapshot = {
    currentTime: video.currentTime,
    paused: video.paused,
  };
  if (!snap.paused) {
    try {
      video.pause();
    } catch {
      /* ignore */
    }
    await new Promise<void>((resolve) => view.requestAnimationFrame(() => resolve()));
  }
  return snap;
}

function restorePlayback(video: HTMLVideoElement, snap: PlaybackSnapshot): void {
  try {
    video.currentTime = snap.currentTime;
  } catch {
    /* ignore */
  }

  try {
    if (!snap.paused) {
      void video.play().catch(() => undefined);
    } else if (!video.paused) {
      video.pause();
    }
  } catch {
    /* ignore */
  }
}

const MIN_SEGMENT_SPAN = 1 / 240;

export interface SampleVideoSegmentResult {
  frames: string[];
  startSec: number;
  endSec: number;
  /** 与 `frames` 等长的采样时间点（秒），按播放时间递增 */
  frameTimesSec: number[];
}

/**
 * Seek 区间内均匀抓取 JPEG；返回实际用于采样的时间与 dataURL 列表（按时间递增）。
 *
 * `maxFrames` 默认等同参考图上限；至少 2 帧。
 */
export async function sampleVideoSegmentJPEGs(
  video: HTMLVideoElement,
  rawStartSec: number,
  rawEndSec: number,
  opts?: { maxFrames?: number; candidateFrames?: number },
): Promise<SampleVideoSegmentResult> {
  let startSec = rawStartSec;
  let endSec = rawEndSec;

  if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) {
    throw new Error('起始秒 / 结束秒必须是有效数字');
  }

  const duration =
    Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Infinity;

  startSec = Math.max(0, startSec);
  endSec = Math.max(0, endSec);

  if (Number.isFinite(duration)) {
    startSec = clampTimeToFiniteDuration(startSec, duration);
    endSec = clampTimeToFiniteDuration(endSec, duration);
  }

  if (endSec - startSec < MIN_SEGMENT_SPAN) {
    throw new Error('时间段太短，请输入有效的起止秒且起始 < 结束');
  }

  if (startSec >= endSec) {
    throw new Error('起始秒必须小于结束秒');
  }

  const maxFrames = Math.min(
    MAX_REFERENCE_IMAGES,
    Math.max(2, opts?.maxFrames ?? MAX_REFERENCE_IMAGES),
  );
  const candidateFrames = Math.min(
    MAX_VIDEO_SEGMENT_CANDIDATES,
    Math.max(maxFrames, opts?.candidateFrames ?? maxFrames * 2),
  );

  const times = uniformSampleTimes(startSec, endSec, candidateFrames);
  const snap = await pauseForSampling(video);

  const candidates: VideoFrameCandidateForSelection[] = [];

  try {
    for (const t of times) {
      await seekVideoTo(video, t);
      const captured = captureVideoFrameSnapshot(video);
      if (!captured?.dataUrl) {
        throw new Error(
          '无法抓取该视频画面（可能没有解码画面，或跨域导致 canvas 被污染）；请换一个视频源或勾选允许跨域的媒体。',
        );
      }

      candidates.push({ ...captured, timeSec: t });
    }

    const selected = selectVideoFrameCandidates(candidates, maxFrames);
    const frames = selected.map((frame) => frame.dataUrl);

    if (frames.length < 2) {
      throw new Error('抓取到的有效帧过少，无法描述片段；请换时间段或稍后重试。');
    }

    /** 首尾时间用于提示词文案（与用户输入一致或可读的 clamp 后区间）*/
    const outStart = selected[0]!.timeSec;
    const outEnd = selected[selected.length - 1]!.timeSec;

    return {
      frames,
      startSec: outStart,
      endSec: outEnd,
      frameTimesSec: selected.map((frame) => frame.timeSec),
    };
  } finally {
    restorePlayback(video, snap);
  }
}
