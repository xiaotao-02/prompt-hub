import { bindHeaderDrag, bindEdgeResize } from './panelDragResize';

const panelShellBound = new WeakSet<HTMLElement>();

/** 仅绑定 drag / resize；面板内容由 React 渲染，交互在组件内处理。 */

export function bindEvents(root: HTMLElement): void {
  if (panelShellBound.has(root)) return;

  panelShellBound.add(root);

  bindHeaderDrag(root);

  bindEdgeResize(root);
}

export { flashCopied, fallbackCopy } from './copyFeedback';

export { syncComposeCollectModeUi } from './actions/compose';

export {
  cancelPendingDirtyChromeDeferred,
  syncEditorCharCount,
  updateDirtyChrome,
  updateDirtyChromeImmediate,
} from './dirtyChrome';

export { syncVersions } from './versionsSync';

export {
  applyVersionsListDensityUi,
  patchVersionList,
  applyStoredPromptStrategy,
  applyStoredOneClickRefineRandomness,
} from './versionListUi';
