import { useCallback, useDeferredValue, useEffect, useMemo, useState, type RefObject } from 'react';
import type { HistoryItem, LibraryFolder } from '@/lib/types';
import type { HistoryLibraryStats } from '@/lib/storage/historyDb';
import type { SortKey, ViewMode } from '../types';
import {
  SYSTEM_NODE,
  TREE_EXPANDED_KEY,
  TREE_SELECTED_KEY,
  TREE_WIDTH_KEY,
  VIEW_STORAGE_KEY,
} from '../types';
import type { SelectedNodeId } from '../FolderTree';
import type { LibraryScanInput } from './libraryScanInput';

export type UseLibraryFiltersDeps = {
  list: HistoryItem[];
  folders: LibraryFolder[];
  libraryStats: HistoryLibraryStats | null;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  usesFullLibraryScan: () => boolean;
  loadMoreSentinelRef: RefObject<HTMLDivElement | null>;
};

export function useLibraryFilters({
  list,
  folders,
  libraryStats,
  loading,
  hasMore,
  loadMore,
  usesFullLibraryScan,
  loadMoreSentinelRef,
}: UseLibraryFiltersDeps) {
  const [keyword, setKeyword] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      return saved === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  });

  const [selectedNode, setSelectedNode] = useState<SelectedNodeId>(() => {
    try {
      const saved = localStorage.getItem(TREE_SELECTED_KEY);
      if (saved) return saved as SelectedNodeId;
    } catch {
      /* ignore */
    }
    return SYSTEM_NODE.ALL;
  });
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(TREE_EXPANDED_KEY);
      if (saved) return new Set(JSON.parse(saved) as string[]);
    } catch {
      /* ignore */
    }
    return new Set();
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TREE_WIDTH_KEY);
      const n = saved ? Number(saved) : NaN;
      if (Number.isFinite(n) && n >= 180 && n <= 480) return n;
    } catch {
      /* ignore */
    }
    return 248;
  });

  const deferredKeyword = useDeferredValue(keyword);

  const scanInput: LibraryScanInput = useMemo(
    () => ({
      deferredKeyword,
      filterProvider,
      filterStyle,
      showPinnedOnly,
      selectedNode,
      sortKey,
    }),
    [deferredKeyword, filterProvider, filterStyle, showPinnedOnly, selectedNode, sortKey],
  );

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem(TREE_SELECTED_KEY, String(selectedNode));
    } catch {
      /* ignore */
    }
  }, [selectedNode]);

  useEffect(() => {
    try {
      localStorage.setItem(TREE_EXPANDED_KEY, JSON.stringify(Array.from(expandedFolderIds)));
    } catch {
      /* ignore */
    }
  }, [expandedFolderIds]);

  useEffect(() => {
    try {
      localStorage.setItem(TREE_WIDTH_KEY, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth]);

  const providerOptions = useMemo(() => libraryStats?.providers ?? [], [libraryStats]);
  const styleOptions = useMemo(() => libraryStats?.styles ?? [], [libraryStats]);
  const countByFolderId = useMemo(
    () => libraryStats?.byFolderId ?? new Map<string, number>(),
    [libraryStats],
  );

  const collectSubtreeIds = useCallback(
    (rootId: string): Set<string> => {
      const acc = new Set<string>([rootId]);
      const stack = [rootId];
      while (stack.length > 0) {
        const cur = stack.pop()!;
        for (const f of folders) {
          if ((f.parentId ?? null) === cur && !acc.has(f.id)) {
            acc.add(f.id);
            stack.push(f.id);
          }
        }
      }
      return acc;
    },
    [folders],
  );

  const filterLibraryItems = useCallback(
    (source: HistoryItem[]) => {
      const lower = keyword.trim().toLowerCase();
      let nm: HistoryItem[];
      if (selectedNode === SYSTEM_NODE.ALL) nm = source;
      else if (selectedNode === SYSTEM_NODE.UNSORTED) nm = source.filter((i) => !i.folderId);
      else if (selectedNode === SYSTEM_NODE.PINNED) nm = source.filter((i) => !!i.pinned);
      else {
        const subtree = collectSubtreeIds(selectedNode as string);
        nm = source.filter((i) => i.folderId && subtree.has(i.folderId));
      }
      let result = nm.filter((i) => {
        if (showPinnedOnly && !i.pinned) return false;
        if (filterProvider !== 'all' && i.provider !== filterProvider) return false;
        if (filterStyle !== 'all' && i.style !== filterStyle) return false;
        if (lower) {
          const hay =
            (i.prompt || '') +
            ' ' +
            (i.note || '') +
            ' ' +
            (i.pageTitle || '') +
            ' ' +
            (i.pageUrl || '');
          if (!hay.toLowerCase().includes(lower)) return false;
        }
        return true;
      });
      result = result.sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        if (sortKey === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortKey === 'versions') return (b.versions?.length || 0) - (a.versions?.length || 0);
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      });
      return result;
    },
    [
      keyword,
      selectedNode,
      collectSubtreeIds,
      showPinnedOnly,
      filterProvider,
      filterStyle,
      sortKey,
    ],
  );

  const filtered = useMemo(() => filterLibraryItems(list), [list, filterLibraryItems]);

  const nodeMatchCount = useMemo(() => {
    if (selectedNode === SYSTEM_NODE.ALL) return libraryStats?.total ?? 0;
    if (selectedNode === SYSTEM_NODE.UNSORTED) return libraryStats?.unsorted ?? 0;
    if (selectedNode === SYSTEM_NODE.PINNED) return libraryStats?.pinned ?? 0;
    const subtree = collectSubtreeIds(selectedNode as string);
    let n = 0;
    for (const fid of subtree) {
      n += countByFolderId.get(fid) || 0;
    }
    return n;
  }, [selectedNode, libraryStats, collectSubtreeIds, countByFolderId]);

  const systemCounts = useMemo(
    () => ({
      all: libraryStats?.total ?? 0,
      unsorted: libraryStats?.unsorted ?? 0,
      pinned: libraryStats?.pinned ?? 0,
    }),
    [libraryStats],
  );

  useEffect(() => {
    if (!hasMore || loading || usesFullLibraryScan()) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { root: null, rootMargin: '280px', threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [
    hasMore,
    loadMore,
    loading,
    usesFullLibraryScan,
    filtered.length,
    list.length,
    loadMoreSentinelRef,
  ]);

  const hasActiveFilter =
    keyword.trim() !== '' ||
    filterProvider !== 'all' ||
    filterStyle !== 'all' ||
    showPinnedOnly ||
    selectedNode !== SYSTEM_NODE.ALL;

  const clearFilters = () => {
    setKeyword('');
    setFilterProvider('all');
    setFilterStyle('all');
    setShowPinnedOnly(false);
    setSelectedNode(SYSTEM_NODE.ALL);
  };

  const selectedNodeLabel = useMemo(() => {
    if (selectedNode === SYSTEM_NODE.ALL) return '全部';
    if (selectedNode === SYSTEM_NODE.UNSORTED) return '未分类';
    if (selectedNode === SYSTEM_NODE.PINNED) return '置顶';
    const f = folders.find((x) => x.id === selectedNode);
    if (!f) return '全部';
    const path: string[] = [];
    let cur: string | null = f.id;
    const guard = new Set<string>();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      const node = folders.find((x) => x.id === cur);
      if (!node) break;
      path.unshift(node.name);
      cur = node.parentId ?? null;
    }
    return path.join(' › ');
  }, [selectedNode, folders]);

  return {
    keyword,
    setKeyword,
    filterProvider,
    setFilterProvider,
    filterStyle,
    setFilterStyle,
    sortKey,
    setSortKey,
    showPinnedOnly,
    setShowPinnedOnly,
    view,
    setView,
    selectedNode,
    setSelectedNode,
    expandedFolderIds,
    setExpandedFolderIds,
    showSidebar,
    setShowSidebar,
    sidebarWidth,
    setSidebarWidth,
    scanInput,
    providerOptions,
    styleOptions,
    countByFolderId,
    collectSubtreeIds,
    filterLibraryItems,
    filtered,
    nodeMatchCount,
    systemCounts,
    hasActiveFilter,
    clearFilters,
    selectedNodeLabel,
  };
}
