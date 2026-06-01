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
import { Surface } from '@/components/ui';
import type { SortKey } from './types';
import { SYSTEM_NODE } from './types';
import { FolderTree } from './FolderTree';
import { ItemRow } from './ItemRow';
import { ItemGridCard } from './ItemGridCard';
import { ViewToggle } from './parts/ViewToggle';
import { FilterGroup } from './parts/FilterGroup';
import { BulkActionBar } from './parts/BulkActionBar';
import { EmptyState } from './parts/EmptyState';
import { NoMatchState } from './parts/NoMatchState';
import type { PromptLibraryViewModel } from './hooks/usePromptLibrary';
import { LibraryFloatingPanel } from './LibraryFloatingPanel';

interface PromptLibraryViewProps {
  vm: PromptLibraryViewModel;
}

export function PromptLibraryView({ vm }: PromptLibraryViewProps) {
  const session = vm.libraryPanelSession;
  const sessionItem = session
    ? (vm.list.find((i) => i.id === session.item.id) ?? session.item)
    : null;

  const NodeIcon =
    vm.selectedNode === SYSTEM_NODE.UNSORTED
      ? Inbox
      : vm.selectedNode === SYSTEM_NODE.PINNED
        ? Pin
        : Layers;

  return (
    <>
      <div className="flex gap-5 items-start">
        {vm.showSidebar && (
          <div className="hidden md:flex sticky top-[88px] max-h-[calc(100vh-120px)] flex-none items-stretch">
            <aside className="card !p-3 overflow-auto" style={{ width: vm.sidebarWidth }}>
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
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startW = vm.sidebarWidth;
                const onMove = (ev: MouseEvent) => {
                  const next = Math.max(180, Math.min(480, startW + (ev.clientX - startX)));
                  vm.setSidebarWidth(next);
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              className="w-1.5 mx-1 rounded-full cursor-col-resize bg-transparent hover:bg-violet-300/40 dark:hover:bg-violet-500/30 transition"
            />
          </div>
        )}

        <div
          className={`flex-1 min-w-0 space-y-5 ${
            vm.selectedIds.size > 0 ? 'pb-24 max-sm:pb-28' : ''
          }`}
        >
          <Surface tone="toolbar" className="p-3 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => vm.setShowSidebar((v) => !v)}
                className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-300 dark:hover:border-violet-500/40 transition flex-none"
                title={vm.showSidebar ? '隐藏目录侧栏' : '显示目录侧栏'}
                aria-label={vm.showSidebar ? '隐藏目录侧栏' : '显示目录侧栏'}
              >
                <FolderTreeIcon className="w-3.5 h-3.5" />
              </button>

              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 flex-none">
                <NodeIcon className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span className="truncate max-w-[200px]" title={vm.selectedNodeLabel}>
                  {vm.selectedNodeLabel}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500 tabular-nums">
                  {vm.nodeMatchCount}
                </span>
              </span>

              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  className="input !pl-8 !py-1.5 !text-xs"
                  value={vm.keyword}
                  onChange={(e) => vm.setKeyword(e.target.value)}
                  placeholder="搜索 prompt / 备注 / 页面标题 / URL…"
                />
                {vm.keyword && (
                  <button
                    onClick={() => vm.setKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-none">
                <ViewToggle view={vm.view} onChange={vm.setView} />
                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
                <button
                  onClick={vm.onCopyAllPrompts}
                  disabled={(vm.libraryStats?.total ?? 0) === 0}
                  className="btn-ghost text-[11px] !px-2 !py-1 disabled:opacity-50"
                  title="复制（选中或全部筛选结果）的提示词"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
                <button
                  onClick={vm.onExport}
                  disabled={(vm.libraryStats?.total ?? 0) === 0}
                  className="btn-ghost text-[11px] !px-2 !py-1 disabled:opacity-50"
                  title="导出选中或全部记录为 JSON"
                >
                  <Download className="w-3 h-3" /> 导出
                </button>
                <button
                  onClick={vm.onClearAll}
                  disabled={(vm.libraryStats?.total ?? 0) === 0}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-50 transition"
                  title="清空全部记录"
                >
                  <Eraser className="w-3 h-3" /> 清空
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <FilterGroup
                icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                label="供应商"
                options={[
                  { value: 'all', label: '全部' },
                  ...vm.providerOptions.map((p) => ({ value: p, label: p })),
                ]}
                value={vm.filterProvider}
                onChange={vm.setFilterProvider}
              />
              <FilterGroup
                label="风格"
                options={[
                  { value: 'all', label: '全部' },
                  ...vm.styleOptions.map((p) => ({ value: p, label: p })),
                ]}
                value={vm.filterStyle}
                onChange={vm.setFilterStyle}
              />
              <FilterGroup
                icon={<ArrowUpDown className="w-3.5 h-3.5" />}
                label="排序"
                options={[
                  { value: 'updated', label: '最近更新' },
                  { value: 'created', label: '最早创建' },
                  { value: 'versions', label: '版本数' },
                ]}
                value={vm.sortKey}
                onChange={(v) => vm.setSortKey(v as SortKey)}
              />
              <button
                onClick={() => vm.setShowPinnedOnly((v) => !v)}
                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition ${
                  vm.showPinnedOnly
                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-amber-300 dark:hover:border-amber-500/30'
                }`}
              >
                <Pin className="w-3 h-3" /> 只看置顶
              </button>

              {vm.hasActiveFilter && (
                <button
                  onClick={vm.clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition"
                >
                  <X className="w-3 h-3" /> 清除筛选
                </button>
              )}

              <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-500">
                {vm.filtered.length !== vm.list.length && (
                  <span>
                    匹配 <b className="text-zinc-700 dark:text-zinc-200">{vm.filtered.length}</b> /{' '}
                    {vm.list.length}
                  </span>
                )}
                {vm.actionTip && (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      vm.actionTip.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {vm.actionTip.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {vm.actionTip.msg}
                  </span>
                )}
              </div>
            </div>
          </Surface>

          {vm.loading ? (
            <div className="card text-center text-sm text-zinc-500 py-10">
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-violet-500" />
              加载中…
            </div>
          ) : (vm.libraryStats?.total ?? 0) === 0 ? (
            <EmptyState />
          ) : vm.filtered.length === 0 ? (
            <NoMatchState onClear={vm.clearFilters} />
          ) : vm.view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
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
            <ul className="space-y-2.5">
              {vm.filtered.map((item) => (
                <li
                  key={item.id}
                  data-history-id={item.id}
                  className={`card !p-0 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-px ${
                    item.pinned ? 'border-l-4 !border-l-amber-400 dark:!border-l-amber-500/60' : ''
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
              {vm.loadingMore ? <Loader2 className="w-4 h-4 animate-spin text-violet-500" /> : null}
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
