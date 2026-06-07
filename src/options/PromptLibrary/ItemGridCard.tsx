import * as React from 'react';
import { useRef, useState } from 'react';
import { Copy, Check, Pin, Trash2, FolderInput, Image } from 'lucide-react';
import type { HistoryItem, LibraryFolder } from '@/lib/types';
import { formatTime } from '@/lib/format/time';
import { outputStyleLabel } from '@/lib/strategies-meta';
import { UI_ACTION } from '@/lib/uiCopy';
import { Thumb } from './Thumb';
import { IconBtn } from './IconBtn';
import { MoveToMenu } from './parts/MoveToMenu';
import { getProjectColor } from './types';
import { SelectCheckbox } from './SelectCheckbox';

// ============== 网格卡片 ==============

export function ItemGridCard({
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
  selectedIds: Set<string>;
  onToggleSelect: () => void;
  onCopy: (text: string, key: string) => void;
  onTogglePin: () => void;
  onOpenPanel: () => void;
  onJumpToOriginal: () => void;
  jumpBusy?: boolean;
  onDelete: () => void;
  onMoveTo?: (folderId: string | null) => void;
}) {
  const versionCount = item.versions?.length || 0;
  const [moveOpen, setMoveOpen] = useState(false);
  const moveBtnWrapRef = useRef<HTMLDivElement>(null);
  const folder = item.folderId ? folders.find((f) => f.id === item.folderId) : undefined;
  const folderColor = folder ? getProjectColor(folder.color) : null;
  const canJump = !!item.pageUrl && /^https?:/i.test(item.pageUrl);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (sel && sel.toString().length > 0 && sel.containsNode(e.currentTarget, true)) return;
    onOpenPanel();
  };
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const ids =
      selectedIds.size > 1 && selectedIds.has(item.id) ? Array.from(selectedIds) : [item.id];
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-history-ids', JSON.stringify(ids));
  };
  return (
    <div
      data-history-id={item.id}
      className={`group rounded-md border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 !p-0 overflow-hidden flex flex-row min-h-0 shadow-sm transition-shadow duration-150 cursor-pointer hover:shadow-md hover:ring-1 hover:ring-zinc-200/80 dark:hover:ring-zinc-700/60 ${
        item.pinned ? 'ring-1 ring-violet-400/25 dark:ring-violet-500/20' : ''
      }`}
      onClick={onCardClick}
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
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="relative aspect-[5/3] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <Thumb item={item} size="full" />
          <SelectCheckbox
            checked={checked}
            onToggle={onToggleSelect}
            compact
            className="absolute left-1.5 top-1.5 z-[1]"
          />
          <div className="absolute inset-x-0 top-0 p-1.5 flex items-start justify-end pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-0.5">
              {item.pinned && (
                <span className="inline-flex items-center gap-0.5 px-1 py-px rounded bg-black/50 text-white/95 text-[9px] font-medium backdrop-blur-sm">
                  <Pin className="w-2.5 h-2.5" />
                </span>
              )}
              {versionCount > 1 && (
                <span className="inline-flex items-center px-1 py-px rounded bg-black/50 text-white/95 text-[9px] font-medium tabular-nums backdrop-blur-sm">
                  v{versionCount}
                </span>
              )}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-200"
              aria-hidden
            />
            <div className="relative p-1.5 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-auto">
              <IconBtn
                size="sm"
                onClick={() => onCopy(item.prompt, `cur:${item.id}`)}
                title={`${UI_ACTION.copy}提示词`}
                active={copiedKey === `cur:${item.id}`}
              >
                {copiedKey === `cur:${item.id}` ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </IconBtn>
              <IconBtn
                size="sm"
                onClick={onTogglePin}
                title={item.pinned ? '取消置顶' : '置顶'}
                active={item.pinned}
              >
                <Pin className="w-3 h-3" />
              </IconBtn>
              <IconBtn
                size="sm"
                onClick={onJumpToOriginal}
                disabled={!canJump || jumpBusy}
                title={
                  jumpBusy
                    ? '跳转中…'
                    : canJump
                      ? UI_ACTION.jumpToOriginalTitle
                      : '该记录没有可用的原图网页地址'
                }
                active={jumpBusy}
              >
                <Image className="w-3 h-3" />
              </IconBtn>
              {onMoveTo && (
                <div ref={moveBtnWrapRef} onClick={stop}>
                  <IconBtn
                    size="sm"
                    onClick={() => setMoveOpen((v) => !v)}
                    title={
                      folder
                        ? `当前在「${folder.name}」，点击移动到其他文件夹`
                        : '移动到项目 / 文件夹'
                    }
                    active={!!folder}
                  >
                    <FolderInput className="w-3 h-3" />
                  </IconBtn>
                  {moveOpen && (
                    <MoveToMenu
                      anchorRef={moveBtnWrapRef}
                      folders={folders}
                      currentFolderId={item.folderId ?? null}
                      onClose={() => setMoveOpen(false)}
                      onPick={(fid) => {
                        setMoveOpen(false);
                        onMoveTo(fid);
                      }}
                      align="right"
                    />
                  )}
                </div>
              )}
              <IconBtn size="sm" onClick={onDelete} title="删除" hoverColor="rose">
                <Trash2 className="w-3 h-3" />
              </IconBtn>
            </div>
          </div>
        </div>

        <div className="px-2 py-1.5 flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0 truncate text-[10px] text-zinc-400 dark:text-zinc-500">
            <span className="shrink-0">{item.provider}</span>
            <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
            <span className="truncate">{outputStyleLabel(item.style)}</span>
            <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
            <span className="tabular-nums shrink-0">
              {formatTime(item.updatedAt || item.createdAt)}
            </span>
            {folder && folderColor && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
                <span
                  className="inline-flex items-center gap-1 min-w-0 truncate"
                  title={`项目 / 文件夹：${folder.name}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${folderColor.dot} flex-none`} />
                  <span className="truncate">{folder.name}</span>
                </span>
              </>
            )}
          </div>
          <p className="text-xs leading-snug text-zinc-700 dark:text-zinc-300 line-clamp-2 whitespace-pre-wrap break-words flex-1">
            {item.prompt || <span className="text-zinc-400 italic">（空）</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
