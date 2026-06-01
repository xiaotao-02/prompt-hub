import type { BackupPayload } from '@/lib/storage';
import type { SyncMeta } from '@/lib/fsBackup';

export interface DataPersistenceProps {
  onDataRestored?: () => void;
  variant?: 'card' | 'plain';
}

export interface PendingExistingDecision {
  kind: 'pending-existing';
  payload: BackupPayload;
}

export interface PendingShrinkDecision {
  kind: 'shrink-confirm';
}

export type Decision = PendingExistingDecision | PendingShrinkDecision | null;

export type DataPersistenceBusy = 'pick' | 'sync' | 'restore' | 'export' | 'import' | null;

export type SyncToDirectoryResult = Awaited<
  ReturnType<typeof import('@/lib/fsBackup').syncToDirectory>
>;

export type { SyncMeta };
