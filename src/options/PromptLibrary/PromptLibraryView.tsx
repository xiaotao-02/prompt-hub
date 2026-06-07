import { useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Copy,
  Check,
  Pin,
  X,
  Loader2,
  Search,
  Download,
  Eraser,
  ArrowUpDown,
  Layers,
  SlidersHorizontal,
  FolderTree as FolderTreeIcon,
  Inbox,
} from 'lucide-react';
import { AsyncStateBlock } from '@/components/AsyncStateBlock';
import { Button, Surface, cx } from '@/components/ui';
import { outputStyleLabel } from '@/lib/strategies-meta';
import type { SortKey } from './types';
import { SYSTEM_NODE } from './types';
import { FolderTree } from './FolderTree';
import { ItemRow } from './ItemRow';
import { ItemGridCard } from './ItemGridCard';
import { ViewToggle } from './parts/ViewToggle';
import { FilterSelect } from './parts/FilterSelect';
import { BulkActionBar } from './parts/BulkActionBar';
import { EmptyState } from './parts/EmptyState';
import { NoMatchState } from './parts/NoMatchState';
import type { PromptLibraryViewModel } from './hooks/usePromptLibrary';
import { LibraryFloatingPanel } from './LibraryFloatingPanel';

interface PromptLibraryViewProps {
  vm: PromptLibraryViewModel;
}

