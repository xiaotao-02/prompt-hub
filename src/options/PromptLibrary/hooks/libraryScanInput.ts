import type { SortKey } from '../types';
import type { SelectedNodeId } from '../FolderTree';
import { SYSTEM_NODE } from '../types';

export type LibraryScanInput = {
  deferredKeyword: string;
  filterProvider: string;
  filterStyle: string;
  selectedNode: SelectedNodeId;
  sortKey: SortKey;
};

export const DEFAULT_LIBRARY_SCAN_INPUT: LibraryScanInput = {
  deferredKeyword: '',
  filterProvider: 'all',
  filterStyle: 'all',
  selectedNode: SYSTEM_NODE.ALL,
  sortKey: 'updated',
};

export function buildUsesFullLibraryScan(scan: LibraryScanInput): boolean {
  return (
    scan.deferredKeyword.trim() !== '' ||
    scan.filterProvider !== 'all' ||
    scan.filterStyle !== 'all' ||
    scan.selectedNode !== SYSTEM_NODE.ALL ||
    scan.sortKey !== 'updated'
  );
}
