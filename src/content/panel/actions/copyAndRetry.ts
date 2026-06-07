import { safeSendMessage, isExtensionContextValid } from '@/content/extensionBridge';
import { normalizeReferenceList } from '@/lib/referenceImages';
import { extractStreamSentinelForJob } from '@/lib/streamVersionSentinels';
import { expandPanelForSidebar } from '../geometry';
import { loadingEditorDisplayedText, successEditorDisplayedText } from '../editorText';
import {
  currentState,
  panelReferenceUrls,
  panelExtractJobs,
  MAX_PARALLEL_PANEL_EXTRACTS,
  type PanelState,
} from '../state';
import { renderPanelFromState } from '../panelRenderBridge';
import { flashCopied, fallbackCopy } from '../copyFeedback';
import type { DataActionHandler } from './types';

export const handleCopy: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state) return;
  const text =
    state.status === 'loading'
      ? loadingEditorDisplayedText(state)
      : state.status === 'success'
        ? successEditorDisplayedText(state)
        : (state.draft ?? state.prompt ?? state.partial ?? '');
  navigator.clipboard
    .writeText(text)
    .then(() => flashCopied(el))
    .catch(() => fallbackCopy(text, el));
};

/** success 态并行追加一次识图反推（侧栏 extract 流式行），使用当前面板 strategy。 */
export function beginPanelReExtractFromSuccess(state: PanelState): boolean {
  const versions = state.versions || [];
  if (state.status !== 'success' || versions.length === 0) return false;
  const urls = normalizeReferenceList(panelReferenceUrls(state));
  if (!urls.length) return false;
  if (panelExtractJobs(state).length >= MAX_PARALLEL_PANEL_EXTRACTS) return false;
  if (!isExtensionContextValid()) return false;

  const streamId = crypto.randomUUID();
  const ej = [...panelExtractJobs(state), { streamRequestId: streamId, startedAt: Date.now() }];
  const wasOpen = state.versionsOpen;
  renderPanelFromState({
    ...state,
    extractJobs: ej,
    selectedVersionId: extractStreamSentinelForJob(streamId),
    versionsOpen: true,
    prefetchStorageId: undefined,
    refineError: undefined,
  });
  if (!wasOpen) expandPanelForSidebar();
  safeSendMessage({
    type: 'EXTRACT_PROMPT',
    payload: {
      imageUrl: urls[0]!,
      imageUrls: urls,
      pageUrl: location.href,
      pageTitle: document.title,
      requestId: streamId,
      ...(state.strategy !== undefined ? { strategyOverride: state.strategy } : {}),
    },
  });
  return true;
}

export const handleRetry: DataActionHandler = () => {
  const state = currentState;
  if (!state || !isExtensionContextValid()) return;
  safeSendMessage({ type: 'PING' });
  const versions = state.versions || [];
  const hasHistory = versions.length > 0;
  const urls = normalizeReferenceList(panelReferenceUrls(state));
  if (!urls.length) return;
  if (panelExtractJobs(state).length >= MAX_PARALLEL_PANEL_EXTRACTS) return;

  const streamId = crypto.randomUUID();

  if (hasHistory && state.status === 'success') {
    beginPanelReExtractFromSuccess(state);
    return;
  }

  if (state.status === 'loading') {
    const ej = [...panelExtractJobs(state), { streamRequestId: streamId, startedAt: Date.now() }];
    renderPanelFromState({
      ...state,
      extractJobs: ej,
      selectedVersionId:
        versions.length > 0 ? extractStreamSentinelForJob(streamId) : state.selectedVersionId,
      versionsOpen: versions.length > 0 ? true : state.versionsOpen,
    });
    safeSendMessage({
      type: 'EXTRACT_PROMPT',
      payload: {
        imageUrl: urls[0]!,
        imageUrls: urls,
        pageUrl: location.href,
        pageTitle: document.title,
        requestId: streamId,
        ...(state.strategy !== undefined ? { strategyOverride: state.strategy } : {}),
      },
    });
    return;
  }

  renderPanelFromState({
    ...state,
    sessionRequestId: streamId,
    extractJobs: [{ streamRequestId: streamId, startedAt: Date.now() }],
    status: 'loading',
    prompt: undefined,
    error: undefined,
    draft: undefined,
    selectedVersionId: hasHistory ? extractStreamSentinelForJob(streamId) : undefined,
    extractBaselinePrompt: undefined,
    stage: 'calling',
    partial: undefined,
    startedAt: Date.now(),
    prefetchStorageId: undefined,
    refineJobs: undefined,
    refineError: undefined,
    refineOpen: false,
  });
  safeSendMessage({
    type: 'EXTRACT_PROMPT',
    payload: {
      imageUrl: urls[0]!,
      imageUrls: urls,
      pageUrl: location.href,
      pageTitle: document.title,
      requestId: streamId,
      ...(state.strategy !== undefined ? { strategyOverride: state.strategy } : {}),
    },
  });
};
