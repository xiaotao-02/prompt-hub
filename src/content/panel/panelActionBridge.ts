import { DATA_ACTION_HANDLERS } from './actions';
import { panel } from './state';

export function panelActionRoot(): HTMLElement {
  return panel!;
}

export function runPanelAction(action: string, el: HTMLElement, nativeEvent: MouseEvent): void {
  const root = panel;
  if (!root) return;
  const handler = DATA_ACTION_HANDLERS[action];
  if (handler) handler({ root, el, event: nativeEvent });
}
