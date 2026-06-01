import type { Dispatch, SetStateAction } from 'react';
import type { HistoryItem, LibraryFolder } from '@/lib/types';
import {
  createFolder,
  moveHistoryItemsToFolder,
  patchFolder,
  removeFolder,
  renameFolder,
} from '@/lib/storage';
import { PROJECT_COLORS } from '../types';
import { SYSTEM_NODE } from '../types';
import type { SelectedNodeId } from '../FolderTree';

export type UseLibraryFoldersDeps = {
  folders: LibraryFolder[];
  reloadFolders: () => Promise<void>;
  reloadHistory: () => Promise<void>;
  showTip: (ok: boolean, msg: string) => void;
  collectSubtreeIds: (rootId: string) => Set<string>;
  countByFolderId: Map<string, number>;
  selectedNode: SelectedNodeId;
  setSelectedNode: (node: SelectedNodeId) => void;
  setExpandedFolderIds: Dispatch<SetStateAction<Set<string>>>;
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
};

export function useLibraryFolders({
  folders,
  reloadFolders,
  reloadHistory,
  showTip,
  collectSubtreeIds,
  countByFolderId,
  selectedNode,
  setSelectedNode,
  setExpandedFolderIds,
  selectedIds,
  setSelectedIds,
}: UseLibraryFoldersDeps) {
  const handleToggleExpand = (id: string) => {
    setExpandedFolderIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateProject = async () => {
    const name = prompt('给新项目起个名字（例如「电商插画」「卡通头像」…）');
    if (!name || !name.trim()) return;
    const colorIdx = Math.floor(Math.random() * PROJECT_COLORS.length);
    const f = await createFolder({
      name: name.trim(),
      parentId: null,
      color: PROJECT_COLORS[colorIdx].id,
    });
    await reloadFolders();
    setSelectedNode(f.id);
    showTip(true, `已创建项目「${f.name}」`);
  };

  const handleCreateChild = async (parentId: string) => {
    const name = prompt('新建子文件夹的名字');
    if (!name || !name.trim()) return;
    const f = await createFolder({ name: name.trim(), parentId });
    setExpandedFolderIds((s) => new Set(s).add(parentId));
    await reloadFolders();
    setSelectedNode(f.id);
    showTip(true, `已创建文件夹「${f.name}」`);
  };

  const handleRename = async (folder: LibraryFolder) => {
    const next = prompt('重命名为：', folder.name);
    if (next == null) return;
    if (!next.trim() || next.trim() === folder.name) return;
    await renameFolder(folder.id, next.trim());
    await reloadFolders();
    showTip(true, '已重命名');
  };

  const handleDelete = async (folder: LibraryFolder) => {
    const subtreeIds = collectSubtreeIds(folder.id);
    let itemsInside = 0;
    for (const fid of subtreeIds) {
      itemsInside += countByFolderId.get(fid) || 0;
    }
    const childCount = subtreeIds.size - 1;
    const isProject = folder.parentId === null;

    let cascade = false;
    if (childCount > 0 || itemsInside > 0) {
      const summary = [
        childCount > 0 ? `${childCount} 个子文件夹` : null,
        itemsInside > 0 ? `${itemsInside} 条记录` : null,
      ]
        .filter(Boolean)
        .join('、');
      const choice = window.confirm(
        `「${folder.name}」下包含 ${summary}。\n\n` +
          `点「确定」继续删除：${isProject ? '项目' : '文件夹'}本身会被删除，记录会变为「未分类」（不会丢）。\n` +
          `点「取消」放弃此次操作。`,
      );
      if (!choice) return;
      if (childCount > 0) {
        cascade = window.confirm(
          `是否级联删除「${folder.name}」下的全部子文件夹？\n\n` +
            `点「确定」= 一并删除整个子树（记录依旧变为「未分类」，不会丢）。\n` +
            `点「取消」= 仅删除当前${isProject ? '项目' : '文件夹'}，子文件夹自动上移。`,
        );
      }
    } else {
      if (!confirm(`确认删除${isProject ? '项目' : '文件夹'}「${folder.name}」？`)) return;
    }

    await removeFolder(folder.id, { cascade });
    if (selectedNode === folder.id) setSelectedNode(SYSTEM_NODE.ALL);
    await reloadFolders();
    await reloadHistory();
    showTip(true, '已删除');
  };

  const handleChangeColor = async (folder: LibraryFolder, color: string) => {
    await patchFolder(folder.id, { color });
    await reloadFolders();
  };

  const handleMoveItems = async (itemIds: string[], folderId: string | null) => {
    if (itemIds.length === 0) return;
    const moved = await moveHistoryItemsToFolder(itemIds, folderId);
    await reloadHistory();
    if (moved > 0) {
      const targetName =
        folderId == null ? '未分类' : folders.find((f) => f.id === folderId)?.name || '目标文件夹';
      showTip(true, `已移动 ${moved} 条到「${targetName}」`);
    } else {
      showTip(true, '已在该位置，无需移动');
    }
  };

  const handleMoveOne = (item: HistoryItem) => async (folderId: string | null) => {
    await handleMoveItems([item.id], folderId);
  };

  const onBulkMove = async (folderId: string | null) => {
    if (selectedIds.size === 0) return;
    await handleMoveItems(Array.from(selectedIds), folderId);
    setSelectedIds(new Set());
  };

  return {
    handleToggleExpand,
    handleCreateProject,
    handleCreateChild,
    handleRename,
    handleDelete,
    handleChangeColor,
    handleMoveItems,
    handleMoveOne,
    onBulkMove,
  };
}
