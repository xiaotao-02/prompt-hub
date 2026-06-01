import type { PromptVersion } from '@/lib/types';
import { extractStreamSentinelForJob, parseExtractJobSentinel } from '@/lib/streamVersionSentinels';
import { matchesExtractStreamRequest, panelExtractJobs, type PanelState } from '../state';
import type { PanelStateTransition } from './panelEvents';

export function applyHistoryPrefetch(
  state: PanelState,
  sessionRequestId: string,
  prefetchStorageId: string,
  versions: PromptVersion[],
  _prompt: string,
): PanelStateTransition {
  if (
    state.sessionRequestId !== sessionRequestId &&
    !matchesExtractStreamRequest(state, sessionRequestId)
  ) {
    return { changed: false, state };
  }
  const hasHistory = versions.length > 0;
  return {
    changed: true,
    state: {
      ...state,
      prefetchStorageId,
      versions,
      selectedVersionId:
        state.status === 'loading' && hasHistory
          ? extractStreamSentinelForJob(sessionRequestId)
          : state.selectedVersionId,
    },
  };
}

export function applyHistoryReady(
  state: PanelState,
  sessionRequestId: string,
  persistedHistoryId: string,
  versions: PromptVersion[],
  prompt: string,
): PanelStateTransition {
  const hitStream = matchesExtractStreamRequest(state, sessionRequestId);
  if (!hitStream && state.sessionRequestId !== sessionRequestId) {
    return { changed: false, state };
  }

  const nextEj = hitStream
    ? panelExtractJobs(state).filter((j) => j.streamRequestId !== sessionRequestId)
    : panelExtractJobs(state);

  const nextSessionRequestId =
    state.sessionRequestId === sessionRequestId ? persistedHistoryId : state.sessionRequestId;
  const nextDraft = state.draft ?? prompt;
  const nextPrompt = state.prompt ?? prompt;
  let nextSel = state.selectedVersionId;
  if (
    nextSel === extractStreamSentinelForJob(sessionRequestId) ||
    parseExtractJobSentinel(nextSel ?? undefined) === sessionRequestId
  ) {
    nextSel = undefined;
  }
  if (nextSel && !versions.some((v) => v.id === nextSel)) {
    nextSel = undefined;
  }
  if (!nextSel) {
    nextSel =
      nextDraft === prompt ? versions[0]?.id : versions.find((v) => v.prompt === nextDraft)?.id;
  }

  return {
    changed: true,
    state: {
      ...state,
      sessionRequestId: nextSessionRequestId,
      prefetchStorageId: undefined,
      versions,
      prompt: nextPrompt,
      draft: nextDraft,
      selectedVersionId: nextSel,
      extractJobs: nextEj.length ? nextEj : undefined,
    },
  };
}
