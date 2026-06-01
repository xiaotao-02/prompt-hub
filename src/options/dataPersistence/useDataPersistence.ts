import { useCallback, useEffect, useRef, useState } from 'react';
import {
  disconnectDataDirectory,
  loadFromDirectory,
  pickDataDirectory,
  readDirectoryState,
  readSyncMeta,
  SYNC_META_KEY,
  supportsFileSystemAccess,
  syncToDirectory,
  writeSyncMeta,
  type DataDirectoryState,
  type SyncMeta,
} from '@/lib/fsBackup';
import { buildBackup, restoreBackup } from '@/lib/storage';
import { getCurrentVersion } from '@/lib/updater';
import type { DataPersistenceProps, Decision } from './types';
import {
  formatReason,
  isLiveSyncMeta,
  SYNC_ACTIVE_STALE_MS,
  syncToDirectoryWithTimeout,
} from './utils';

export function useDataPersistence({
  onDataRestored,
}: Pick<DataPersistenceProps, 'onDataRestored'>) {
  const [state, setState] = useState<DataDirectoryState | null>(null);
  const [meta, setMeta] = useState<SyncMeta | null>(null);
  const [busy, setBusy] = useState<'pick' | 'sync' | 'restore' | 'export' | 'import' | null>(null);
  const [tip, setTip] = useState<{ ok: boolean; msg: string } | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [manualBackupOpen, setManualBackupOpen] = useState(false);
  const [, bumpSyncMetaAgeTick] = useState(0);
  const shrinkDismissedRef = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [s, m] = await Promise.all([readDirectoryState(), readSyncMeta()]);
    setState(s);
    setMeta(m);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!state) return;
    if (!(state.supported && supportsFileSystemAccess())) {
      setManualBackupOpen(true);
    }
  }, [state]);

  const showTip = useCallback((ok: boolean, msg: string) => {
    setTip({ ok, msg });
    setTimeout(() => setTip(null), 2400);
  }, []);

  const handleSyncResult = useCallback(
    async (r: Awaited<ReturnType<typeof syncToDirectory>>, opts: { silent?: boolean } = {}) => {
      const now = Date.now();
      const lastSyncedAt = meta?.lastSyncedAt || 0;
      if (r.ok) {
        const m: SyncMeta = {
          lastSyncedAt: r.syncedAt || now,
          lastAttemptAt: r.syncedAt || now,
          status: 'idle',
          source: 'manual',
          bytes: r.bytes,
          lastError: null,
          blockedReason: null,
        };
        await writeSyncMeta(m);
        setMeta(m);
        await refresh();
        if (!opts.silent) showTip(true, '已同步到数据目录');
        return;
      }
      if (r.reason === 'shrink-blocked') {
        const m: SyncMeta = {
          lastSyncedAt,
          lastAttemptAt: now,
          status: 'blocked',
          source: 'manual',
          bytes: meta?.bytes,
          lastError: r.reason,
          blockedReason: r.reason,
        };
        await writeSyncMeta(m);
        setMeta(m);
        if (!opts.silent) showTip(false, formatReason(r.reason));
        setDecision({ kind: 'shrink-confirm' });
        return;
      }
      if (!opts.silent) showTip(false, formatReason(r.reason));
      const m: SyncMeta = {
        lastSyncedAt,
        lastAttemptAt: now,
        status: 'error',
        source: 'manual',
        bytes: meta?.bytes,
        lastError: r.reason || 'sync failed',
        blockedReason: null,
      };
      await writeSyncMeta(m);
      setMeta(m);
    },
    [meta?.bytes, meta?.lastSyncedAt, refresh, showTip],
  );

  useEffect(() => {
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local' || !(SYNC_META_KEY in changes)) return;
      const next = (changes[SYNC_META_KEY].newValue as SyncMeta | undefined) || null;
      setMeta(next);
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => {
      chrome.storage.onChanged.removeListener(onStorage);
    };
  }, []);

  useEffect(() => {
    if (meta?.status !== 'blocked') {
      shrinkDismissedRef.current = false;
      return;
    }
    if (
      meta.blockedReason === 'shrink-blocked' &&
      decision == null &&
      !shrinkDismissedRef.current
    ) {
      setDecision({ kind: 'shrink-confirm' });
    }
  }, [decision, meta?.blockedReason, meta?.status]);

  useEffect(() => {
    if (meta?.status !== 'pending' && meta?.status !== 'syncing') return;
    const at = meta.startedAt || meta.lastAttemptAt || 0;
    const delay = Math.max(0, SYNC_ACTIVE_STALE_MS - (Date.now() - at)) + 100;
    const timer = window.setTimeout(() => {
      bumpSyncMetaAgeTick((n) => n + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [meta?.lastAttemptAt, meta?.startedAt, meta?.status]);

  const onPick = async () => {
    setBusy('pick');
    try {
      const result = await pickDataDirectory();
      if (!result) {
        showTip(false, '已取消选择');
        return;
      }
      const { existingBackup } = result;
      await refresh();
      if (existingBackup) {
        const m: SyncMeta = {
          ...(meta || { lastSyncedAt: 0 }),
          status: 'blocked',
          source: 'manual',
          lastAttemptAt: Date.now(),
          lastError: null,
          blockedReason: 'pending-existing',
        };
        await writeSyncMeta(m);
        setMeta(m);
        setDecision({ kind: 'pending-existing', payload: existingBackup });
      } else {
        const sr = await syncToDirectoryWithTimeout(getCurrentVersion(), {
          requestPermission: true,
        });
        await handleSyncResult(sr);
      }
    } catch (err) {
      showTip(false, err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const applyDecision = async (choice: 'restore' | 'keep' | 'overwrite'): Promise<void> => {
    if (!decision) return;

    if (decision.kind === 'pending-existing') {
      if (choice === 'restore') {
        setBusy('restore');
        try {
          const r = await restoreBackup(decision.payload, 'replace');
          showTip(true, `已从备份还原 · 历史 ${r.historyTotal} 条`);
          onDataRestored?.();
          shrinkDismissedRef.current = false;
          const sr = await syncToDirectory(getCurrentVersion(), {
            requestPermission: true,
          });
          await handleSyncResult(sr, { silent: true });
        } finally {
          setBusy(null);
        }
      } else if (choice === 'overwrite') {
        setBusy('sync');
        try {
          const sr = await syncToDirectoryWithTimeout(getCurrentVersion(), {
            force: true,
            requestPermission: true,
          });
          await handleSyncResult(sr);
          shrinkDismissedRef.current = false;
        } finally {
          setBusy(null);
        }
      } else {
        const m: SyncMeta = {
          ...(meta || { lastSyncedAt: 0 }),
          status: 'idle',
          source: 'manual',
          lastAttemptAt: Date.now(),
          lastError: null,
          blockedReason: null,
        };
        await writeSyncMeta(m);
        setMeta(m);
      }
      setDecision(null);
      return;
    }

    if (decision.kind === 'shrink-confirm') {
      if (choice === 'restore') {
        setBusy('restore');
        try {
          const r = await loadFromDirectory('replace');
          if (r.ok && r.result) {
            showTip(true, `已从备份恢复 · 历史 ${r.result.historyTotal} 条`);
            onDataRestored?.();
            shrinkDismissedRef.current = false;
            const m: SyncMeta = {
              ...(meta || { lastSyncedAt: 0 }),
              status: 'idle',
              source: 'restore',
              lastAttemptAt: Date.now(),
              lastError: null,
              blockedReason: null,
            };
            await writeSyncMeta(m);
            setMeta(m);
          } else {
            showTip(false, formatReason(r.reason));
          }
        } finally {
          setBusy(null);
        }
      } else if (choice === 'overwrite') {
        setBusy('sync');
        try {
          const sr = await syncToDirectory(getCurrentVersion(), {
            force: true,
            requestPermission: true,
          });
          await handleSyncResult(sr);
          shrinkDismissedRef.current = false;
        } finally {
          setBusy(null);
        }
      } else {
        shrinkDismissedRef.current = true;
      }
      setDecision(null);
    }
  };

  const isBackgroundSyncing = isLiveSyncMeta(meta);
  const isSyncActive = busy === 'sync' || isBackgroundSyncing;

  const onSyncNow = async () => {
    if (busy !== null) return;
    const startedAt = Date.now();
    const m: SyncMeta = {
      ...(meta || { lastSyncedAt: 0 }),
      status: 'syncing',
      source: 'manual',
      startedAt,
      lastAttemptAt: startedAt,
      lastError: null,
      blockedReason: null,
    };
    setBusy('sync');
    setMeta(m);
    try {
      await writeSyncMeta(m);
      const r = await syncToDirectoryWithTimeout(getCurrentVersion(), { requestPermission: true });
      await handleSyncResult(r);
    } finally {
      setBusy(null);
    }
  };

  const onRestoreNow = async () => {
    if (!confirm('从数据目录的 JSON 完整恢复？\n这会覆盖当前插件里的设置 + 历史记录。')) return;
    setBusy('restore');
    try {
      const r = await loadFromDirectory('replace');
      if (r.ok && r.result) {
        showTip(true, `已从备份恢复 · 历史 ${r.result.historyTotal} 条`);
        onDataRestored?.();
      } else {
        showTip(false, formatReason(r.reason));
      }
    } finally {
      setBusy(null);
    }
  };

  const onDisconnect = async () => {
    if (!confirm('解除当前数据目录绑定？\n（不会删除磁盘上的 JSON 文件，下次仍可选回）')) return;
    await disconnectDataDirectory();
    await refresh();
    showTip(true, '已解除绑定');
  };

  const onExport = async () => {
    setBusy('export');
    try {
      const payload = await buildBackup(getCurrentVersion());
      const text = JSON.stringify(payload, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `prompt-hub-backup-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showTip(true, '已导出全量备份');
    } finally {
      setBusy(null);
    }
  };

  const onImportFile = async (file: File) => {
    setBusy('import');
    try {
      const text = await file.text();
      const mode = confirm(
        '从备份恢复方式：\n\n' +
          '· 点【确定】= 完全替换（适合刚重装后导入旧备份）\n' +
          '· 点【取消】= 与现有数据合并（按 id 去重，保留较新版本）',
      )
        ? 'replace'
        : 'merge';
      const r = await restoreBackup(JSON.parse(text), mode);
      showTip(true, `已${mode === 'replace' ? '替换' : '合并'} · 历史 ${r.historyTotal} 条`);
      onDataRestored?.();
    } catch (err) {
      showTip(false, err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const closeDecision = () => {
    if (!decision) return;
    if (decision.kind === 'shrink-confirm') {
      shrinkDismissedRef.current = true;
    } else if (decision.kind === 'pending-existing') {
      const m: SyncMeta = {
        ...(meta || { lastSyncedAt: 0 }),
        status: 'idle',
        source: 'manual',
        lastAttemptAt: Date.now(),
        lastError: null,
        blockedReason: null,
      };
      setMeta(m);
      void writeSyncMeta(m);
    }
    setDecision(null);
  };

  const fsaSupported = Boolean(state && state.supported && supportsFileSystemAccess());

  return {
    state,
    meta,
    busy,
    tip,
    decision,
    manualBackupOpen,
    setManualBackupOpen,
    importInputRef,
    fsaSupported,
    isSyncActive,
    onPick,
    onSyncNow,
    onRestoreNow,
    onDisconnect,
    onExport,
    onImportFile,
    applyDecision,
    closeDecision,
  };
}

export type DataPersistenceController = ReturnType<typeof useDataPersistence>;
