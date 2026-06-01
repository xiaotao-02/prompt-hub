import type { HistoryItem, PromptVersion } from '@/lib/types';
import type { PanelState } from './state';

let suppressLibraryPanelRevRefreshUntil = 0;

/** 恢复版本后短时跳过库浮窗 refreshItem，避免 library_rev 触发二次全量重渲。 */
export function suppressLibraryPanelRevRefresh(ms = 400): void {
  suppressLibraryPanelRevRefreshUntil = Date.now() + ms;
}

export function shouldSuppressLibraryPanelRevRefresh(): boolean {
  return Date.now() < suppressLibraryPanelRevRefreshUntil;
}

export function versionsSnapshotEqual(
  a: PromptVersion[] | undefined,
  b: PromptVersion[] | undefined,
): boolean {
  const va = a ?? [];
  const vb = b ?? [];
  if (va.length !== vb.length) return false;
  for (let i = 0; i < va.length; i++) {
    if (va[i].id !== vb[i].id || va[i].versionNo !== vb[i].versionNo) return false;
  }
  return true;
}

/** 面板 state 与 IDB 读回的条目在 prompt + versions 快照上是否一致。 */
export function libraryPanelPromptInSync(
  state: PanelState,
  fresh: Pick<HistoryItem, 'prompt' | 'versions'>,
): boolean {
  return state.prompt === fresh.prompt && versionsSnapshotEqual(state.versions, fresh.versions);
}

/** 库浮窗是否应测量并抬升稳定高度（纯版本重排可跳过）。 */
export function shouldScheduleLibraryPanelStabilize(
  prev: PanelState | null,
  next: PanelState,
): boolean {
  if (!prev) return true;
  if (prev.status !== next.status) return true;
  if (prev.versionsOpen !== next.versionsOpen) return true;
  if (prev.refineOpen !== next.refineOpen) return true;
  const prevLen = (prev.draft ?? prev.prompt ?? '').length;
  const nextLen = (next.draft ?? next.prompt ?? '').length;
  return prevLen !== nextLen;
}
