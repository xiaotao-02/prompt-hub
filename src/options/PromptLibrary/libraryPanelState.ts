import type { PanelState } from '@/content/panel/state';
import type { HistoryItem } from '@/lib/types';
import { DEFAULT_STRATEGY_ID } from '@/lib/strategies';
import { getSettings } from '@/lib/storage';
import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';
import type { LibraryDockIntent } from './types';

/** 将提示词库条目转为网页 Content panel 同构的 success 态快照。 */
export function historyItemToLibraryPanelState(
  item: HistoryItem,
  _dock?: LibraryDockIntent,
): PanelState {
  const imageUrls = item.imageUrls?.length
    ? item.imageUrls
    : [item.thumbnail || item.imageUrl || ''];
  const primary = imageUrls[0] || item.imageUrl;
  /** 页内面板默认同时展开历史版本侧栏与 AI 调整区。 */
  const versionsOpen = true;
  const refineOpen = true;
  return {
    sessionRequestId: item.id,
    imageUrl: primary,
    imageUrls,
    status: 'success',
    prompt: item.prompt,
    draft: item.prompt,
    provider: item.provider,
    model: item.model,
    versions: item.versions,
    versionsOpen,
    refineOpen,
    strategy: item.strategy ?? DEFAULT_STRATEGY_ID,
    oneClickRefineRandomness: normalizeOneClickRefineRandomness(undefined),
  };
}

/** 异步补齐全局设置中的一键洗稿强度。 */
export async function hydrateLibraryPanelOneClickRefineRandomness(
  state: PanelState,
): Promise<PanelState> {
  const settings = await getSettings();
  return {
    ...state,
    oneClickRefineRandomness: normalizeOneClickRefineRandomness(settings.oneClickRewriteRandomness),
  };
}
