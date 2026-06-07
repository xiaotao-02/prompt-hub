import { safeSendMessage, isExtensionContextValid } from '@/content/extensionBridge';
import type { ExtractFocus, VideoSegmentMeta } from '@/lib/types';
import {
  resolveViewportVideoAtIndex,
  sampleVideoSegmentJPEGs,
  listViewportVideos,
} from '@/content/videoSegmentSample';
import { normalizeReferenceList } from '@/lib/referenceImages';
import {
  currentState,
  panel,
  panelReferenceUrls,
  getComposeCollectMode,
  setComposeCollectMode,
  clampComposeSelectedVideoIndex,
  applyDefaultComposeVideoSegment,
  type PanelState,
  type ComposeCollectMode,
} from '../state';
import { closePanel, renderPanelFromState } from '../panelRenderBridge';
import type { DataActionHandler } from './types';

/** compose 态发起反推：转入 loading 并发 EXTRACT_PROMPT（可选材质/风格收窄、时间段元数据）。 */
export function sendComposeExtractPrompt(
  state: PanelState,
  urls: string[],
  extractFocus?: ExtractFocus,
  videoSegment?: VideoSegmentMeta,
): void {
  const newReq = crypto.randomUUID();
  renderPanelFromState({
    ...state,
    sessionRequestId: newReq,
    extractJobs: [{ streamRequestId: newReq, startedAt: Date.now() }],
    status: 'loading',
    stage: 'calling',
    startedAt: Date.now(),
    prompt: undefined,
    error: undefined,
    draft: undefined,
    selectedVersionId: undefined,
    partial: undefined,
    extractBaselinePrompt: undefined,
    prefetchStorageId: undefined,
    versions: undefined,
    versionsOpen: false,
    refineOpen: false,
    refineJobs: undefined,
    refineError: undefined,
    videoSegment,
  });
  safeSendMessage({
    type: 'EXTRACT_PROMPT',
    payload: {
      imageUrl: urls[0]!,
      imageUrls: urls,
      pageUrl: location.href,
      pageTitle: document.title,
      requestId: newReq,
      ...(state.strategy !== undefined ? { strategyOverride: state.strategy } : {}),
      ...(extractFocus ? { extractFocus } : {}),
      ...(videoSegment ? { videoSegment } : {}),
    },
  });
}

function readComposeSegmentFields(root: HTMLElement): {
  startSec: number;
  endSec: number;
  videoIndex: number;
} | null {
  const dropdown = root.querySelector<HTMLElement>('[data-role="video-seg-picker-dropdown"]');
  const hidden = root.querySelector<HTMLInputElement>('[data-role="video-seg-picker-value"]');
  const iStart = root.querySelector<HTMLInputElement>('[data-role="video-seg-start"]');
  const iEnd = root.querySelector<HTMLInputElement>('[data-role="video-seg-end"]');
  if (!dropdown || dropdown.classList.contains('is-disabled') || !hidden) {
    alert('当前页面视口内没有可用的视频元素。');
    return null;
  }
  if (!iStart || !iEnd) return null;

  const startSec = Number.parseFloat(iStart.value);
  const endSec = Number.parseFloat(iEnd.value);
  const videoIndex = Number.parseInt(hidden.value, 10);

  if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) {
    alert('请输入有效的起始秒与结束秒（十进制小数可用）。');
    return null;
  }
  if (!Number.isInteger(videoIndex) || videoIndex < 0) {
    alert('请先选择页面中要采样的视频。');
    return null;
  }

  return { startSec, endSec, videoIndex };
}

function setComposeVideoSegmentBusy(shell: HTMLElement | null | undefined, busy: boolean): void {
  if (!shell) return;
  for (const a of ['sample-video-segment-to-refs'] as const) {
    shell
      .querySelector<HTMLButtonElement>(`button[data-action="${a}"]`)
      ?.toggleAttribute('disabled', busy);
  }
}

export function syncComposeCollectModeUi(root: HTMLElement, mode: ComposeCollectMode): void {
  const hasVideos = listViewportVideos().length > 0;
  const effectiveMode = hasVideos ? mode : 'image';
  for (const tab of root.querySelectorAll<HTMLButtonElement>('.compose-mode-tab')) {
    const active = tab.dataset.mode === effectiveMode;
    tab.setAttribute('aria-selected', String(active));
  }
  const imagePane = root.querySelector<HTMLElement>('.compose-pane-image');
  const videoPane = root.querySelector<HTMLElement>('.compose-pane-video');
  if (imagePane) imagePane.hidden = effectiveMode !== 'image';
  if (videoPane && hasVideos) videoPane.hidden = effectiveMode !== 'video';
}

export const handleClose: DataActionHandler = () => {
  closePanel();
};

export const handleComposeSetMode: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state || state.status !== 'compose') return;
  const mode = el.dataset.mode;
  if (mode !== 'image' && mode !== 'video') return;
  if (mode === getComposeCollectMode()) return;
  if (mode === 'video' && listViewportVideos().length === 0) return;
  setComposeCollectMode(mode);
  if (mode === 'video') {
    applyDefaultComposeVideoSegment(clampComposeSelectedVideoIndex(listViewportVideos().length));
  }
  renderPanelFromState(state);
};

export const handleRunExtract: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state || state.status !== 'compose') return;
  const action = el.dataset.action;
  const urls = normalizeReferenceList(panelReferenceUrls(state));
  if (!urls.length || !isExtensionContextValid()) return;
  safeSendMessage({ type: 'PING' });
  const extractFocus: ExtractFocus | undefined =
    action === 'run-extract-material'
      ? 'material'
      : action === 'run-extract-style'
        ? 'style'
        : undefined;
  sendComposeExtractPrompt(state, urls, extractFocus);
};

export const handleVideoSegment: DataActionHandler = ({ root }) => {
  const state = currentState;
  if (!state || state.status !== 'compose') return;

  const fields = readComposeSegmentFields(root);
  if (!fields) return;

  const video = resolveViewportVideoAtIndex(fields.videoIndex);
  if (!video) {
    alert('未找到所选视频（页面布局可能已变化），请关上悬浮窗后再打开重试。');
    return;
  }

  safeSendMessage({ type: 'PING' });

  void (async () => {
    setComposeVideoSegmentBusy(panel, true);
    try {
      const { frames } = await sampleVideoSegmentJPEGs(video, fields.startSec, fields.endSec);

      const prev = panelReferenceUrls(state);
      const merged = normalizeReferenceList([...prev, ...frames]);
      const added = merged.length - prev.length;
      if (added <= 0) {
        alert(
          '没有加入新的采样帧（参考已满 8 张，或采样结果与现有参考重复）。请删减参考图或清空后再采样。',
        );
        return;
      }
      renderPanelFromState({
        ...state,
        imageUrls: merged,
        imageUrl: merged[0] || state.imageUrl,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setComposeVideoSegmentBusy(panel, false);
    }
  })();
};
