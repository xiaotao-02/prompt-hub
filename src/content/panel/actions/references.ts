import {
  normalizeReferenceList,
  appendReferenceUrl,
  MAX_REFERENCE_IMAGES,
} from '@/lib/referenceImages';
import { currentState, panelReferenceUrls } from '../state';
import { applyPanelStateAfterEvent, closePanel } from '../panelRenderBridge';
import type { DataActionHandler } from './types';

export const handleRemoveReference: DataActionHandler = ({ el }) => {
  const state = currentState;
  if (!state) return;
  if (state.status !== 'compose' && state.status !== 'success' && state.status !== 'error') return;
  const idx = Number.parseInt(el.dataset.index || '-1', 10);
  const urls = [...panelReferenceUrls(state)];
  if (idx < 0 || idx >= urls.length) return;
  urls.splice(idx, 1);
  const next = normalizeReferenceList(urls);
  if (next.length === 0) {
    closePanel();
    return;
  }
  const primary = next[0] || state.imageUrl;
  applyPanelStateAfterEvent({
    type: 'reference.setUrls',
    imageUrls: next,
    imageUrl: primary,
  });
};

export const handleAddRefUrl: DataActionHandler = ({ root }) => {
  const state = currentState;
  if (!state || state.status !== 'compose') return;
  const prev = panelReferenceUrls(state);
  if (prev.length >= MAX_REFERENCE_IMAGES) return;
  const input = root.querySelector<HTMLInputElement>('[data-role="ref-url-input"]');
  const raw = (input?.value || '').trim();
  if (!raw) return;
  const next = appendReferenceUrl(prev, raw);
  if (next.length === prev.length) return;
  if (input) input.value = '';
  const primary = next[0] || state.imageUrl;
  applyPanelStateAfterEvent({
    type: 'reference.setUrls',
    imageUrls: next,
    imageUrl: primary,
  });
};

export const handlePickRefFile: DataActionHandler = ({ root }) => {
  const state = currentState;
  if (!state || state.status !== 'compose') return;
  root.querySelector<HTMLInputElement>('[data-role="ref-file-input"]')?.click();
};
