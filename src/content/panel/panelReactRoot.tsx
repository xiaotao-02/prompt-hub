import { createRoot, type Root } from 'react-dom/client';
import { PanelApp } from './PanelApp';
import type { PanelState } from './state';

let reactRoot: Root | null = null;
let rootEl: HTMLElement | null = null;

export function ensurePanelReactRoot(surface: HTMLElement): Root {
  if (reactRoot && rootEl === surface) return reactRoot;
  if (reactRoot) {
    reactRoot.unmount();
  }
  rootEl = surface;
  reactRoot = createRoot(surface);
  return reactRoot;
}

export function renderPanelReact(
  state: PanelState,
  prevStatus: PanelState['status'] | null = null,
): void {
  if (!reactRoot) return;
  reactRoot.render(<PanelApp state={state} prevStatus={prevStatus} />);
}

export function unmountPanelReact(): void {
  reactRoot?.unmount();
  reactRoot = null;
  rootEl = null;
}
