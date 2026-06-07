import { useCallback, useEffect, useRef, useState } from 'react';
import type { HistoryItem } from '@/lib/types';
import { getHistoryItem } from '@/lib/storage';

export type UsePopupVersionsDetailOptions = {
  initialExpandedId?: string | null;
  list?: HistoryItem[];
  historyLoaded?: boolean;
};

/**
 * Popup 历史列表里「展开某条的内联版本」：首屏用列表缓存乐观渲染，
 * 后台 getHistoryItem 静默刷新；generation 忽略过期回调。
 */
export function usePopupVersionsDetail(
  reloadList: () => void | Promise<void>,
  options?: UsePopupVersionsDetailOptions,
) {
  const [versionsExpandedId, setVersionsExpandedId] = useState<string | null>(null);
  const [versionsDetailItem, setVersionsDetailItem] = useState<HistoryItem | null>(null);
  const versionsFetchGenRef = useRef(0);
  const versionsExpandedIdRef = useRef<string | null>(null);
  versionsExpandedIdRef.current = versionsExpandedId;
  const initialExpandDoneRef = useRef(false);

  const expandVersionsForItem = useCallback(
    (item: HistoryItem) => {
      if ((item.versions?.length ?? 0) <= 1) return;
      versionsFetchGenRef.current += 1;
      const gen = versionsFetchGenRef.current;
      setVersionsExpandedId(item.id);
      setVersionsDetailItem(item);
      void getHistoryItem(item.id).then((fresh) => {
        if (gen !== versionsFetchGenRef.current) return;
        if (!fresh) {
          setVersionsExpandedId(null);
          setVersionsDetailItem(null);
          void reloadList();
          return;
        }
        setVersionsDetailItem(fresh);
      });
    },
    [reloadList],
  );

  const toggleVersionsPanel = useCallback(
    (item: HistoryItem) => {
      if (versionsExpandedId === item.id) {
        versionsFetchGenRef.current += 1;
        setVersionsExpandedId(null);
        return;
      }
      expandVersionsForItem(item);
    },
    [versionsExpandedId, expandVersionsForItem],
  );

  useEffect(() => {
    const initialId = options?.initialExpandedId?.trim();
    if (initialExpandDoneRef.current || !initialId) return;
    if (!options?.historyLoaded) return;
    const item = options.list?.find((i) => i.id === initialId);
    if (!item) return;
    initialExpandDoneRef.current = true;
    expandVersionsForItem(item);
  }, [options?.initialExpandedId, options?.historyLoaded, options?.list, expandVersionsForItem]);

  const refreshVersionsDetailAfterMutation = useCallback(async () => {
    await reloadList();
    const id = versionsExpandedIdRef.current;
    if (!id) return;
    const fresh = await getHistoryItem(id);
    if (!fresh) {
      versionsFetchGenRef.current += 1;
      setVersionsExpandedId(null);
      setVersionsDetailItem(null);
      await reloadList();
      return;
    }
    setVersionsDetailItem(fresh);
  }, [reloadList]);

  const collapseVersionsForItem = useCallback(
    (itemId: string) => {
      if (versionsExpandedId !== itemId) return;
      versionsFetchGenRef.current += 1;
      setVersionsExpandedId(null);
      setVersionsDetailItem(null);
    },
    [versionsExpandedId],
  );

  return {
    versionsExpandedId,
    versionsDetailItem,
    toggleVersionsPanel,
    refreshVersionsDetailAfterMutation,
    collapseVersionsForItem,
  };
}
