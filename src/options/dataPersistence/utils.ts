import { syncToDirectory, type SyncMeta } from '@/lib/fsBackup';

export const SYNC_ACTIVE_STALE_MS = 30_000;
export const MANUAL_SYNC_TIMEOUT_MS = 45_000;

export function isLiveSyncMeta(meta: SyncMeta | null): boolean {
  if (meta?.status !== 'pending' && meta?.status !== 'syncing') return false;
  const at = meta.startedAt || meta.lastAttemptAt || 0;
  return at > 0 && Date.now() - at < SYNC_ACTIVE_STALE_MS;
}

export async function syncToDirectoryWithTimeout(
  appVersion?: string,
  opts?: { force?: boolean; requestPermission?: boolean },
) {
  let timer: number | null = null;
  const timeout = new Promise<Awaited<ReturnType<typeof syncToDirectory>>>((resolve) => {
    timer = window.setTimeout(() => {
      resolve({ ok: false, reason: 'sync-timeout' });
    }, MANUAL_SYNC_TIMEOUT_MS);
  });

  try {
    return await Promise.race([syncToDirectory(appVersion, opts), timeout]);
  } finally {
    if (timer != null) window.clearTimeout(timer);
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function formatReason(reason?: string): string {
  if (!reason) return '操作失败';
  switch (reason) {
    case 'unsupported':
      return '当前浏览器不支持 File System Access API';
    case 'not-configured':
      return '尚未设置数据目录';
    case 'permission-denied':
      return '没有目录读写权限，请重新授权';
    case 'no-backup-file':
      return '该目录里没有备份文件，可能你换了文件夹';
    case 'shrink-blocked':
      return '安全网拦下了空数据覆盖（请在弹窗中选择恢复或确认覆盖）';
    case 'sync-timeout':
      return '同步超时，请再试一次或重新选择数据目录';
    default:
      return reason;
  }
}
