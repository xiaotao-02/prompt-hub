import { safeSendMessage, isExtensionContextValid } from '@/content/extensionBridge';
import type { ExtractFocus, VideoSegmentMeta } from '@/lib/types';
import { resolveViewportVideoAtIndex, sampleVideoSegmentJPEGs } from '@/content/videoSegmentSample';
import { normalizeReferenceList } from '@/lib/referenceImages';
import {
  currentState,
  panel,
  panelReferenceUrls,
  getComposeCollectMode,
  setComposeCollectMode,
  panelExtractJobs,
  MAX_PARALLEL_PANEL_EXTRACTS,
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
  });
  safeSendMessage({
    type: 'EXTRACT_PROMPT',
    payload: {
      imageUrl: urls[0]!,
      imageUrls: urls,
      pageUrl: location.href,
      pageTitle: document.title,
      sessionRequestId: newReq,
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
  for (const a of ['sample-video-segment-to-refs', 'extract-video-segment'] as const) {
    shell
      .querySelector<HTMLButtonElement>(`button[data-action="${a}"]`)
      ?.toggleAttribute('disabled', busy);
  }
}

export function syncComposeCollectModeUi(root: HTMLElement, mode: ComposeCollectMode): void {
  for (const tab of root.querySelectorAll<HTMLButtonElement>('.compose-mode-tab')) {
    const active = tab.dataset.mode === mode;
    tab.setAttribute('aria-selected', String(active));
  }
  const imagePane = root.querySelector<HTMLElement>('.compose-pane-image');
  const videoPane = root.querySelector<HTMLElement>('.compose-pane-video');
  if (imagePane) imagePane.hidden = mode !== 'image';
  if (videoPane) videoPane.hidden = mode !== 'video';
}

export const handleClose: DataActionHandler = () => {
  closePanel();
};

export const handleComposeSetMode: DataActionHandler = ({ root, el }) => {
  const state = currentState;
  if (!state || state.status !== 'compose') return;
  const mode = el.dataset.mode;
  if (mode !== 'image' && mode !== 'video') return;
  if (mode === getComposeCollectMode()) return;
  setComposeCollectMode(mode);
  syncComposeCollectModeUi(root, mode);
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

export const handleVideoSegment: DataActionHandler = ({ root, el }) => {
  const state = currentState;
  if (!state || state.status !== 'compose') return;
  const action = el.dataset.action;

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
      const { frames, startSec, endSec, frameTimesSec } = await sampleVideoSegmentJPEGs(
        video,
        fields.startSec,
        fields.endSec,
      );

      const segmentMeta: VideoSegmentMeta = { startSec, endSec, frameTimesSec };

      if (action === 'sample-video-segment-to-refs') {
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
        return;
      }

      if (!isExtensionContextValid()) return;

      if (panelExtractJobs(state).length >= MAX_PARALLEL_PANEL_EXTRACTS) {
        alert(
          `并行反推已满（至多 ${MAX_PARALLEL_PANEL_EXTRACTS} 条），请等待进行中任务结束后再试。`,
        );
        return;
      }

      const urlsOnly = normalizeReferenceList(frames);
      if (!urlsOnly.length) {
        alert('采样未得到有效图片帧。');
        return;
      }

      sendComposeExtractPrompt(state, urlsOnly, undefined, segmentMeta);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setComposeVideoSegmentBusy(panel, false);
    }
  })();
};
