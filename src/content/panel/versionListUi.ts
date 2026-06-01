import type { OneClickRefineRandomness, StrategyId } from '@/lib/types';
import {
  normalizeOneClickRefineRandomness,
  ONE_CLICK_REFINE_RANDOMNESS_LABELS,
} from '@/lib/oneClickRefine';
import { commitPanelEvent } from './dispatchPanel';
import { getVideoPickerTriggerLabel } from '@/content/videoSegmentSample';
import { getCachedVersionsListDensity } from '@/lib/versionsListDensity';
import { getCachedVersionsSidebarWidth } from '@/lib/versionsSidebarWidth';
import { currentState, panel, setComposeSelectedVideoIndex } from './state';
import { updateDirtyChromeImmediate } from './dirtyChrome';
import { panelActions } from './state';

function renderPanel(...args: Parameters<typeof panelActions.renderPanel>) {
  return panelActions.renderPanel(...args);
}

export function applyVersionsListDensityUi(root: HTMLElement | null): void {
  if (!root) return;
  const density = getCachedVersionsListDensity();
  const side =
    root.querySelector<HTMLElement>('[data-role="versions-side"]') ??
    root.querySelector<HTMLElement>('.versions-side');
  if (side) side.classList.toggle('versions-compact', density === 'compact');
}

export function applyVersionsSidebarWidthUi(root: HTMLElement | null): void {
  if (!root) return;
  const w = getCachedVersionsSidebarWidth();
  root.style.setProperty('--pe-versions-width', `${w}px`);
}

export function patchVersionList(): void {
  const st = currentState;
  if (!st) return;
  renderPanel(st);
  updateDirtyChromeImmediate();
}

export function patchOneClickRefineRandomnessDropdownSelection(
  root: HTMLElement,
  level: OneClickRefineRandomness,
): void {
  const dropdown = root.querySelector<HTMLElement>(
    '[data-role="one-click-refine-randomness-dropdown"]',
  );
  if (!dropdown) return;
  const labelEl = dropdown.querySelector<HTMLElement>('.sd-label');
  if (labelEl) labelEl.textContent = ONE_CLICK_REFINE_RANDOMNESS_LABELS[level] ?? level;
  dropdown.querySelectorAll<HTMLElement>('.sd-item').forEach((li) => {
    li.classList.toggle('active', li.dataset.randomness === level);
  });
}

export function patchVideoPickerSelection(root: HTMLElement, index: number): void {
  const dropdown = root.querySelector<HTMLElement>('[data-role="video-seg-picker-dropdown"]');
  if (!dropdown || dropdown.classList.contains('is-disabled')) return;
  const hidden = dropdown.querySelector<HTMLInputElement>('[data-role="video-seg-picker-value"]');
  if (hidden) hidden.value = String(index);
  const labelEl = dropdown.querySelector<HTMLElement>('.sd-label');
  if (labelEl) labelEl.textContent = getVideoPickerTriggerLabel(index);
  dropdown.querySelectorAll<HTMLElement>('.sd-item').forEach((li) => {
    const itemIndex = Number.parseInt(li.dataset.videoIndex ?? '-1', 10);
    li.classList.toggle('active', itemIndex === index);
  });
  setComposeSelectedVideoIndex(index);
}

export function applyStoredPromptStrategy(strategy: StrategyId): void {
  const st = currentState;
  if (!st || !panel) return;
  if (st.status !== 'success' && st.status !== 'loading' && st.status !== 'compose') return;
  if (st.strategy === strategy) return;
  const next = commitPanelEvent({ type: 'ui.strategy', strategy });
  if (next) renderPanel(next);
}

export function applyStoredOneClickRefineRandomness(level: OneClickRefineRandomness): void {
  const st = currentState;
  if (!st || !panel || st.status !== 'success') return;
  const next = normalizeOneClickRefineRandomness(level);
  if (st.oneClickRefineRandomness === next) return;
  const updated = commitPanelEvent({ type: 'ui.oneClickRefineRandomness', level: next });
  if (updated) renderPanel(updated);
}
