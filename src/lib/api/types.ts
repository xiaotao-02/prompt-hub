/**
 * api 内部共享的类型与回调签名。
 *
 * 这些类型同时被 extract / refine / provider 各实现使用，
 * 抽到独立文件避免循环依赖。
 */
import type {
  AppSettings,
  ExtractFocus,
  ExtractStage,
  OutputStyle,
  ProviderId,
  RefineStage,
  StreamDeliveryMode,
  VideoSegmentMeta,
} from '../types';

export type { StreamDeliveryMode };
import type { FetchedImage } from '../image';

/**
 * 反推过程中的进度事件。stage 表示当前阶段，partial 表示流式阶段已经
 * 累积到的提示词文本（每一条都是"到目前为止的全文"，不是 delta）。
 */
export interface ExtractProgressEvent {
  stage: ExtractStage;
  partial?: string;
  streamMode?: StreamDeliveryMode;
}

export type ExtractProgressFn = (ev: ExtractProgressEvent) => void;

/**
 * AI 调整（refine）过程中的进度事件。和反推共用相同的 partial 语义
 * （累计全文，不是 delta），只是阶段集更小（calling / streaming）。
 */
export interface RefineProgressEvent {
  stage: RefineStage;
  partial?: string;
  streamMode?: StreamDeliveryMode;
}

export type RefineProgressFn = (ev: RefineProgressEvent) => void;

export interface ExtractParams {
  /** 有序参考图 URL 列表，至少 1 张 */
  imageUrls: string[];
  settings: AppSettings;
  /**
   * 调用方提前下载/规整好的图片。如果传了且长度与 imageUrls 一致，extractPrompt 会跳过内部的
   * {@link import('../image').fetchImageAsBase64}，直接用这份预处理结果——用来在
   * background 里把图片下载和 settings 读取、content script 注入并行起来，节
   * 省一次串行等待。
   */
  prefetched?: FetchedImage[];
  /**
   * 反推进度回调。流式阶段会被节流到约 80ms 一次，避免给 content script
   * 发太多 chrome.tabs.sendMessage。回调里抛错不影响主流程。
   */
  onProgress?: ExtractProgressFn;
  /** 面板收窄关注点：材质或画风（与运行时 EXTRACT_PROMPT.payload.extractFocus 一致） */
  extractFocus?: ExtractFocus;
  /** 与运行时 EXTRACT_PROMPT.payload.videoSegment 一致（时间段反推 / 分镜锚点） */
  videoSegment?: VideoSegmentMeta;
  /** 可选：限制 API fetch 时长（background 注入 extract 超时 signal） */
  signal?: AbortSignal;
}

export interface ExtractResult {
  prompt: string;
  provider: ProviderId;
  model: string;
  style: OutputStyle;
}

export interface RefineParams {
  settings: AppSettings;
  current: string;
  instruction: string;
  /**
   * 调整进度回调。和反推一样，流式阶段会被节流到约 80ms 一次。
   * 调用方（background）通过它把 stage / partial / streamMode 转发给 panel。
   * 不传则不在 UI 展示进度，但 API 层仍始终请求流式。
   */
  onProgress?: RefineProgressFn;
}

export interface RefineResult {
  prompt: string;
  provider: ProviderId;
  model: string;
}

/** 安全调用 onProgress：回调里抛错不影响主流程。 */
export function safeProgress(
  onProgress: ExtractProgressFn | undefined,
  ev: ExtractProgressEvent,
): void {
  if (!onProgress) return;
  try {
    onProgress(ev);
  } catch (err) {
    console.debug('[PromptHub] onProgress threw', err);
  }
}

/** safeProgress 的 refine 版，签名不同（stage 取值范围更窄），逻辑一致。 */
export function safeRefineProgress(
  onProgress: RefineProgressFn | undefined,
  ev: RefineProgressEvent,
): void {
  if (!onProgress) return;
  try {
    onProgress(ev);
  } catch (err) {
    console.debug('[PromptHub] refine onProgress threw', err);
  }
}

/** 端点未返回 SSE、退化为 JSON 一次性解析时的 extract 进度通知。 */
export function emitBufferedExtractProgress(
  onProgress: ExtractProgressFn | undefined,
  partial?: string,
): void {
  safeProgress(onProgress, {
    stage: 'streaming',
    streamMode: 'buffered',
    ...(partial !== undefined ? { partial } : {}),
  });
}

/** 端点未返回 SSE、退化为 JSON 一次性解析时的 refine 进度通知。 */
export function emitBufferedRefineProgress(
  onProgress: RefineProgressFn | undefined,
  partial?: string,
): void {
  safeRefineProgress(onProgress, {
    stage: 'streaming',
    streamMode: 'buffered',
    ...(partial !== undefined ? { partial } : {}),
  });
}

/** 过短文本不做打字机动画，直接一次性揭示。 */
const REVEAL_SHORT_TEXT_MAX_LEN = 12;
const REVEAL_MAX_FRAMES = 30;
const REVEAL_MAX_MS = 1500;
const REVEAL_MIN_FRAME_MS = 40;
const REVEAL_MAX_FRAME_MS = 60;

function sleepForReveal(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * 将已拿到的完整文本按前缀逐帧回调，模拟流式揭示（用于 buffered 降级）。
 * 帧间隔与总帧数受上限约束，避免 tabs.sendMessage 过密。
 */
export async function simulateStreamReveal(
  final: string,
  emitPartial: (partial: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!final.length || final.length <= REVEAL_SHORT_TEXT_MAX_LEN) {
    emitPartial(final);
    return;
  }

  const frameCount = Math.min(REVEAL_MAX_FRAMES, Math.max(2, Math.ceil(final.length / 8)));
  const frameMs = Math.min(
    REVEAL_MAX_FRAME_MS,
    Math.max(REVEAL_MIN_FRAME_MS, Math.floor(REVEAL_MAX_MS / frameCount)),
  );

  for (let i = 1; i <= frameCount; i++) {
    if (signal?.aborted) return;
    const isLast = i === frameCount;
    const end = isLast ? final.length : Math.max(1, Math.floor((i / frameCount) * final.length));
    emitPartial(final.slice(0, end));
    if (!isLast) await sleepForReveal(frameMs, signal);
  }
}

/** buffered 降级：在已 emit 首帧提示后，用打字机效果逐字揭示完整结果。 */
export async function revealBufferedExtractProgress(
  onProgress: ExtractProgressFn | undefined,
  final: string,
  signal?: AbortSignal,
): Promise<void> {
  if (!onProgress) return;
  await simulateStreamReveal(
    final,
    (partial) => emitBufferedExtractProgress(onProgress, partial),
    signal,
  );
}

/** refine 版 buffered 模拟揭示。 */
export async function revealBufferedRefineProgress(
  onProgress: RefineProgressFn | undefined,
  final: string,
): Promise<void> {
  if (!onProgress) return;
  await simulateStreamReveal(final, (partial) => emitBufferedRefineProgress(onProgress, partial));
}
