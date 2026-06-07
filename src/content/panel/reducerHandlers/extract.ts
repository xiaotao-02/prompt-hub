import { extractStreamSentinelForJob, parseExtractJobSentinel } from '@/lib/streamVersionSentinels';
import { panelExtractJobs, type PanelExtractJob, type PanelState } from '../state';
import type { ExtractProgressPatch, PanelStateTransition } from './panelEvents';

function patchExtractJob(
  jobs: PanelExtractJob[],
  streamRequestId: string,
  patch: ExtractProgressPatch,
): { jobs: PanelExtractJob[]; changed: boolean } {
  const ix = jobs.findIndex((j) => j.streamRequestId === streamRequestId);
  if (ix < 0) return { jobs, changed: false };

  const next = [...jobs];
  next[ix] = {
    ...next[ix]!,
    ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
    ...(patch.partial !== undefined ? { partial: patch.partial } : {}),
    ...(patch.streamMode !== undefined ? { streamMode: patch.streamMode } : {}),
  };
  return { jobs: next, changed: true };
}

function withExtractMeta(state: PanelState, patch: ExtractProgressPatch): PanelState {
  let next = state;
  if (patch.strategy !== undefined) next = { ...next, strategy: patch.strategy };
  if (patch.outputStyle !== undefined) next = { ...next, outputStyle: patch.outputStyle };
  if (patch.provider !== undefined) next = { ...next, provider: patch.provider };
  if (patch.model !== undefined) next = { ...next, model: patch.model };
  if (patch.oneClickRefineRandomness !== undefined) {
    next = { ...next, oneClickRefineRandomness: patch.oneClickRefineRandomness };
  }
  return next;
}

export function applyExtractProgress(
  state: PanelState,
  streamRequestId: string,
  patch: ExtractProgressPatch,
): PanelStateTransition {
  const patched = patchExtractJob(panelExtractJobs(state), streamRequestId, patch);
  let merged: PanelState;

  if (patched.changed) {
    merged = { ...state, extractJobs: patched.jobs };
  } else if (state.status === 'loading' && state.sessionRequestId === streamRequestId) {
    merged = {
      ...state,
      ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
      ...(patch.partial !== undefined ? { partial: patch.partial } : {}),
      ...(patch.streamMode !== undefined ? { streamMode: patch.streamMode } : {}),
    };
  } else {
    return { changed: false, state };
  }

  merged = withExtractMeta(merged, patch);

  return {
    changed: true,
    state: merged,
    lightExtract:
      merged.status === 'loading' &&
      (patch.stage !== undefined ||
        patch.partial !== undefined ||
        patch.streamMode !== undefined ||
        patch.strategy !== undefined ||
        patch.outputStyle !== undefined ||
        patch.provider !== undefined ||
        patch.model !== undefined ||
        patch.oneClickRefineRandomness !== undefined),
  };
}

export function applyExtractResult(
  state: PanelState,
  streamRequestId: string,
  result: { prompt: string; provider?: string; model?: string },
): PanelStateTransition {
  const prevJobs = panelExtractJobs(state);
  const nextJobs = prevJobs.filter((j) => j.streamRequestId !== streamRequestId);
  const wasTracked = prevJobs.some((j) => j.streamRequestId === streamRequestId);
  const legacyMatch =
    state.status === 'loading' &&
    state.sessionRequestId === streamRequestId &&
    prevJobs.length === 0;

  if (!wasTracked && !legacyMatch) return { changed: false, state };

  let nextSelectedVersionId = state.selectedVersionId;
  if (
    nextSelectedVersionId === extractStreamSentinelForJob(streamRequestId) ||
    parseExtractJobSentinel(nextSelectedVersionId ?? undefined) === streamRequestId
  ) {
    nextSelectedVersionId = undefined;
  }

  return {
    changed: true,
    state: {
      ...state,
      extractJobs: nextJobs.length ? nextJobs : undefined,
      partial: undefined,
      stage: undefined,
      extractBaselinePrompt: undefined,
      prompt: result.prompt,
      draft: result.prompt,
      provider: result.provider ?? state.provider,
      model: result.model ?? state.model,
      status: 'success',
      refineOpen: true,
      error: undefined,
      prefetchStorageId: undefined,
      selectedVersionId: nextSelectedVersionId,
    },
    shouldSyncVersions: !state.prefetchStorageId && state.status === 'loading',
    shouldMergePendingAppendUrls: true,
  };
}

export function applyExtractError(
  state: PanelState,
  streamRequestId: string,
  error: string,
): PanelStateTransition {
  const prevJobs = panelExtractJobs(state);
  const nextJobs = prevJobs.filter((j) => j.streamRequestId !== streamRequestId);
  const wasTracked = prevJobs.some((j) => j.streamRequestId === streamRequestId);
  const legacyMatch =
    state.status === 'loading' &&
    state.sessionRequestId === streamRequestId &&
    prevJobs.length === 0;

  if (!wasTracked && !legacyMatch) return { changed: false, state };

  let merged: PanelState = {
    ...state,
    extractJobs: nextJobs.length ? nextJobs : undefined,
    partial: undefined,
    stage: undefined,
  };

  if (
    merged.status === 'loading' &&
    panelExtractJobs(merged).length === 0 &&
    !(merged.prompt ?? '').trim()
  ) {
    merged = { ...merged, status: 'error', error };
  }

  const stillMidExtract = merged.status === 'loading' && panelExtractJobs(merged).length > 0;

  return {
    changed: true,
    state: merged,
    shouldMergePendingAppendUrls: !stillMidExtract,
  };
}
