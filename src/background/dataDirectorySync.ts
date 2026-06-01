import {
  SYNC_META_KEY,
  hasDataDirectoryHandle,
  readSyncMeta,
  syncToDirectory,
  writeSyncMeta,
  type SyncMeta,
  type SyncMetaSource,
} from '@/lib/fsBackup';
import { DISCOVERED_KEY, SETTINGS_KEY, USER_STRATEGY_PRESETS_KEY } from '@/lib/storage/keys';
import { FOLDERS_KEY } from '@/lib/storage/folders';
import { HISTORY_KEY, LIBRARY_REV_KEY } from '@/lib/storage/history';
import { getCurrentVersion } from '@/lib/updater';

export const DATA_DIRECTORY_SYNC_DEBOUNCE_MS = 300;

type SyncToDirectoryResult = Awaited<ReturnType<typeof syncToDirectory>>;
type TimerHandle = ReturnType<typeof setTimeout>;
type StorageChanges = Record<string, chrome.storage.StorageChange>;

const WATCHED_STORAGE_KEYS = new Set([
  SETTINGS_KEY,
  DISCOVERED_KEY,
  USER_STRATEGY_PRESETS_KEY,
  LIBRARY_REV_KEY,
  HISTORY_KEY,
  FOLDERS_KEY,
]);

export function shouldAutoSyncStorageChange(
  changes: StorageChanges,
  area: chrome.storage.AreaName,
): boolean {
  if (area !== 'local' && area !== 'sync') return false;
  for (const key of Object.keys(changes)) {
    if (key === SYNC_META_KEY) continue;
    if (WATCHED_STORAGE_KEYS.has(key)) return true;
  }
  return false;
}

interface DataDirectoryAutoSyncDeps {
  hasDataDirectoryHandle: () => Promise<boolean>;
  readSyncMeta: () => Promise<SyncMeta | null>;
  writeSyncMeta: (meta: SyncMeta) => Promise<void>;
  syncToDirectory: (
    appVersion?: string,
    opts?: { force?: boolean; requestPermission?: boolean },
  ) => Promise<SyncToDirectoryResult>;
  getCurrentVersion: () => string;
  setTimeout: (fn: () => void, ms: number) => TimerHandle;
  clearTimeout: (id: TimerHandle) => void;
  now: () => number;
}

export interface DataDirectoryAutoSyncController {
  handleStorageChange: (changes: StorageChanges, area: chrome.storage.AreaName) => void;
  queueSync: (source?: SyncMetaSource) => Promise<void>;
  dispose: () => void;
}

function mergeMeta(prev: SyncMeta | null, patch: Partial<SyncMeta>): SyncMeta {
  return {
    lastSyncedAt: prev?.lastSyncedAt ?? 0,
    bytes: prev?.bytes,
    ...prev,
    ...patch,
  };
}

function reasonOf(result: SyncToDirectoryResult): string {
  return result.reason || 'sync failed';
}

export function createDataDirectoryAutoSyncController(
  deps: DataDirectoryAutoSyncDeps,
): DataDirectoryAutoSyncController {
  let timer: TimerHandle | null = null;
  let running = false;
  let dirtyDuringRun = false;
  let disposed = false;

  const clearTimer = () => {
    if (timer == null) return;
    deps.clearTimeout(timer);
    timer = null;
  };

  const markPending = async (source: SyncMetaSource): Promise<boolean> => {
    if (!(await deps.hasDataDirectoryHandle())) return false;
    const prev = await deps.readSyncMeta();
    if (prev?.status === 'blocked') return false;
    await deps.writeSyncMeta(
      mergeMeta(prev, {
        status: 'pending',
        source,
        lastAttemptAt: deps.now(),
        lastError: null,
      }),
    );
    return true;
  };

  const runSync = async (source: SyncMetaSource): Promise<void> => {
    if (disposed) return;
    clearTimer();

    if (running) {
      dirtyDuringRun = true;
      return;
    }

    running = true;
    dirtyDuringRun = false;
    let blocked = false;

    try {
      const prev = await deps.readSyncMeta();
      if (prev?.status === 'blocked') {
        blocked = true;
        return;
      }

      const startedAt = deps.now();
      await deps.writeSyncMeta(
        mergeMeta(prev, {
          status: 'syncing',
          source,
          startedAt,
          lastAttemptAt: startedAt,
          lastError: null,
        }),
      );

      const result = await deps.syncToDirectory(deps.getCurrentVersion(), {
        requestPermission: false,
      });
      const after = await deps.readSyncMeta();

      if (result.ok) {
        await deps.writeSyncMeta(
          mergeMeta(after, {
            status: 'idle',
            source,
            lastSyncedAt: result.syncedAt || deps.now(),
            lastAttemptAt: result.syncedAt || deps.now(),
            lastError: null,
            blockedReason: null,
            bytes: result.bytes,
          }),
        );
        return;
      }

      if (result.reason === 'shrink-blocked') {
        blocked = true;
        await deps.writeSyncMeta(
          mergeMeta(after, {
            status: 'blocked',
            source,
            lastAttemptAt: deps.now(),
            lastError: result.reason,
            blockedReason: result.reason,
          }),
        );
        return;
      }

      await deps.writeSyncMeta(
        mergeMeta(after, {
          status: 'error',
          source,
          lastAttemptAt: deps.now(),
          lastError: reasonOf(result),
          blockedReason: null,
        }),
      );
    } catch (err) {
      const prev = await deps.readSyncMeta().catch(() => null);
      await deps.writeSyncMeta(
        mergeMeta(prev, {
          status: 'error',
          source,
          lastAttemptAt: deps.now(),
          lastError: err instanceof Error ? err.message : String(err),
          blockedReason: null,
        }),
      );
    } finally {
      running = false;
      if (!disposed && dirtyDuringRun && !blocked) {
        dirtyDuringRun = false;
        void queueSync(source);
      } else {
        dirtyDuringRun = false;
      }
    }
  };

  const queueSync = async (source: SyncMetaSource = 'auto'): Promise<void> => {
    if (disposed) return;
    const shouldRun = await markPending(source);
    if (!shouldRun) return;

    if (running) {
      dirtyDuringRun = true;
      return;
    }

    clearTimer();
    timer = deps.setTimeout(() => {
      void runSync(source);
    }, DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
  };

  const handleStorageChange = (changes: StorageChanges, area: chrome.storage.AreaName): void => {
    if (!shouldAutoSyncStorageChange(changes, area)) return;
    void queueSync('auto');
  };

  return {
    handleStorageChange,
    queueSync,
    dispose: () => {
      disposed = true;
      clearTimer();
    },
  };
}

let installedController: DataDirectoryAutoSyncController | null = null;

export function installDataDirectoryAutoSync(): void {
  if (installedController) return;
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

  installedController = createDataDirectoryAutoSyncController({
    hasDataDirectoryHandle,
    readSyncMeta,
    writeSyncMeta,
    syncToDirectory,
    getCurrentVersion,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    now: () => Date.now(),
  });
  chrome.storage.onChanged.addListener(installedController.handleStorageChange);
}
