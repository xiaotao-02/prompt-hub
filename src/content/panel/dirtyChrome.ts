import {
  currentState,
  panel,
  panelHasActiveRefine,
  panelRefineJobs,
  MAX_PARALLEL_PANEL_REFINES,
} from './state';
import { EXTRACT_STREAM_VERSION_ID, REFINE_STREAM_VERSION_ID } from '@/lib/streamVersionSentinels';

let dirtyVersionHighlightRaf = 0;

export function cancelPendingDirtyChromeDeferred(): void {
  if (dirtyVersionHighlightRaf !== 0) {
    cancelAnimationFrame(dirtyVersionHighlightRaf);
    dirtyVersionHighlightRaf = 0;
  }
}

function syncDirtyHintsImmediate(): void {
  if (!panel || !currentState) return;
  const root = panel;
  const draft = currentState.draft ?? '';
  const dirty = panelHasActiveRefine(currentState) ? false : draft !== (currentState.prompt ?? '');
  const hint = root.querySelector<HTMLElement>('.dirty-hint');
  if (hint) hint.classList.toggle('show', dirty);
  const taEditor = root.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
  const baselineRaw =
    currentState.status === 'success' && taEditor
      ? taEditor.value
      : draft || (currentState.prompt ?? '');
  const baselineEmpty = baselineRaw.trim().length === 0;
  const spinDisabled =
    panelRefineJobs(currentState).length >= MAX_PARALLEL_PANEL_REFINES || baselineEmpty;
  const setDisabled = (sel: string, disabled: boolean) => {
    const btn = root.querySelector<HTMLButtonElement>(sel);
    if (!btn) return;
    btn.disabled = disabled;
    btn.classList.toggle('disabled', disabled);
    if (sel.includes('save')) {
      btn.classList.toggle('primary', !disabled);
      btn.classList.toggle('ghost', disabled);
    }
  };
  setDisabled('[data-action="one-click-refine"]', spinDisabled);
  const rrDd = root.querySelector<HTMLElement>(
    '[data-role="one-click-refine-randomness-dropdown"]',
  );
  const rrTrigger = rrDd?.querySelector<HTMLButtonElement>('.sd-trigger');
  if (rrTrigger) rrTrigger.disabled = spinDisabled;
  if (rrDd) rrDd.classList.toggle('is-disabled', spinDisabled);
  setDisabled('[data-action="save"]', !dirty);
  syncEditorCharCount();
}

export function syncEditorCharCount(): void {
  if (!panel) return;
  const editor = panel.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
  const label = panel.querySelector<HTMLElement>('[data-role="editor-char-count"]');
  if (!editor || !label) return;
  const n = [...editor.value].length;
  label.textContent = `${n} 字`;
}

function syncVersionHighlightFromState(): void {
  if (!panel || !currentState) return;
  const draft = currentState.draft ?? '';
  const versions = currentState.versions || [];
  const sel = currentState.selectedVersionId;
  let matchedId: string | undefined;
  if (
    sel === REFINE_STREAM_VERSION_ID ||
    sel === EXTRACT_STREAM_VERSION_ID ||
    sel?.startsWith(`${REFINE_STREAM_VERSION_ID}:`) ||
    sel?.startsWith(`${EXTRACT_STREAM_VERSION_ID}:`)
  ) {
    matchedId = sel;
  } else if (sel) {
    const byId = versions.find((v) => v.id === sel);
    if (byId) matchedId = sel;
  }
  if (!matchedId) {
    matchedId = versions.find((v) => v.prompt === draft)?.id;
  }
  panel.querySelectorAll<HTMLElement>('.version-item').forEach((item) => {
    item.classList.toggle('selected', !!matchedId && item.dataset.versionId === matchedId);
  });
}

export function updateDirtyChrome(): void {
  syncDirtyHintsImmediate();
  cancelPendingDirtyChromeDeferred();
  dirtyVersionHighlightRaf = requestAnimationFrame(() => {
    dirtyVersionHighlightRaf = 0;
    syncVersionHighlightFromState();
  });
}

export function updateDirtyChromeImmediate(): void {
  cancelPendingDirtyChromeDeferred();
  syncDirtyHintsImmediate();
  syncVersionHighlightFromState();
}
