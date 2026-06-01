import { openRefineProviderSettings } from '@/lib/providerRoles';
import {
  buildOneClickRefineInstruction,
  makeOneClickRefineNonce,
  normalizeOneClickRefineRandomness,
} from '@/lib/oneClickRefine';
import {
  currentState,
  panel,
  panelRefineJobs,
  panelHasActiveRefine,
  MAX_PARALLEL_PANEL_REFINES,
} from '../state';
import { commitPanelEvent } from '../dispatchPanel';
import { renderPanelFromState } from '../panelRenderBridge';
import { beginPanelRefineSession } from '../refineSession';
import type { DataActionHandler } from './types';

export const handleOpenRefineSettings: DataActionHandler = () => {
  openRefineProviderSettings();
};

export const handleToggleRefine: DataActionHandler = () => {
  const state = currentState;
  if (!state) return;
  const opening = !state.refineOpen;
  const nextInstruction = opening ? state.refineInstruction || '' : '';
  const next = commitPanelEvent({
    type: 'ui.toggleRefineOpen',
    open: opening,
    refineInstruction: nextInstruction,
  });
  if (next) renderPanelFromState(next);
};

export const handleOneClickRefine: DataActionHandler = ({ root }) => {
  const state = currentState;
  if (!state || state.status !== 'success') return;
  if (panelRefineJobs(state).length >= MAX_PARALLEL_PANEL_REFINES) return;
  const actionRoot = root.isConnected ? root : (panel ?? root);
  const ta = actionRoot.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
  const baseline = (ta?.value ?? state.draft ?? state.prompt ?? '').trim();
  if (!baseline) return;
  const level = normalizeOneClickRefineRandomness(state.oneClickRefineRandomness);
  const instruction = buildOneClickRefineInstruction(level, makeOneClickRefineNonce());
  beginPanelRefineSession(state, baseline, instruction, '');
};

export const handleRefineSuggest: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state) return;
  const instruction = (el.dataset.text || '').trim();
  if (!instruction) return;
  if (panelHasActiveRefine(state)) return;
  const baseline = state.draft ?? state.prompt ?? '';
  beginPanelRefineSession(state, baseline, instruction, instruction);
};

export const handleRunRefine: DataActionHandler = () => {
  const state = currentState;
  if (!state) return;
  const instruction = (currentState?.refineInstruction || '').trim();
  if (!instruction) {
    commitPanelEvent({ type: 'ui.setRefineError', error: '请先输入修改要求' });
    renderPanelFromState(currentState!);
    return;
  }
  const baseline = state.draft ?? state.prompt ?? '';
  beginPanelRefineSession(state, baseline, instruction, instruction);
};
