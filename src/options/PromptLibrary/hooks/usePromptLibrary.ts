import { useMemo, useRef, type RefObject } from 'react';
import type { HistoryItem, LibraryFolder } from '@/lib/types';
import type { HistoryLibraryStats } from '@/lib/storage/historyDb';
import type { LibraryDockIntent } from '../types';
import { DEFAULT_LIBRARY_SCAN_INPUT } from './libraryScanInput';
import { useLibraryData } from './useLibraryData';
import { useLibraryFilters } from './useLibraryFilters';
import { useLibraryFolders } from './useLibraryFolders';
import { useLibrarySelection } from './useLibrarySelection';
import { useLibraryFloatingPanel } from './useLibraryFloatingPanel';
import { useActionTip } from '@/hooks/useActionTip';

export interface UsePromptLibraryOptions {
  focusId?: string | null;
  onConsumeFocus?: () => void;
  dockIntent?: LibraryDockIntent;
  onConsumeDockIntent?: () => void;
}

type DataSnapshot = {
  list: HistoryItem[];
  folders: LibraryFolder[];
  libraryStats: HistoryLibraryStats | null;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  usesFullLibraryScan: () => boolean;
  loadMoreSentinelRef: RefObject<HTMLDivElement | null>;
};

const INITIAL_DATA_SNAPSHOT: DataSnapshot = {
  list: [],
  folders: [],
  libraryStats: null,
  loading: true,
  hasMore: false,
  loadMore: async () => {},
  usesFullLibraryScan: () => false,
  loadMoreSentinelRef: { current: null },
};

export function usePromptLibrary({
  focusId,
  onConsumeFocus,
  dockIntent,
  onConsumeDockIntent,
}: UsePromptLibraryOptions) {
  const { actionTip, showTip } = useActionTip();

  const dataSnapshotRef = useRef<DataSnapshot>(INITIAL_DATA_SNAPSHOT);

  const filters = useLibraryFilters({
    list: dataSnapshotRef.current.list,
    folders: dataSnapshotRef.current.folders,
    libraryStats: dataSnapshotRef.current.libraryStats,
    loading: dataSnapshotRef.current.loading,
    hasMore: dataSnapshotRef.current.hasMore,
    loadMore: dataSnapshotRef.current.loadMore,
    usesFullLibraryScan: dataSnapshotRef.current.usesFullLibraryScan,
    loadMoreSentinelRef: dataSnapshotRef.current.loadMoreSentinelRef,
  });

  const data = useLibraryData(filters.scanInput ?? DEFAULT_LIBRARY_SCAN_INPUT);

  dataSnapshotRef.current = {
    list: data.list,
    folders: data.folders,
    libraryStats: data.libraryStats,
    loading: data.loading,
    hasMore: data.hasMore,
    loadMore: data.loadMore,
    usesFullLibraryScan: data.usesFullLibraryScan,
    loadMoreSentinelRef: data.loadMoreSentinelRef,
  };

  const filtered = useMemo(
    () => filters.filterLibraryItems(data.list),
    // filters 对象每轮新建，filterLibraryItems 已是稳定引用
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable filterLibraryItems
    [data.list, filters.filterLibraryItems],
  );

  const floatingPanel = useLibraryFloatingPanel();

  const selection = useLibrarySelection({
    focusId,
    onConsumeFocus,
    dockIntent,
    onConsumeDockIntent,
    openLibraryPanel: floatingPanel.openLibraryPanel,
    closeLibraryPanel: floatingPanel.closeLibraryPanel,
    list: data.list,
    setList: data.setList,
    loading: data.loading,
    libraryStats: data.libraryStats,
    reloadHistory: data.reloadHistory,
    filtered,
    filterLibraryItems: filters.filterLibraryItems,
    showTip,
    setView: filters.setView,
    setKeyword: filters.setKeyword,
    setFilterProvider: filters.setFilterProvider,
    setFilterStyle: filters.setFilterStyle,
    setShowPinnedOnly: filters.setShowPinnedOnly,
    setSelectedNode: filters.setSelectedNode,
  });

  const folders = useLibraryFolders({
    folders: data.folders,
    reloadFolders: data.reloadFolders,
    reloadHistory: data.reloadHistory,
    showTip,
    collectSubtreeIds: filters.collectSubtreeIds,
    countByFolderId: filters.countByFolderId,
    selectedNode: filters.selectedNode,
    setSelectedNode: filters.setSelectedNode,
    setExpandedFolderIds: filters.setExpandedFolderIds,
    selectedIds: selection.selectedIds,
    setSelectedIds: selection.setSelectedIds,
  });

  return {
    list: data.list,
    folders: data.folders,
    libraryStats: data.libraryStats,
    loading: data.loading,
    loadingMore: data.loadingMore,
    hasMore: data.hasMore,
    loadMoreSentinelRef: data.loadMoreSentinelRef,
    keyword: filters.keyword,
    setKeyword: filters.setKeyword,
    filterProvider: filters.filterProvider,
    setFilterProvider: filters.setFilterProvider,
    filterStyle: filters.filterStyle,
    setFilterStyle: filters.setFilterStyle,
    sortKey: filters.sortKey,
    setSortKey: filters.setSortKey,
    showPinnedOnly: filters.showPinnedOnly,
    setShowPinnedOnly: filters.setShowPinnedOnly,
    view: filters.view,
    setView: filters.setView,
    selectedNode: filters.selectedNode,
    setSelectedNode: filters.setSelectedNode,
    expandedFolderIds: filters.expandedFolderIds,
    showSidebar: filters.showSidebar,
    setShowSidebar: filters.setShowSidebar,
    sidebarWidth: filters.sidebarWidth,
    setSidebarWidth: filters.setSidebarWidth,
    selectedIds: selection.selectedIds,
    copiedKey: selection.copiedKey,
    actionTip,
    showActionTip: showTip,
    providerOptions: filters.providerOptions,
    styleOptions: filters.styleOptions,
    countByFolderId: filters.countByFolderId,
    filtered,
    nodeMatchCount: filters.nodeMatchCount,
    systemCounts: filters.systemCounts,
    hasActiveFilter: filters.hasActiveFilter,
    clearFilters: filters.clearFilters,
    selectedNodeLabel: filters.selectedNodeLabel,
    usesFullLibraryScan: data.usesFullLibraryScan,
    reloadHistory: data.reloadHistory,
    onCopy: selection.onCopy,
    toggleSelect: selection.toggleSelect,
    selectAllVisible: selection.selectAllVisible,
    clearSelection: selection.clearSelection,
    onTogglePin: selection.onTogglePin,
    onOpenInPanel: selection.onOpenInPanel,
    onJumpToOriginal: selection.onJumpToOriginal,
    jumpingId: selection.jumpingId,
    onDeleteItem: selection.onDeleteItem,
    onBulkDelete: selection.onBulkDelete,
    onClearAll: selection.onClearAll,
    onExport: selection.onExport,
    onCopyAllPrompts: selection.onCopyAllPrompts,
    handleToggleExpand: folders.handleToggleExpand,
    handleCreateProject: folders.handleCreateProject,
    handleCreateChild: folders.handleCreateChild,
    handleRename: folders.handleRename,
    handleDelete: folders.handleDelete,
    handleChangeColor: folders.handleChangeColor,
    handleMoveItems: folders.handleMoveItems,
    handleMoveOne: folders.handleMoveOne,
    onBulkMove: folders.onBulkMove,
    libraryPanelSession: floatingPanel.session,
    closeLibraryPanel: floatingPanel.closeLibraryPanel,
  };
}

export type PromptLibraryViewModel = ReturnType<typeof usePromptLibrary>;
