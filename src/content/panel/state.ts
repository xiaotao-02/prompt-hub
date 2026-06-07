/**
 * 浮动面板的运行时状态。
 *
 * 这些是 content script 模块内的单例状态：
 * - host / shadow / panel：DOM 节点引用
 * - currentState：当前面板状态快照
 * - loadingTickHandle：loading 状态下"已用时"刷新的 setInterval 句柄
 *
 * 使用 `export let` + 显式 setter 函数模式，
 * 让所有子模块都能读到同一份单例，避免重复挂载 Shadow DOM。
 */
import type {
  ExtractStage,
  OneClickRefineRandomness,
  OutputStyle,
  PromptVersion,
  RefineStage,
  StrategyId,
  StreamDeliveryMode,
  VideoSegmentMeta,
} from '@/lib/types';
import {
  defaultVideoSegmentRange,
  resolveViewportVideoAtIndex,
} from '@/content/videoSegmentSample';
import { pickRefineJobForUi } from '@/lib/refineProgressUi';

/** 浮动面板并行「一键洗稿 / AI 调整」任务 */
export interface PanelRefineJob {
  jobId: string;
  kind: 'oneClick' | 'instructed';
  stage?: RefineStage;
  partial?: string;
  streamMode?: StreamDeliveryMode;
  startedAt: number;
  refineBaselinePrompt: string;
  refineInstructionSnapshot?: string;
}

/** 浮动面板并行「重新生成」反推任务 */
export interface PanelExtractJob {
  streamRequestId: string;
  stage?: ExtractStage;
  partial?: string;
  streamMode?: StreamDeliveryMode;
  startedAt: number;
}

export const MAX_PARALLEL_PANEL_REFINES = 8;
export const MAX_PARALLEL_PANEL_EXTRACTS = 8;

export interface PanelState {
  /** 本次会话用于路由 EXTRACT_* 消息的 id；同图合并后可能与库 id 不同，见 {@link prefetchStorageId}。 */
  sessionRequestId: string;
  /** 主参考图 URL，等于 {@link imageUrls}[0]（若有）。 */
  imageUrl: string;
  /** 有序参考图列表（至少 1 张方能「生成」）。 */
  imageUrls: string[];
  status: 'compose' | 'loading' | 'success' | 'error';
  prompt?: string;
  error?: string;
  provider?: string;
  model?: string;
  /** 当前展示的版本快照；为空表示尚未与 storage 同步 */
  versions?: PromptVersion[];
  /**
   * 提示词库里已存在的记录 id（预取命中同图时由 HISTORY_PREFETCH 填入）。
   * 在 HISTORY_READY 把 sessionRequestId 切到 persistedHistoryId 之前，读写库应优先使用本字段。
   */
  prefetchStorageId?: string;
  /** 是否展开历史面板 */
  versionsOpen?: boolean;
  /** textarea 当前编辑值（脏值），与 prompt 不同则视为已编辑 */
  draft?: string;
  /**
   * 侧栏中高亮对应的版本 id（用户点击选中）。用于多条历史 prompt 文本相同时仍能
   * 区分高亮条；编辑器 input 会与 canonical prompt 对齐时清理该字段。
   */
  selectedVersionId?: string;
  /** 是否展开"AI 调整"输入区 */
  refineOpen?: boolean;
  /** 并行 AI 调整 / 一键洗稿任务 */
  refineJobs?: PanelRefineJob[];
  /** 并行重新生成（反推）任务 */
  extractJobs?: PanelExtractJob[];
  /** 调整失败信息（并行时记录最近一次失败文案） */
  refineError?: string;
  /** AI 调整输入框的内容（不在每次按键重渲染，仅在重新渲染时回填） */
  refineInstruction?: string;
  /**
   * 反推进度阶段。loading 状态下用来切换"下载图片 / 调用模型 / 接收回复"
   * 三段文案，success/error 时被清成 undefined。
   */
  stage?: ExtractStage;
  /** 流式阶段累积到的提示词文本（loading 时实时显示）。 */
  partial?: string;
  /** 端点实际交付方式；`buffered` 表示未返回 SSE */
  streamMode?: StreamDeliveryMode;
  /**
   * 历史上用于「重新生成」loading 时在首段 partial 到达前回填主编辑器；现产品改为先清空主框，
   * 通常不再写入本字段。success/error 后仍会清空。
   */
  extractBaselinePrompt?: string;
  /** loading 开始时间戳，用于 UI 上显示 "已用时 xx s"。 */
  startedAt?: number;
  /**
   * 本次反推使用的「提示词策略档位」id。
   *
   * 由后台在 settings 加载完成后通过 EXTRACT_PENDING / EXTRACT_PROGRESS 透传，
   * 仅用于在 loading 状态下亮一个 "策略：v0.1.5 策略" 之类的标签，
   * 让用户清楚当前生效的是哪一档。后续如果想在 success 状态也显示，
   * 直接复用同一字段即可。
   */
  strategy?: StrategyId;
  /** 本次反推使用的输出格式（与 AppSettings.outputStyle 对齐） */
  outputStyle?: OutputStyle;
  /** 一键洗稿随机强度（与 AppSettings.oneClickRewriteRandomness 对齐） */
  oneClickRefineRandomness?: OneClickRefineRandomness;
  /**
   * 时间段反推元数据（compose「时间段反推」写入；success 态用于分镜大纲导航）。
   * 非视频反推发起时应显式置 undefined 以清空。
   */
  videoSegment?: VideoSegmentMeta;
}