export function PromptLibraryView({ vm }: PromptLibraryViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const session = vm.libraryPanelSession;
  const sessionItem = session
    ? (vm.list.find((i) => i.id === session.item.id) ?? session.item)
    : null;

  const sidebarWidthStyle = {
    '--library-sidebar-width': `${vm.sidebarWidth}px`,
  } as CSSProperties;

  const handleSidebarResizeMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!vm.showSidebar || e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startW = vm.sidebarWidth;
    setIsResizing(true);
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(180, Math.min(480, startW + (ev.clientX - startX)));
      vm.setSidebarWidth(next);
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const NodeIcon =
    vm.selectedNode === SYSTEM_NODE.UNSORTED
      ? Inbox
      : vm.selectedNode === SYSTEM_NODE.PINNED
        ? Pin
        : Layers;

  const hasExtraFilter =
    vm.keyword.trim() !== '' || vm.filterProvider !== 'all' || vm.filterStyle !== 'all';

  const handleNodeChipClick = () => {
    if (vm.selectedNode !== SYSTEM_NODE.ALL) {
      vm.setSelectedNode(SYSTEM_NODE.ALL);
      return;
    }
    if (hasExtraFilter) vm.clearFilters();
  };

  const nodeChipTitle =
    vm.selectedNode !== SYSTEM_NODE.ALL
      ? '切换到全部'
      : hasExtraFilter
        ? '清除筛选，显示全部提示词'
        : vm.selectedNodeLabel;

  return (
    <>
      <div className="flex items-start">
        <div
          className={cx(
            'library-folder-sidebar hidden md:flex sticky top-[88px] max-h-[calc(100vh-120px)] items-stretch',
            vm.showSidebar && 'library-folder-sidebar-open',
            isResizing && 'library-folder-sidebar-resizing',
          )}
          style={sidebarWidthStyle}
          aria-hidden={!vm.showSidebar}
        >
          <aside className="library-folder-sidebar-aside rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 !p-3 overflow-auto shadow-sm">
            <FolderTree
              folders={vm.folders}
              countByFolderId={vm.countByFolderId}
              systemCounts={vm.systemCounts}
              selectedId={vm.selectedNode}
              expandedIds={vm.expandedFolderIds}
              onSelect={vm.setSelectedNode}
              onToggleExpand={vm.handleToggleExpand}
              onCreateProject={vm.handleCreateProject}
              onCreateChild={vm.handleCreateChild}
              onRename={vm.handleRename}
              onDelete={vm.handleDelete}
              onChangeColor={vm.handleChangeColor}
              onDropItems={(ids, fid) => void vm.handleMoveItems(ids, fid)}
            />
          </aside>
          <div
            role="separator"
            aria-orientation="vertical"
            title="拖动调整目录宽度"
            onMouseDown={handleSidebarResizeMouseDown}
            className="w-1.5 mx-1 rounded-full cursor-col-resize bg-transparent hover:bg-zinc-300/60 dark:hover:bg-zinc-600/50 transition"
          />
        </div>

        <div
          className={`flex-1 min-w-0 space-y-5 ${
            vm.selectedIds.size > 0 ? 'pb-24 max-sm:pb-28' : ''
          }`}
        >
          <Surface tone="toolbar" className="p-3">
            <div className="flex items-center gap-2 min-w-0 flex-wrap md:flex-nowrap">
              <button
                onClick={() => vm.setShowSidebar((v) => !v)}
                className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition flex-none"
                title={vm.showSidebar ? '隐藏目录侧栏' : '显示目录侧栏'}
                aria-label={vm.showSidebar ? '隐藏目录侧栏' : '显示目录侧栏'}
              >
                <FolderTreeIcon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNodeChipClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-300 shrink-0 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ui-focus ui-transition"
                title={nodeChipTitle}
                aria-label={
                  vm.selectedNode !== SYSTEM_NODE.ALL || hasExtraFilter
                    ? '查看全部提示词'
                    : `${vm.selectedNodeLabel}，${vm.nodeMatchCount} 条`
                }
              >
                <NodeIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <span className="truncate max-w-[140px] font-medium">{vm.selectedNodeLabel}</span>
                <span className="text-zinc-400 dark:text-zinc-500 tabular-nums font-normal">
                  {vm.nodeMatchCount}
                </span>
              </button>

              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  className="input !pl-8 !py-1.5 !text-xs"
                  value={vm.keyword}
                  onChange={(e) => vm.setKeyword(e.target.value)}
                  placeholder="搜索 prompt / 备注 / 页面标题 / URL…"
                />
                {vm.keyword && (
                  <button
                    type="button"
                    onClick={() => vm.setKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <FilterSelect
                compact
                icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                label="供应商"
                options={[
                  { value: 'all', label: '全部' },
                  ...vm.providerOptions.map((p) => ({ value: p, label: p })),
                ]}
                value={vm.filterProvider}
                onChange={vm.setFilterProvider}
              />
              <FilterSelect
                compact
                label="风格"
                options={[
                  { value: 'all', label: '全部' },
                  ...vm.styleOptions.map((p) => ({ value: p, label: outputStyleLabel(p) })),
                ]}
                value={vm.filterStyle}
                onChange={vm.setFilterStyle}
              />
              <FilterSelect
                compact
                icon={<ArrowUpDown className="w-3.5 h-3.5" />}
                label="排序"
                options={[
                  { value: 'updated', label: '最近更新' },
                  { value: 'created', label: '最新创建' },
                  { value: 'versions', label: '版本数' },
                ]}
                value={vm.sortKey}
                onChange={(v) => vm.setSortKey(v as SortKey)}
                highlightWhen={(v) => v !== 'updated'}
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <ViewToggle view={vm.view} onChange={vm.setView} />
                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={vm.onCopyAllPrompts}
                  disabled={(vm.libraryStats?.total ?? 0) === 0}
                  title="复制（选中或全部筛选结果）的提示词"
                >
                  <Copy className="w-3 h-3" /> 复制
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={vm.onExport}
                  disabled={(vm.libraryStats?.total ?? 0) === 0}
                  title="导出选中或全部记录为 JSON"
                >
                  <Download className="w-3 h-3" /> 导出
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="xs"
                  onClick={vm.onClearAll}
                  disabled={(vm.libraryStats?.total ?? 0) === 0}
                  title="清空全部记录"
                >
                  <Eraser className="w-3 h-3" /> 清空
                </Button>
              </div>

              <div className="ml-auto flex items-center gap-2 shrink-0 text-[11px] text-zinc-500">
                {vm.hasActiveFilter && (
                  <button
                    type="button"
                    onClick={vm.clearFilters}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition"
                  >
                    <X className="w-3 h-3" /> 清除筛选
                  </button>
                )}
                {vm.filtered.length !== vm.list.length && (
                  <span className="whitespace-nowrap">
                    匹配 <b className="text-zinc-700 dark:text-zinc-200">{vm.filtered.length}</b> /{' '}
                    {vm.list.length}
                  </span>
                )}
                {vm.actionTip && (
                  <span
                    className={`inline-flex max-w-[160px] items-center gap-1 truncate ${
                      vm.actionTip.ok ? 'text-zinc-600 dark:text-zinc-300' : 'text-rose-500'
                    }`}
                    title={vm.actionTip.msg}
                  >
                    {vm.actionTip.ok ? (
                      <Check className="w-3 h-3 shrink-0" />
                    ) : (
                      <X className="w-3 h-3 shrink-0" />
                    )}
                    {vm.actionTip.msg}
                  </span>
                )}
              </div>
            </div>
          </Surface>

          {vm.loading ? (
            <AsyncStateBlock state="loading" />
          ) : vm.loadError ? (
            <AsyncStateBlock
              state="error"
              errorTitle="提示词库加载失败"
              errorMessage={vm.loadError}
            />
          ) : (vm.libraryStats?.total ?? 0) === 0 ? (
            <EmptyState />
          ) : vm.filtered.length === 0 ? (
            <NoMatchState onClear={vm.clearFilters} />
          ) : vm.view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-2.5 sm:gap-3">
              {vm.filtered.map((item) => (
                <ItemGridCard
                  key={item.id}
                  item={item}
                  checked={vm.selectedIds.has(item.id)}
                  copiedKey={vm.copiedKey}
                  folders={vm.folders}
                  selectedIds={vm.selectedIds}
                  onToggleSelect={() => vm.toggleSelect(item.id)}
                  onCopy={vm.onCopy}
                  onTogglePin={() => vm.onTogglePin(item)}
                  onOpenPanel={() => vm.onOpenInPanel(item)}
                  onJumpToOriginal={() => vm.onJumpToOriginal(item)}
                  jumpBusy={vm.jumpingId === item.id}
                  onDelete={() => vm.onDeleteItem(item)}
                  onMoveTo={vm.handleMoveOne(item)}
                />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {vm.filtered.map((item) => (
                <li
                  key={item.id}
                  data-history-id={item.id}
                  className={`rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 !p-0 overflow-hidden transition-shadow duration-150 hover:shadow-sm ${
                    item.pinned
                      ? 'border-l-2 !border-l-violet-400/70 dark:!border-l-violet-500/50'
                      : ''
                  }`}
                >
                  <ItemRow
                    item={item}
                    checked={vm.selectedIds.has(item.id)}
                    copiedKey={vm.copiedKey}
                    folders={vm.folders}
                    selectedIds={vm.selectedIds}
                    onToggleSelect={() => vm.toggleSelect(item.id)}
                    onCopy={vm.onCopy}
                    onTogglePin={() => vm.onTogglePin(item)}
                    onOpenPanel={() => vm.onOpenInPanel(item)}
                    onJumpToOriginal={() => vm.onJumpToOriginal(item)}
                    jumpBusy={vm.jumpingId === item.id}
                    onDelete={() => vm.onDeleteItem(item)}
                    onMoveTo={vm.handleMoveOne(item)}
                  />
                </li>
              ))}
            </ul>
          )}

          {vm.hasMore && !vm.usesFullLibraryScan() && (
            <div
              ref={vm.loadMoreSentinelRef}
              className="flex justify-center items-center gap-2 py-8 text-xs text-zinc-500"
            >
              {vm.loadingMore ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : null}
              <span>{vm.loadingMore ? '加载更多…' : '下滑加载更多'}</span>
            </div>
          )}

          {vm.selectedIds.size > 0 && (
            <BulkActionBar
              count={vm.selectedIds.size}
              allVisibleSelected={
                vm.filtered.length > 0 && vm.filtered.every((i) => vm.selectedIds.has(i.id))
              }
              folders={vm.folders}
              onSelectAll={vm.selectAllVisible}
              onClear={vm.clearSelection}
              onCopy={vm.onCopyAllPrompts}
              onExport={vm.onExport}
              onDelete={vm.onBulkDelete}
              onMoveTo={vm.onBulkMove}
            />
          )}
        </div>
      </div>
      {session && sessionItem ? (
        <LibraryFloatingPanel
          item={sessionItem}
          dock={session.dock}
          onClose={vm.closeLibraryPanel}
          onItemUpdated={() => void vm.reloadHistory()}
          showTip={vm.showActionTip}
        />
      ) : null}
    </>
  );
}
