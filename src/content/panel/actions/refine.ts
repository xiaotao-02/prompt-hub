import { openRefineProviderSettings } from '@/lib/providerRoles';
import {
  buildOneClickRefineInstruction,
  makeOneClickRefineNonce,
  normalizeOneClickRefineRandomness,
} from '@/lib/oneClickRefine';
import {
  buildOutputStyleReflowInstruction,
  buildStrategyStyleReflowInstruction,
  detectPromptSettingsDrift,
  effectiveOutputStyleForReflow,
} from '@/lib/panelSettingsReflow';
import {
  currentState,
  panel,
  panelRefineJobs,
  panelHasActiveRefine,
  panelReferenceUrls,
  panelExtractJobs,
  MAX_PARALLEL_PANEL_REFINES,
  MAX_PARALLEL_PANEL_EXTRACTS,
} from '../state';
import { commitPanelEvent } from '../dispatchPanel';
import { renderPanelFromState } from '../panelRenderBridge';
import { beginPanelRefineSession } from '../refineSession';
import { beginPanelReExtractFromSuccess } from './copyAndRetry';
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

function clearRefineError(): void {
  commitPanelEvent({ type: 'ui.setRefineError', error: '' });
}

export const handleRunRefine: DataActionHandler = () => {
  const state = currentState;
  if (!state || state.status !== 'success') return;
  if (panelHasActiveRefine(state)) return;
  if (panelRefineJobs(state).length >= MAX_PARALLEL_PANEL_REFINES) return;
  if (panelExtractJobs(state).length >= MAX_PARALLEL_PANEL_EXTRACTS) return;

  const baseline = (state.draft ?? state.prompt ?? '').trim();
  if (!baseline) return;

  let instruction = (state.refineInstruction || '').trim();
  let instructionSnapshot = instruction;

  if (!instruction) {
    const drift = detectPromptSettingsDrift({
      strategy: state.strategy,
      outputStyle: state.outputStyle,
      versions: state.versions,
      selectedVersionId: state.selectedVersionId,
    });

    if (drift.strategyChanged) {
      const refs = panelReferenceUrls(state);
      if (refs.length > 0) {
        clearRefineError();
        if (beginPanelReExtractFromSuccess(state)) return;
      }
      const toStrategy = state.strategy!;
      const toStyle =
        effectiveOutputStyleForReflow(state.strategy, state.outputStyle) ?? state.outputStyle!;
      instruction = buildStrategyStyleReflowInstruction(
        drift.source.strategy,
        toStrategy,
        drift.source.style,
        toStyle,
      );
      instructionSnapshot = '';
    } else if (drift.outputStyleChanged) {
      const fromStyle = drift.source.style!;
      const toStyle =
        effectiveOutputStyleForReflow(state.strategy, state.outputStyle) ?? state.outputStyle!;
      instruction = buildOutputStyleReflowInstruction(fromStyle, toStyle);
      instructionSnapshot = '';
    } else {
      commitPanelEvent({ type: 'ui.setRefineError', error: '请先输入修改要求' });
      renderPanelFromState(currentState!);
      return;
    }
  }

  clearRefineError();
  beginPanelRefineSession(state, baseline, instruction, instructionSnapshot);
};
