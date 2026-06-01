import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  clearHistory,
  exportAllHistoryPublic,
  getHistoryItem,
  patchHistoryItem,
  removeHistory,
  removeHistoryItems,
} from '@/lib/storage';
import { sendOpenInPanel } from '@/lib/messaging/openSurfaces';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import type { HistoryItem } from '@/lib/types';
import type { HistoryLibraryStats } from '@/lib/storage/historyDb';
import { SYSTEM_NODE } from '../types';
import type { LibraryDockIntent } from '../types';
import type { SelectedNodeId } from '../FolderTree';
import type { ViewMode } from '../types';

export type UseLibrarySelectionDeps = {
  focusId?: string | null;
  onConsumeFocus?: () => void;
  dockIntent?: LibraryDockIntent;
  onConsumeDockIntent?: () => void;
  openLibraryPanel: (item: HistoryItem, dock?: LibraryDockIntent) => void;
  closeLibraryPanel?: () => void;
  list: HistoryItem[];
  setList: Dispatch<SetStateAction<HistoryItem[]>>;
  loading: boolean;
  libraryStats: HistoryLibraryStats | null;
  reloadHistory: () => Promise<void>;
  filtered: HistoryItem[];
  filterLibraryItems: (source: HistoryItem[]) => HistoryItem[];
  showTip: (ok: boolean, msg: string) => void;
  setView: (view: ViewMode) => void;
  setKeyword: (value: string) => void;
  setFilterProvider: (value: string) => void;
  setFilterStyle: (value: string) => void;
  setShowPinnedOnly: (value: boolean) => void;
  setSelectedNode: (node: SelectedNodeId) => void;
};

export function useLibrarySelection({
  focusId,
  onConsumeFocus,
  dockIntent,
  onConsumeDockIntent,
  openLibraryPanel,
  closeLibraryPanel,
  list,
  setList,
  loading,
  libraryStats,
  reloadHistory,
  filtered,
  filterLibraryItems,
  showTip,
  setView,
  setKeyword,
  setFilterProvider,
  setFilterStyle,
  setShowPinnedOnly,
  setSelectedNode,
}: UseLibrarySelectionDeps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { copiedKey, onCopy } = useCopyFeedback();
  const [jumpingId, setJumpingId] = useState<string | null>(null);

  const openInPanel = useCallback(
    (item: HistoryItem, dock?: LibraryDockIntent) => {
      openLibraryPanel(item, dock ?? null);
    },
    [openLibraryPanel],
  );

  const onJumpToOriginal = useCallback(
    (item: HistoryItem) => {
      if (!/^https?:/i.test(item.pageUrl)) return;
      if (jumpingId) return;
      setJumpingId(item.id);
      sendOpenInPanel(item.id, {
        onResponse: (resp, lastErr) => {
          setJumpingId(null);
          if (lastErr || !resp) {
            showTip(false, lastErr || '后台未响应');
            return;
          }
          if (!resp.ok) {
            showTip(false, resp.error || '跳转失败');
            return;
          }
          closeLibraryPanel?.();
          showTip(true, '已跳转到原图页面');
        },
      });
    },
    [jumpingId, showTip, closeLibraryPanel],
  );

  useEffect(() => {
    if (!focusId || loading) return;
    const target = list.find((i) => i.id === focusId);
    if (!target) {
      void getHistoryItem(focusId).then((one) => {
        if (!one) onConsumeFocus?.();
        else setList((prev) => (prev.some((x) => x.id === one.id) ? prev : [one, ...prev]));
      });
      return;
    }
    setView('list');
    setKeyword('');
    setFilterProvider('all');
    setFilterStyle('all');
    setShowPinnedOnly(false);
    setSelectedNode(SYSTEM_NODE.ALL);
    const t = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-history-id="${focusId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onConsumeFocus?.();
      if (dockIntent) {
        openInPanel(target, dockIntent);
        onConsumeDockIntent?.();
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [
    focusId,
    loading,
    list,
    dockIntent,
    onConsumeFocus,
    onConsumeDockIntent,
    setList,
    setView,
    setKeyword,
    setFilterProvider,
    setFilterStyle,
    setShowPinnedOnly,
    setSelectedNode,
    openInPanel,
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const onTogglePin = async (item: HistoryItem) => {
    await patchHistoryItem(item.id, { pinned: !item.pinned });
    await reloadHistory();
  };

  const onDeleteItem = async (item: HistoryItem) => {
    if (!confirm(`删除这条记录？(${item.versions?.length || 0} 个版本将一同丢失)`)) return;
    await removeHistory(item.id);
    selectedIds.delete(item.id);
    setSelectedIds(new Set(selectedIds));
    await reloadHistory();
  };

  const onBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 条记录吗？`)) return;
    await removeHistoryItems(Array.from(selectedIds));
    setSelectedIds(new Set());
    await reloadHistory();
  };

  const onClearAll = async () => {
    const total = libraryStats?.total ?? 0;
    if (total === 0) return;
    if (!confirm(`确定清空全部 ${total} 条记录吗？此操作不可撤销`)) return;
    await clearHistory();
    setSelectedIds(new Set());
    await reloadHistory();
  };

  const onExport = async () => {
    const full = await exportAllHistoryPublic();
    const exportList =
      selectedIds.size > 0 ? full.filter((i) => selectedIds.has(i.id)) : filterLibraryItems(full);
    if (exportList.length === 0) {
      showTip(false, '没有可导出的记录');
      return;
    }
    const data = JSON.stringify(
      { exportedAt: new Date().toISOString(), count: exportList.length, items: exportList },
      null,
      2,
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-library-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showTip(true, `已导出 ${exportList.length} 条 JSON`);
  };

  const onCopyAllPrompts = async () => {
    const full = await exportAllHistoryPublic();
    const target =
      selectedIds.size > 0 ? full.filter((i) => selectedIds.has(i.id)) : filterLibraryItems(full);
    if (target.length === 0) {
      showTip(false, '没有可复制的提示词');
      return;
    }
    const text = target
      .map((i, idx) => `# ${idx + 1}. ${i.pageTitle || i.id}\n${i.prompt}`)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
    showTip(true, `已复制 ${target.length} 条提示词`);
  };

  return {
    selectedIds,
    setSelectedIds,
    copiedKey,
    onCopy,
    toggleSelect,
    selectAllVisible,
    clearSelection,
    onTogglePin,
    onOpenInPanel: openInPanel,
    onJumpToOriginal,
    jumpingId,
    onDeleteItem,
    onBulkDelete,
    onClearAll,
    onExport,
    onCopyAllPrompts,
  };
}