export const HOST_ID = '__image_prompt_extractor_host__';

/**
 * 浮动面板的位置 + 尺寸。
 *
 * - left/top：必填，视口坐标（px）。
 * - width：可选；用户没动过 resize 时为 undefined，让 CSS 默认值生效。
 * - height：可选；同上，默认 auto，由内容决定。
 *
 * 用户拖动 header 时会更新 left/top；用户拖任意边缘 / 角落 resize 时会更新
 * width/height（西/北方向同时会动 left/top 以保持对侧边固定）。
 * 跨 renderPanel 重渲染时这块状态不变，确保面板"哪儿就停哪儿"。
 */
export interface PanelGeometry {
  left: number;
  top: number;
  width?: number;
  height?: number;
  /** 用户通过边缘/角落横向 resize 主动设定宽度后不再自动宽窄切换 */
  widthUserLocked?: boolean;
}

export let host: HTMLDivElement | null = null;
export let shadow: ShadowRoot | null = null;
export let panel: HTMLDivElement | null = null;
export let currentState: PanelState | null = null;
/**
 * loading 状态下每 200ms 跑一次的"已用时"刷新句柄。
 * 只更新 DOM 文本节点，不重渲整片面板，以免抖动。
 */
export let loadingTickHandle: number | null = null;
/**
 * AI 调整中的"已用时"刷新句柄。和 loadingTickHandle 互不重叠 ——
 * loading 状态没有 refine 框，refine 只在 success 状态下出现。
 */
export let refineTickHandle: number | null = null;
/**
 * 当前面板的几何快照。null 表示尚未初始化（首次 ensureHost 时会设上）。
 * 这是模块级单例，跨 renderPanel 重渲染保留。
 */
export let panelGeometry: PanelGeometry | null = null;

export function setHost(v: HTMLDivElement | null) {
  host = v;
}
export function setShadow(v: ShadowRoot | null) {
  shadow = v;
}
export function setPanel(v: HTMLDivElement | null) {
  panel = v;
}
export function setCurrentState(v: PanelState | null) {
  currentState = v;
}
export function setLoadingTickHandle(v: number | null) {
  loadingTickHandle = v;
}
export function setRefineTickHandle(v: number | null) {
  refineTickHandle = v;
}
export function setPanelGeometry(v: PanelGeometry | null) {
  panelGeometry = v;
}

/** compose 面板「收集图片 / 采集视频帧」分段；不写入 PanelState，重渲时保留。 */
export type ComposeCollectMode = 'image' | 'video';

let composeCollectMode: ComposeCollectMode = 'image';

