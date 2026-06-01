import type { OneClickRefineRandomness, StrategyId } from '@/lib/types';
import type { PanelState } from '../state';
import type { PanelStateTransition } from './panelEvents';

export function applyUiStrategy(state: PanelState, strategy: StrategyId): PanelStateTransition {
  if (state.strategy === strategy) return { changed: false, state };
  return { changed: true, state: { ...state, strategy } };
}

export function applyUiOneClickRefineRandomness(
  state: PanelState,
  level: OneClickRefineRandomness,
): PanelStateTransition {
  if (state.oneClickRefineRandomness === level) return { changed: false, state };
  return { changed: true, state: { ...state, oneClickRefineRandomness: level } };
}

export function applyUiToggleVersionsOpen(state: PanelState, open?: boolean): PanelStateTransition {
  const next = open ?? !state.versionsOpen;
  if (state.versionsOpen === next) return { changed: false, state };
  return { changed: true, state: { ...state, versionsOpen: next } };
}

export function applyUiToggleRefineOpen(
  state: PanelState,
  open?: boolean,
  refineInstruction?: string,
): PanelStateTransition {
  const nextOpen = open ?? !state.refineOpen;
  const nextInstruction = nextOpen ? (refineInstruction ?? state.refineInstruction ?? '') : '';
  if (
    state.refineOpen === nextOpen &&
    state.refineInstruction === nextInstruction &&
    state.refineError === undefined
  ) {
    return { changed: false, state };
  }
  return {
    changed: true,
    state: {
      ...state,
      refineOpen: nextOpen,
      refineError: undefined,
      refineInstruction: nextInstruction,
    },
  };
}

export function applyUiSetDraft(
  state: PanelState,
  draft: string,
  selectedVersionId?: string | null,
): PanelStateTransition {
  const nextSel =
    selectedVersionId === undefined ? state.selectedVersionId : (selectedVersionId ?? undefined);
  if (state.draft === draft && state.selectedVersionId === nextSel) {
    return { changed: false, state };
  }
  return { changed: true, state: { ...state, draft, selectedVersionId: nextSel } };
}

export function applyUiSelectVersionId(
  state: PanelState,
  selectedVersionId: string,
): PanelStateTransition {
  if (state.selectedVersionId === selectedVersionId) return { changed: false, state };
  return { changed: true, state: { ...state, selectedVersionId } };
}

export function applyUiLoadVersion(
  state: PanelState,
  draft: string,
  selectedVersionId: string,
): PanelStateTransition {
  if (state.draft === draft && state.selectedVersionId === selectedVersionId) {
    return { changed: false, state };
  }
  return { changed: true, state: { ...state, draft, selectedVersionId } };
}
