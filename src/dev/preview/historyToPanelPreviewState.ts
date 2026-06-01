import type { PanelState } from '@/content/panel/state';
import type { HistoryItem } from '@/lib/types';
import { DEFAULT_STRATEGY_ID } from '@/lib/strategies';
import { DEFAULT_ONE_CLICK_REFINE_RANDOMNESS } from '@/lib/oneClickRefine';

/** 对齐 content script 中 `PANEL_FROM_HISTORY` → `renderPanel` 的字段。 */
export function historyItemToPanelPreviewState(item: HistoryItem): PanelState {
  const imageUrls = item.imageUrls?.length
    ? item.imageUrls
    : [item.thumbnail || item.imageUrl || ''];
  const primary = imageUrls[0] || item.imageUrl;
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
    versionsOpen: false,
    refineOpen: false,
    strategy: item.strategy ?? DEFAULT_STRATEGY_ID,
    oneClickRefineRandomness: DEFAULT_ONE_CLICK_REFINE_RANDOMNESS,
  };
}
