import { useCallback, useEffect, useRef, useState } from 'react';
import {
  exportAllHistoryPublic,
  getFolders,
  LIBRARY_REV_KEY,
  listHistoryGlobalDescPage,
  scanHistoryLibraryStats,
} from '@/lib/storage';
import type { HistoryItem, LibraryFolder } from '@/lib/types';
import type { HistoryLibraryStats } from '@/lib/storage/historyDb';
import type { LibraryScanInput } from './libraryScanInput';
import { buildUsesFullLibraryScan } from './libraryScanInput';

const LIBRARY_PAGE_SIZE = 80;

export function useLibraryData(scanInput: LibraryScanInput) {
  const [list, setList] = useState<HistoryItem[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [libraryStats, setLibraryStats] = useState<HistoryLibraryStats | null>(null);
  const [listCursor, setListCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const listCursorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    listCursorRef.current = listCursor;
  }, [listCursor]);

  const usesFullLibraryScan = useCallback(() => buildUsesFullLibraryScan(scanInput), [scanInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const full = buildUsesFullLibraryScan(scanInput);
      const [stats, fs] = await Promise.all([scanHistoryLibraryStats(), getFolders()]);
      setLibraryStats(stats);
      setFolders(fs);
      if (full) {
        const data = await exportAllHistoryPublic();
        setList(data);
        setListCursor(undefined);
        setHasMore(false);
      } else {
        const { items, nextCursor } = await listHistoryGlobalDescPage(LIBRARY_PAGE_SIZE);
        setList(items);
        setListCursor(nextCursor);
        setHasMore(Boolean(nextCursor) && stats.total > items.length);
      }
    } finally {
      setLoading(false);
    }
  }, [scanInput]);

  const reloadHistory = useCallback(async () => {
    try {
      const full = buildUsesFullLibraryScan(scanInput);
      const stats = await scanHistoryLibraryStats();
      setLibraryStats(stats);
      if (full) {
        const data = await exportAllHistoryPublic();
        setList(data);
        setListCursor(undefined);
        setHasMore(false);
      } else {
        const { items, nextCursor } = await listHistoryGlobalDescPage(LIBRARY_PAGE_SIZE);
        setList(items);
        setListCursor(nextCursor);
        setHasMore(Boolean(nextCursor) && stats.total > items.length);
      }
    } catch {
      /* ignore */
    }
  }, [scanInput]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || buildUsesFullLibraryScan(scanInput)) return;
    setLoadingMore(true);
    try {
      const cur = listCursorRef.current;
      const { items, nextCursor } = await listHistoryGlobalDescPage(LIBRARY_PAGE_SIZE, cur);
      if (items.length === 0) {
        setHasMore(false);
        return;
      }
      setList((prev) => [...prev, ...items]);
      setListCursor(nextCursor);
      setHasMore(Boolean(nextCursor));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, scanInput]);

  const reloadFolders = async () => {
    const fs = await getFolders();
    setFolders(fs);
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local') return;
      if (LIBRARY_REV_KEY in changes) void reloadHistory();
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [reloadHistory]);

  return {
    list,
    setList,
    folders,
    setFolders,
    libraryStats,
    loading,
    loadingMore,
    hasMore,
    loadMoreSentinelRef,
    load,
    reloadHistory,
    loadMore,
    reloadFolders,
    usesFullLibraryScan,
  };
}
