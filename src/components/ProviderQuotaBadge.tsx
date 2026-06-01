import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import type { ProviderId } from '@/lib/types';
import { PROVIDER_QUOTA_CACHE_KEY } from '@/lib/storage/keys';
import { getCachedQuota } from '@/lib/quota/cache';
import { requestProviderQuota } from '@/lib/quota/messaging';
import type { ProviderQuotaSnapshot } from '@/lib/quota/types';
import { cx } from '@/components/ui';

interface Props {
  providerId: ProviderId;
  /** 紧凑模式：Popup 头部 */
  compact?: boolean;
  className?: string;
}

function compactLabel(snap: ProviderQuotaSnapshot): string {
  if (snap.status === 'ok') {
    return snap.label.replace(/\s+/g, '');
  }
  if (snap.status === 'unsupported') return '控制台查额度';
  if (snap.status === 'no_key') return '未配置 Key';
  if (snap.status === 'error') return '额度查询失败';
  return snap.label;
}

export default function ProviderQuotaBadge({ providerId, compact = false, className }: Props) {
  const [snapshot, setSnapshot] = useState<ProviderQuotaSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const applySnapshot = useCallback((snap: ProviderQuotaSnapshot | null) => {
    setSnapshot(snap);
  }, []);

  const loadFromCache = useCallback(async () => {
    const cached = await getCachedQuota(providerId);
    if (cached) applySnapshot(cached);
    return cached;
  }, [applySnapshot, providerId]);

  const refresh = useCallback(
    async (force = false) => {
      if (!force) {
        const cached = await loadFromCache();
        if (cached) return;
      }
      setLoading(true);
      try {
        const resp = await requestProviderQuota({ providerId, force: true });
        if (resp.ok) {
          applySnapshot(resp.snapshot);
        } else {
          applySnapshot({
            providerId,
            status: 'error',
            label: '查询失败',
            error: resp.error,
            fetchedAt: Date.now(),
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [applySnapshot, loadFromCache, providerId],
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local' || !(PROVIDER_QUOTA_CACHE_KEY in changes)) return;
      void loadFromCache();
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [loadFromCache]);

  const snap = snapshot;
  const tone =
    snap?.status === 'ok' && snap.lowBalance
      ? 'low'
      : snap?.status === 'error'
        ? 'error'
        : snap?.status === 'unsupported' || snap?.status === 'no_key'
          ? 'muted'
          : 'ok';

  const title = snap
    ? [
        snap.status === 'ok' ? `剩余额度：${snap.label}` : snap.label,
        snap.detail,
        snap.error,
        '点击刷新',
      ]
        .filter(Boolean)
        .join('\n')
    : '加载额度…';

  const docsUrl = snap?.docsUrl;

  return (
    <div
      className={cx(
        'inline-flex items-center gap-1 min-w-0',
        compact ? 'max-w-[7.5rem]' : '',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => void refresh(true)}
        disabled={loading}
        title={title}
        className={cx(
          'inline-flex items-center gap-1 min-w-0 rounded-md border px-2 py-0.5 text-[11px] leading-tight transition-colors',
          tone === 'ok' &&
            'border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200',
          tone === 'low' &&
            'border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
          tone === 'error' &&
            'border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300',
          tone === 'muted' &&
            'border-zinc-200/80 bg-zinc-50/80 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400',
          loading && 'opacity-70',
        )}
      >
        <RefreshCw className={cx('w-3 h-3 shrink-0', loading && 'animate-spin')} aria-hidden />
        <span className="truncate">
          {!snap
            ? '额度…'
            : compact
              ? compactLabel(snap)
              : snap.status === 'ok'
                ? `剩余 ${snap.label}`
                : snap.label}
        </span>
      </button>
      {docsUrl && snap?.status === 'unsupported' && (
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
          title="打开控制台"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
      {!compact && snap?.detail && snap.status === 'ok' && (
        <span className="text-[10px] text-zinc-500 truncate max-w-[12rem]" title={snap.detail}>
          {snap.detail}
        </span>
      )}
    </div>
  );
}
