import { HOST_ID, host, panel, currentState } from './state';

let bound = false;

function isEventInsidePanel(event: Event): boolean {
  const h = host ?? document.getElementById(HOST_ID);
  if (!h) return false;
  return event.composedPath().includes(h);
}

function onOutsidePointerDown(event: PointerEvent): void {
  // 仅左键点外关闭；右键/中键用于 context menu，不应误关面板。
  if (event.button !== 0) return;
  if (!panel || !currentState) return;
  if (isEventInsidePanel(event)) return;
  // closePanel 由 index 注入，避免循环依赖
  panelOutsideCloseActions.closePanel?.();
}

export const panelOutsideCloseActions = {
  closePanel: null as (() => void) | null,
};

export function bindPanelOutsideClose(): void {
  if (bound) return;
  document.addEventListener('pointerdown', onOutsidePointerDown, true);
  bound = true;
}

export function unbindPanelOutsideClose(): void {
  if (!bound) return;
  document.removeEventListener('pointerdown', onOutsidePointerDown, true);
  bound = false;
}
