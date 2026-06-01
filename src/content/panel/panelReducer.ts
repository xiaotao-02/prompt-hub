import type { PanelState } from './state';
import {
  applyExtractError,
  applyExtractProgress,
  applyExtractResult,
} from './reducerHandlers/extract';
import { applyReferenceSetUrls } from './reducerHandlers/references';
import { applyHistoryPrefetch, applyHistoryReady } from './reducerHandlers/historySync';
import {
  applyRefineComplete,
  applyRefineDequeue,
  applyRefineEnqueue,
  applyRefineProgress,
} from './reducerHandlers/refine';
import {
  applyUiLoadVersion,
  applyUiOneClickRefineRandomness,
  applyUiSelectVersionId,
  applyUiSetDraft,
  applyUiStrategy,
  applyUiToggleRefineOpen,
  applyUiToggleVersionsOpen,
} from './reducerHandlers/ui';
import { applyVersionsSynced, applyVersionsUpdated } from './reducerHandlers/versions';
import type { PanelEvent, PanelStateTransition } from './reducerHandlers/panelEvents';

export type {
  ExtractProgressPatch,
  PanelEvent,
  PanelStateTransition,
} from './reducerHandlers/panelEvents';

export function panelReducer(state: PanelState | null, event: PanelEvent): PanelStateTransition {
  if (!state) return { changed: false, state };

  switch (event.type) {
    case 'extract.progress':
      return applyExtractProgress(state, event.streamRequestId, event.patch);
    case 'extract.result':
      return applyExtractResult(state, event.streamRequestId, event.result);
    case 'extract.error':
      return applyExtractError(state, event.streamRequestId, event.error);
    case 'ui.strategy':
      return applyUiStrategy(state, event.strategy);
    case 'ui.oneClickRefineRandomness':
      return applyUiOneClickRefineRandomness(state, event.level);
    case 'ui.toggleVersionsOpen':
      return applyUiToggleVersionsOpen(state, event.open);
    case 'ui.toggleRefineOpen':
      return applyUiToggleRefineOpen(state, event.open, event.refineInstruction);
    case 'ui.setDraft':
      return applyUiSetDraft(state, event.draft, event.selectedVersionId);
    case 'ui.setRefineInstruction':
      if (state.refineInstruction === event.instruction) return { changed: false, state };
      return { changed: true, state: { ...state, refineInstruction: event.instruction } };
    case 'ui.setRefineError':
      if (state.refineError === event.error) return { changed: false, state };
      return { changed: true, state: { ...state, refineError: event.error } };
    case 'ui.selectVersionId':
      return applyUiSelectVersionId(state, event.selectedVersionId);
    case 'ui.loadVersion':
      return applyUiLoadVersion(state, event.draft, event.selectedVersionId);
    case 'versions.synced':
      return applyVersionsSynced(state, event);
    case 'versions.updated':
      return applyVersionsUpdated(state, event);
    case 'refine.enqueue':
      return applyRefineEnqueue(state, event.job, event.refineInstruction);
    case 'refine.dequeue':
      return applyRefineDequeue(state, event.jobId, event.refineError);
    case 'refine.complete':
      return applyRefineComplete(
        state,
        event.jobId,
        event.prompt,
        event.versionId,
        event.prevSelectedVersionId,
      );
    case 'reference.setUrls':
      return applyReferenceSetUrls(state, event.imageUrls, event.imageUrl);
    case 'history.prefetch':
      return applyHistoryPrefetch(
        state,
        event.sessionRequestId,
        event.prefetchStorageId,
        event.versions,
        event.prompt,
      );
    case 'history.ready':
      return applyHistoryReady(
        state,
        event.sessionRequestId,
        event.persistedHistoryId,
        event.versions,
        event.prompt,
      );
    case 'refine.progress':
      return applyRefineProgress(state, event);
    default: {
      const exhaustive: never = event;
      return { changed: false, state: exhaustive };
    }
  }
}
