import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SYNC_META_KEY, type SyncMeta } from '@/lib/fsBackup';
import type { syncToDirectory } from '@/lib/fsBackup';
import { SETTINGS_KEY, USER_STRATEGY_PRESETS_KEY } from '@/lib/storage/keys';
import { LIBRARY_REV_KEY } from '@/lib/storage/history';
import {
  DATA_DIRECTORY_SYNC_DEBOUNCE_MS,
  createDataDirectoryAutoSyncController,
  shouldAutoSyncStorageChange,
} from './dataDirectorySync';

type SyncResult = Awaited<ReturnType<typeof syncToDirectory>>;

function storageChange(): chrome.storage.StorageChange {
  return { oldValue: undefined, newValue: Date.now() };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function makeDeps(
  opts: {
    hasHandle?: boolean;
    syncResult?: SyncResult;
    syncImpl?: () => Promise<SyncResult>;
  } = {},
) {
  let now = 100;
  let meta: SyncMeta | null = { lastSyncedAt: 0, status: 'idle' };
  const writes: SyncMeta[] = [];
  const deps = {
    hasDataDirectoryHandle: vi.fn(async () => opts.hasHandle ?? true),
    readSyncMeta: vi.fn(async () => meta),
    writeSyncMeta: vi.fn(async (m: SyncMeta) => {
      meta = m;
      writes.push(m);
    }),
    syncToDirectory: vi.fn(
      opts.syncImpl || (async () => opts.syncResult || { ok: true, syncedAt: 1000, bytes: 42 }),
    ),
    getCurrentVersion: vi.fn(() => '0.1.66'),
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    now: vi.fn(() => ++now),
  };
  return { deps, writes, getMeta: () => meta };
}

describe('data directory auto sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects only business data storage changes', () => {
    expect(shouldAutoSyncStorageChange({ [SETTINGS_KEY]: storageChange() }, 'sync')).toBe(true);
    expect(shouldAutoSyncStorageChange({ [LIBRARY_REV_KEY]: storageChange() }, 'local')).toBe(true);
    expect(
      shouldAutoSyncStorageChange({ [USER_STRATEGY_PRESETS_KEY]: storageChange() }, 'local'),
    ).toBe(true);
    expect(shouldAutoSyncStorageChange({ [SYNC_META_KEY]: storageChange() }, 'local')).toBe(false);
    expect(shouldAutoSyncStorageChange({ [SETTINGS_KEY]: storageChange() }, 'managed')).toBe(false);
  });

  it('marks pending immediately and syncs one changed batch', async () => {
    const { deps, writes } = makeDeps();
    const controller = createDataDirectoryAutoSyncController(deps);

    controller.handleStorageChange({ [SETTINGS_KEY]: storageChange() }, 'sync');
    await flushPromises();

    expect(writes.at(-1)?.status).toBe('pending');
    expect(deps.syncToDirectory).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
    await flushPromises();

    expect(deps.syncToDirectory).toHaveBeenCalledTimes(1);
    expect(writes.at(-1)).toMatchObject({
      status: 'idle',
      lastSyncedAt: 1000,
      bytes: 42,
      lastError: null,
    });
    controller.dispose();
  });

  it('debounces consecutive changes into one sync', async () => {
    const { deps } = makeDeps();
    const controller = createDataDirectoryAutoSyncController(deps);

    controller.handleStorageChange({ [SETTINGS_KEY]: storageChange() }, 'sync');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS - 1);
    controller.handleStorageChange({ [LIBRARY_REV_KEY]: storageChange() }, 'local');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
    await flushPromises();

    expect(deps.syncToDirectory).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('runs a follow-up sync when data changes during an active sync', async () => {
    let resolveSync: (value: { ok: true; syncedAt: number; bytes: number }) => void = () => {
      throw new Error('sync did not start');
    };
    const { deps, writes } = makeDeps({
      syncImpl: () =>
        new Promise((resolve) => {
          resolveSync = resolve;
        }),
    });
    const controller = createDataDirectoryAutoSyncController(deps);

    controller.handleStorageChange({ [SETTINGS_KEY]: storageChange() }, 'sync');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
    await flushPromises();

    expect(deps.syncToDirectory).toHaveBeenCalledTimes(1);
    expect(writes.at(-1)?.status).toBe('syncing');

    controller.handleStorageChange({ [LIBRARY_REV_KEY]: storageChange() }, 'local');
    await flushPromises();

    expect(writes.at(-1)?.status).toBe('pending');
    expect(deps.syncToDirectory).toHaveBeenCalledTimes(1);

    resolveSync({ ok: true, syncedAt: 2000, bytes: 99 });
    await flushPromises();
    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
    await flushPromises();

    expect(deps.syncToDirectory).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it('records permission errors without requesting permission', async () => {
    const { deps, writes } = makeDeps({
      syncResult: { ok: false, reason: 'permission-denied' },
    });
    const controller = createDataDirectoryAutoSyncController(deps);

    controller.handleStorageChange({ [SETTINGS_KEY]: storageChange() }, 'sync');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
    await flushPromises();

    expect(deps.syncToDirectory).toHaveBeenCalledWith('0.1.66', {
      requestPermission: false,
    });
    expect(writes.at(-1)).toMatchObject({
      status: 'error',
      lastError: 'permission-denied',
      blockedReason: null,
    });
    controller.dispose();
  });

  it('records shrink-blocked as a blocked state', async () => {
    const { deps, writes } = makeDeps({
      syncResult: { ok: false, reason: 'shrink-blocked' },
    });
    const controller = createDataDirectoryAutoSyncController(deps);

    controller.handleStorageChange({ [SETTINGS_KEY]: storageChange() }, 'sync');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
    await flushPromises();

    expect(writes.at(-1)).toMatchObject({
      status: 'blocked',
      lastError: 'shrink-blocked',
      blockedReason: 'shrink-blocked',
    });
    controller.dispose();
  });

  it('does nothing when no data directory is configured', async () => {
    const { deps, writes } = makeDeps({ hasHandle: false });
    const controller = createDataDirectoryAutoSyncController(deps);

    controller.handleStorageChange({ [SETTINGS_KEY]: storageChange() }, 'sync');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(DATA_DIRECTORY_SYNC_DEBOUNCE_MS);
    await flushPromises();

    expect(writes).toHaveLength(0);
    expect(deps.syncToDirectory).not.toHaveBeenCalled();
    controller.dispose();
  });
});
