import { commitPanelEvent } from './dispatchPanel';
import { panelActions, type PanelState } from './state';
import type { PanelEvent } from './panelReducer';

export function renderPanelFromState(state: PanelState): void {
  panelActions.renderPanel(state);
}

export function closePanel(): void {
  panelActions.closePanel();
}

/** 应用 reducer 事件；状态变更时重渲面板，返回新状态或 null。 */
export function applyPanelStateAfterEvent(event: PanelEvent): PanelState | null {
  const updated = commitPanelEvent(event);
  if (updated) renderPanelFromState(updated);
  return updated;
}
