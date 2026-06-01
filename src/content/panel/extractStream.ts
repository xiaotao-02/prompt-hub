/**
 * 反推流式消息 → panelReducer → 渲染。
 * 从 panel/index 拆出，集中 reducer 驱动的 extract 状态迁移。
 */
import type { ExtractStage, OneClickRefineRandomness, StrategyId } from '@/lib/types';
import { extractStreamSentinelForJob } from '@/lib/streamVersionSentinels';
import { normalizeReferenceList } from '@/lib/referenceImages';
import {
  currentState,
  matchesExtractStreamRequest,
  panel,
  panelExtractJobs,
  setCurrentState,
} from './state';
import { panelReducer } from './panelReducer';
import { applyLoadingPatch, manageLoadingStallWatchdog, manageLoadingTicker } from './loading';
import { syncVersions } from './versionsSync';
import {
  clearPendingAppendReferenceQueue,
  mergePendingAppendUrlsInto,
} from './pendingReferenceQueue';
import { renderPanel } from './index';

export function renderPanelForExtractPending(payload: {
  sessionRequestId: string;
  imageUrl: string;
  imageUrls?: string[];
  strategy?: StrategyId;
  oneClickRefineRandomness?: OneClickRefineRandomness;
}): void {
  const urls = normalizeReferenceList(
    payload.imageUrls?.length ? payload.imageUrls : [payload.imageUrl],
  );
  const primary = urls[0] || payload.imageUrl;
  const prev = currentState;
  const sid = payload.sessionRequestId;

  if (prev != null && matchesExtractStreamRequest(prev, sid)) {
    const ej = panelExtractJobs(prev).map((j) =>
      j.streamRequestId === sid
        ? { ...j, startedAt: Date.now(), stage: 'calling' as const, partial: undefined }
        : j,
    );
    renderPanel({
      ...prev,
      imageUrl: primary,
      imageUrls: urls,
      extractJobs: ej,
      strategy: payload.strategy ?? prev.strategy,
      oneClickRefineRandomness: payload.oneClickRefineRandomness ?? prev.oneClickRefineRandomness,
      prefetchStorageId: undefined,
    });
    return;
  }

  if (prev != null && prev.sessionRequestId === sid) {
    const versions = prev.versions || [];
    const hasHistory = versions.length > 0;
    renderPanel({
      ...prev,
      sessionRequestId: sid,
      imageUrl: primary,
      imageUrls: urls,
      extractJobs: [{ streamRequestId: sid, startedAt: Date.now() }],
      status: 'loading',
      stage: 'calling',
      startedAt: Date.now(),
      strategy: payload.strategy ?? prev.strategy,
      oneClickRefineRandomness: payload.oneClickRefineRandomness ?? prev.oneClickRefineRandomness,
      prompt: undefined,
      error: undefined,
      draft: undefined,
      selectedVersionId: hasHistory ? extractStreamSentinelForJob(sid) : undefined,
      extractBaselinePrompt: undefined,
      partial: undefined,
      refineJobs: undefined,
      refineError: undefined,
      prefetchStorageId: undefined,
    });
    return;
  }

  clearPendingAppendReferenceQueue();

  renderPanel({
    sessionRequestId: sid,
    imageUrl: primary,
    imageUrls: urls,
    extractJobs: [{ streamRequestId: sid, startedAt: Date.now() }],
    status: 'loading',
    stage: 'calling',
    startedAt: Date.now(),
    strategy: payload.strategy,
    oneClickRefineRandomness: payload.oneClickRefineRandomness,
    prefetchStorageId: undefined,
  });
}

export function applyExtractStreamProgress(
  streamRequestId: string,
  patch: {
    stage?: ExtractStage;
    partial?: string;
    streamMode?: import('@/lib/types').StreamDeliveryMode;
    strategy?: StrategyId;
    provider?: string;
    model?: string;
    oneClickRefineRandomness?: OneClickRefineRandomness;
  },
): void {
  const transition = panelReducer(currentState, {
    type: 'extract.progress',
    streamRequestId,
    patch,
  });
  if (!transition.changed) return;

  const merged = transition.state;
  setCurrentState(merged);

  if (transition.lightExtract && panel) {
    applyLoadingPatch(merged);
    manageLoadingTicker(merged);
    manageLoadingStallWatchdog(merged);
    return;
  }

  if (merged.status === 'success' && panelExtractJobs(merged).length > 0) {
    renderPanel(merged);
    return;
  }

  renderPanel(merged);
}

export function applyExtractStreamResult(
  streamRequestId: string,
  result: {
    prompt: string;
    provider?: string;
    model?: string;
  },
): void {
  const transition = panelReducer(currentState, {
    type: 'extract.result',
    streamRequestId,
    result,
  });
  if (!transition.changed) return;

  const merged = transition.shouldMergePendingAppendUrls
    ? mergePendingAppendUrlsInto(transition.state)
    : transition.state;

  setCurrentState(merged);

  if (transition.shouldSyncVersions) void syncVersions();

  renderPanel(currentState!);
}

export function applyExtractStreamError(streamRequestId: string, error: string): void {
  const transition = panelReducer(currentState, {
    type: 'extract.error',
    streamRequestId,
    error,
  });
  if (!transition.changed) return;

  const merged = transition.shouldMergePendingAppendUrls
    ? mergePendingAppendUrlsInto(transition.state)
    : transition.state;

  setCurrentState(merged);
  renderPanel(merged);
}