export function getComposeCollectMode(): ComposeCollectMode {
  return composeCollectMode;
}

export function setComposeCollectMode(mode: ComposeCollectMode): void {
  composeCollectMode = mode;
}

export function resetComposeCollectMode(): void {
  composeCollectMode = 'image';
}

/** compose 视频下拉选中序号；重渲时保留，越界时 clamp。 */
let composeSelectedVideoIndex = 0;

export function getComposeSelectedVideoIndex(): number {
  return composeSelectedVideoIndex;
}

export function setComposeSelectedVideoIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0) return;
  composeSelectedVideoIndex = index;
}

export function clampComposeSelectedVideoIndex(videoCount: number): number {
  if (videoCount <= 0) {
    composeSelectedVideoIndex = 0;
    return 0;
  }
  const clamped = Math.min(Math.max(0, composeSelectedVideoIndex), videoCount - 1);
  composeSelectedVideoIndex = clamped;
  return clamped;
}

/** compose 视频片段时间（秒）；不写入 PanelState，重渲时保留。 */
let composeVideoSegStart: number | null = null;
let composeVideoSegEnd: number | null = null;
let composeVideoSegBoundIndex: number | null = null;

export function getComposeVideoSegStart(): number | null {
  return composeVideoSegStart;
}

export function getComposeVideoSegEnd(): number | null {
  return composeVideoSegEnd;
}

export function setComposeVideoSegStart(sec: number | null): void {
  composeVideoSegStart = sec;
}

export function setComposeVideoSegEnd(sec: number | null): void {
  composeVideoSegEnd = sec;
}

export function resetComposeVideoSegment(): void {
  composeVideoSegStart = null;
  composeVideoSegEnd = null;
  composeVideoSegBoundIndex = null;
}

export function applyDefaultComposeVideoSegment(
  videoIndex: number,
  opts?: { force?: boolean },
): void {
  if (
    !opts?.force &&
    composeVideoSegBoundIndex === videoIndex &&
    composeVideoSegStart != null &&
    composeVideoSegEnd != null
  ) {
    return;
  }
  const video = resolveViewportVideoAtIndex(videoIndex);
  if (!video) return;
  const { startSec, endSec } = defaultVideoSegmentRange(video);
  composeVideoSegStart = startSec;
  composeVideoSegEnd = endSec;
  composeVideoSegBoundIndex = videoIndex;
}

export const panelActions = {
  renderPanel: (_state: PanelState): void => {},
  closePanel: (): void => {},
};

/** 从状态取出参考图 URL 列表（兼容仅带 imageUrl 的旧路径）。 */
export function panelReferenceUrls(state: Pick<PanelState, 'imageUrls' | 'imageUrl'>): string[] {
  if (state.imageUrls?.length) return state.imageUrls;
  return state.imageUrl ? [state.imageUrl] : [];
}

export function panelRefineJobs(state: PanelState): PanelRefineJob[] {
  return state.refineJobs ?? [];
}

export function panelExtractJobs(state: PanelState): PanelExtractJob[] {
  return state.extractJobs ?? [];
}

/** 是否存在任意进行中的 refine（并行 jobs） */
export function panelHasActiveRefine(state: PanelState): boolean {
  return panelRefineJobs(state).length > 0;
}

export function panelHasActiveExtractJobs(state: PanelState): boolean {
  return panelExtractJobs(state).length > 0;
}

export function matchesExtractStreamRequest(state: PanelState, streamRequestId: string): boolean {
  return panelExtractJobs(state).some((j) => j.streamRequestId === streamRequestId);
}

/** refine 侧栏进度条：优先当前选中的占位 job，否则第一条 */
export function primaryRefineJobForUi(state: PanelState): PanelRefineJob | undefined {
  return pickRefineJobForUi(panelRefineJobs(state), state.selectedVersionId);
}

/** 读写库记录 id：prefetch 命中后 prefetchStorageId 优先于临时 sessionRequestId */
export function libraryStorageId(state: {
  sessionRequestId: string;
  prefetchStorageId?: string;
}): string {
  return state.prefetchStorageId ?? state.sessionRequestId;
}
