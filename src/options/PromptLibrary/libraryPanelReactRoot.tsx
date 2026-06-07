import { createRoot, type Root } from 'react-dom/client';
import type { PanelState } from '@/content/panel/state';
import { PanelSuccessBody } from '@/content/panel/components/PanelSuccessBody';

let reactRoot: Root | null = null;
let rootEl: HTMLElement | null = null;

export type LibraryPanelRenderProps = {
  pageUrl?: string;
  onJumpToOriginal?: () => void;
  jumpBusy?: boolean;
  onClose?: () => void;
};

let renderProps: LibraryPanelRenderProps = {};

export function setLibraryPanelRenderProps(props: LibraryPanelRenderProps): void {
  renderProps = props;
}

export function ensureLibraryPanelReactRoot(surface: HTMLElement): Root {
  if (reactRoot && rootEl === surface) return reactRoot;
  if (reactRoot) reactRoot.unmount();
  rootEl = surface;
  reactRoot = createRoot(surface);
  return reactRoot;
}

export function renderLibraryPanelReact(state: PanelState): void {
  if (!reactRoot) return;
  reactRoot.render(
    <PanelSuccessBody
      state={state}
      title="提示词库编辑"
      onClose={renderProps.onClose}
      jumpToOriginal={{
        pageUrl: renderProps.pageUrl,
        onJump: renderProps.onJumpToOriginal,
        busy: renderProps.jumpBusy,
      }}
    />,
  );
}

export function unmountLibraryPanelReact(): void {
  reactRoot?.unmount();
  reactRoot = null;
  rootEl = null;
  renderProps = {};
}
