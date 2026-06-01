import * as React from 'react';
import { useRef, useState } from 'react';
import { Pin, PinOff, Trash2, StickyNote, FolderInput, Folder, Image } from 'lucide-react';
import type { HistoryItem, LibraryFolder } from '@/lib/types';
import { formatTime } from '@/lib/format/time';
import { UI_ACTION } from '@/lib/uiCopy';
import { CopyFeedbackLabel } from '@/components/ui';
import { Thumb } from './Thumb';
import { MoveToMenu } from './parts/MoveToMenu';
import { getProjectColor } from './types';
import { SelectCheckbox } from './SelectCheckbox';

// ============== 列表行卡片 ==============

export function ItemRow({
  item,
  checked,
  copiedKey,
  folders,
  selectedIds,
  onToggleSelect,
  onCopy,
  onTogglePin,
  onOpenPanel,
  onJumpToOriginal,
  jumpBusy,
  onDelete,
  onMoveTo,
}: {
  item: HistoryItem;
  checked: boolean;
  copiedKey: string | null;
  folders: LibraryFolder[];
  /** 用于拖拽时携带的「同时被选中的 id 集合」，单条拖拽时也只带自身 id */
  selectedIds: Set<string>;
  onToggleSelect: () => void;
  onCopy: (text: string, key: string) => void;
  onTogglePin: () => void;
  onOpenPanel: () => void;
  onJumpToOriginal: () => void;
  jumpBusy?: boolean;
  onDelete: () => void;
  /** 单条移动到目标文件夹（null = 未分类） */
  onMoveTo?: (folderId: string | null) => void;
}) {
  const versionCount = item.versions?.length || 0;
  const [moveOpen, setMoveOpen] = useState(false);
  const moveBtnRef = useRef<HTMLButtonElement>(null);
  const folder = item.folderId ? folders.find((f) => f.id === item.folderId) : undefined;
  const folderColor = folder ? getProjectColor(folder.color) : null;
  const canJump = !!item.pageUrl && /^https?:/i.test(item.pageUrl);
  // 让用户点击整行任意空白处打开浮动面板；同时仍要支持划选 prompt 文本
  // 与点击内部按钮、checkbox（这些 handler 自己已 stopPropagation）。
  const onRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (sel && sel.toString().length > 0 && sel.containsNode(e.currentTarget, true)) return;
    onOpenPanel();
  };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const ids =
      selectedIds.size > 1 && selectedIds.has(item.id) ? Array.from(selectedIds) : [item.id];
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-history-ids', JSON.stringify(ids));
  };

  return (
    <div
      className="group flex items-center gap-3 p-3.5 cursor-pointer select-text hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition"
      onClick={onRowClick}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenPanel();
        }
      }}
    >
      <Thumb item={item} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-zinc-500 mb-1">
          {item.pinned && (
            <span className="px-1.5 py-px rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 font-medium">
              <Pin className="w-3 h-3" /> 置顶
            </span>
          )}
          <span className="px-1.5 py-px rounded bg-zinc-100 dark:bg-zinc-800 font-medium">
            {item.provider}
          </span>
          <span className="font-mono truncate max-w-[200px] text-zinc-500">{item.model}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span>{item.style}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span>{formatTime(item.updatedAt || item.createdAt)}</span>
          {versionCount > 0 && (
            <span className="px-1.5 py-px rounded bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
              v{versionCount}
            </span>
          )}
          {folder && folderColor && (
            <span
              className="px-1.5 py-px rounded bg-zinc-100 dark:bg-zinc-800 inline-flex items-center gap-1 max-w-[160px] truncate"
              title={`项目 / 文件夹：${folder.name}`}
            >
              <span className={`w-2 h-2 rounded-full ${folderColor.dot} flex-none`} />
              <span className="truncate">{folder.name}</span>
            </span>
          )}
          {item.note && (
            <span className="px-1.5 py-px rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 max-w-[220px] truncate">
              <StickyNote className="w-3 h-3 flex-none" />
              <span className="truncate">{item.note}</span>
            </span>
          )}
        </div>
        <p className="text-[13px] leading-[1.6] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words line-clamp-3">
          {item.prompt || <span className="text-zinc-400 italic">（空）</span>}
        </p>

        <div className="mt-2 flex items-center gap-1 flex-wrap text-[11px]">
          <button
            onClick={(e) => {
              stop(e);
              onCopy(item.prompt, `cur:${item.id}`);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
          >
            <CopyFeedbackLabel active={copiedKey === `cur:${item.id}`} />
          </button>
          <button
            onClick={(e) => {
              stop(e);
              onTogglePin();
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition ${
              item.pinned
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-300'
            }`}
            title={item.pinned ? '取消置顶' : '置顶'}
          >
            {item.pinned ? (
              <>
                <PinOff className="w-3 h-3" /> 取消置顶
              </>
            ) : (
              <>
                <Pin className="w-3 h-3" /> 置顶
              </>
            )}
          </button>
          <button
            onClick={(e) => {
              stop(e);
              onJumpToOriginal();
            }}
            disabled={!canJump || jumpBusy}
            title={canJump ? UI_ACTION.jumpToOriginalTitle : '该记录没有可用的原图网页地址'}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Image className="w-3 h-3" />
            {jumpBusy ? '跳转中…' : UI_ACTION.jumpToOriginal}
          </button>
          {onMoveTo && (
            <>
              <button
                ref={moveBtnRef}
                onClick={(e) => {
                  stop(e);
                  setMoveOpen((v) => !v);
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition ${
                  folder
                    ? 'text-amber-600 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title={folder ? `当前在「${folder.name}」` : '把这条移动到项目 / 文件夹'}
              >
                {folder ? <Folder className="w-3 h-3" /> : <FolderInput className="w-3 h-3" />}
                {folder ? '所在' : '移动到'}
              </button>
              {moveOpen && (
                <MoveToMenu
                  anchorRef={moveBtnRef}
                  folders={folders}
                  currentFolderId={item.folderId ?? null}
                  onClose={() => setMoveOpen(false)}
                  onPick={(fid) => {
                    setMoveOpen(false);
                    onMoveTo(fid);
                  }}
                  align="left"
                />
              )}
            </>
          )}
          <button
            onClick={(e) => {
              stop(e);
              onDelete();
            }}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="删除这条记录"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <SelectCheckbox checked={checked} onToggle={onToggleSelect} className="shrink-0 ml-1" />
    </div>
  );
}
