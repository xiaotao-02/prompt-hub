import { useEffect, useState } from 'react';
import { RefreshCw, Check, ExternalLink, Sparkles, Megaphone, Download } from 'lucide-react';
import { getUpdateSettings } from '@/lib/storage';
import type { RemoteRuntimeConfigCache } from '@/lib/remoteRuntimeConfig';
import { readRemoteRuntimeConfigCache } from '@/lib/remoteRuntimeConfig';
import { REMOTE_RUNTIME_CONFIG_CACHE_KEY } from '@/lib/storage/keys';
import { getCurrentVersion } from '@/lib/updater';
import { isNewerVersion } from '@/lib/version';
import type { ApplyExtensionUpdateResult, UpdateCheckResult, UpdateSettings } from '@/lib/types';
import { Button, StatusBanner } from '@/components/ui';
import { SettingsSection } from './settings/parts/SettingsSection';

const CWS_URL = 'https://github.com/xiaotao-02/prompt-hub/releases';

function UpdateLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="加载更新信息">
      <div className="h-5 w-24 rounded bg-zinc-100 dark:bg-zinc-800/80" />
      <div className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
      <div className="h-8 w-40 rounded bg-zinc-100 dark:bg-zinc-800/80" />
    </div>
  );
}

/**
 * 「检查更新 / 立即更新」面板。
 */
export default function UpdateSection() {
  const [u, setU] = useState<UpdateSettings | null>(null);
  const [busyKind, setBusyKind] = useState<null | 'check' | 'apply'>(null);
  const [tip, setTip] = useState<{ ok: boolean; msg: string } | null>(null);
  const [remoteHints, setRemoteHints] = useState<RemoteRuntimeConfigCache | null>(null);

  const load = async () => {
    const s = await getUpdateSettings();
    setU(s);
  };

  const loadRemoteHints = async () => {
    const c = await readRemoteRuntimeConfigCache();
    setRemoteHints(c);
  };

  useEffect(() => {
    void load();
    void loadRemoteHints();
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local') return;
      if (!(REMOTE_RUNTIME_CONFIG_CACHE_KEY in changes)) return;
      void loadRemoteHints();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const current = getCurrentVersion();

  const onCheck = async () => {
    setBusyKind('check');
    setTip(null);
    try {
      const resp = (await chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' })) as
        | { ok: true; result: UpdateCheckResult }
        | { ok: false; error?: string }
        | undefined;
      if (!resp || resp.ok !== true) {
        const errMsg =
          resp && typeof resp === 'object' && typeof resp.error === 'string' && resp.error
            ? resp.error
            : '检查失败，请稍后再试';
        setTip({ ok: false, msg: errMsg });
      } else {
        const { result } = resp;
        if (!result) {
          setTip({ ok: false, msg: '检查失败，请稍后再试' });
        } else if (result.error) {
          setTip({ ok: false, msg: result.error });
        } else if (result.hasUpdate) {
          setTip({ ok: true, msg: 'Chrome 商店已有新版本，可点「立即更新」' });
        } else {
          setTip({ ok: true, msg: '当前已是最新版本（以商店渠道为准）' });
        }
      }
    } finally {
      setBusyKind(null);
      await load();
      await loadRemoteHints();
    }
  };

  const onApply = async () => {
    if (!u?.lastResult?.hasUpdate) {
      setTip({ ok: false, msg: '请先检查更新；商店暂无可用新版本时不建议点「立即更新」' });
      return;
    }
    setBusyKind('apply');
    setTip(null);
    try {
      const resp = (await chrome.runtime.sendMessage({ type: 'APPLY_EXTENSION_UPDATE' })) as
        | { ok: true; result: ApplyExtensionUpdateResult }
        | { ok: false; error?: string }
        | undefined;
      if (!resp || resp.ok !== true) {
        const errMsg =
          resp && typeof resp === 'object' && typeof resp.error === 'string' && resp.error
            ? resp.error
            : '更新失败，请稍后再试';
        setTip({ ok: false, msg: errMsg });
        return;
      }
      const { result } = resp;
      if (result.applied && result.willReload) {
        setTip({ ok: true, msg: '更新已就绪，扩展即将重载…' });
      } else if (!result.applied && result.reason === 'already_latest') {
        setTip({ ok: true, msg: '当前已是最新版本（以 Chrome 商店为准）' });
      } else if (!result.applied) {
        setTip({ ok: false, msg: result.message });
      }
    } finally {
      setBusyKind(null);
      await load();
      await loadRemoteHints();
    }
  };

  if (!u) {
    return <UpdateLoadingSkeleton />;
  }

  const busy = busyKind !== null;
  const hasUpdate = !!u.lastResult?.hasUpdate;

  const p = remoteHints?.payload;
  const announcementZh = p?.announcementZh?.trim();
  const minRec = p?.minRecommendedExtensionVersion;
  const docsUrl = p?.docsUrl;
  const softNudgeExtension = !!(minRec && isNewerVersion(minRec, current));

  return (
    <SettingsSection
      title="扩展更新"
      trailing={`v${current}`}
      description="通过 Chrome Web Store 检查并安装扩展更新"
    >
      <div className="space-y-3">
        <p className="text-xs text-zinc-500 leading-snug">
          正式版本通过{' '}
          <strong className="font-medium text-zinc-600 dark:text-zinc-400">Chrome Web Store</strong>{' '}
          分发与更新。下方按钮会请求浏览器检查商店是否有可用更新。
        </p>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          若使用<strong className="font-medium text-zinc-600 dark:text-zinc-400">解压加载</strong>
          的开发包，无法从商店自动升级，请在 <code className="font-mono">chrome://extensions</code>
          （Edge：
          <code className="font-mono">edge://extensions</code>）对本扩展点「重新加载」，或改从{' '}
          <a
            href={CWS_URL}
            target="_blank"
            rel="noreferrer"
            className="text-violet-500 hover:underline inline-flex items-center gap-0.5"
          >
            商店页 <ExternalLink className="w-3 h-3" />
          </a>{' '}
          安装正式版。
        </p>

        {announcementZh ? (
          <StatusBanner tone="info" icon={<Megaphone className="w-4 h-4" />}>
            <p className="whitespace-pre-wrap">{announcementZh}</p>
          </StatusBanner>
        ) : null}

        {softNudgeExtension ? (
          <StatusBanner tone="warning">
            远端配置建议将你保持在 <span className="font-mono">v{minRec}</span>{' '}
            或更高以获得最佳体验；请继续在{' '}
            <strong className="font-medium">Chrome / Edge 扩展商店</strong> 中获取正式更新。
            {docsUrl ? (
              <>
                {' '}
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 inline-flex items-center gap-0.5"
                >
                  查看说明 <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : null}
          </StatusBanner>
        ) : docsUrl ? (
          <div className="text-[11px]">
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-violet-500 hover:underline inline-flex items-center gap-1"
            >
              在线说明文档 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : null}

        <div className="space-y-2.5">
          <StatusBanner tone={hasUpdate ? 'info' : 'success'}>
            {hasUpdate ? (
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <div className="text-sm font-medium">Chrome 商店有新版本可用</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {u.lastCheckedAt &&
                      `上次检查于 ${new Date(u.lastCheckedAt).toLocaleString()} · `}
                    <a
                      href={CWS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-0.5"
                    >
                      打开商店页 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 shrink-0" aria-hidden />
                <div>
                  <div className="font-medium">当前已是最新版本</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {u.lastCheckedAt
                      ? `上次检查于 ${new Date(u.lastCheckedAt).toLocaleString()}`
                      : '尚未检查过'}
                  </div>
                </div>
              </div>
            )}
          </StatusBanner>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="button" variant="primary" size="xs" onClick={onCheck} disabled={busy}>
              <RefreshCw className={`w-3.5 h-3.5 ${busyKind === 'check' ? 'animate-spin' : ''}`} />
              {busyKind === 'check' ? '检查中…' : '检查商店更新'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => void onApply()}
              disabled={busy || !hasUpdate}
              title={hasUpdate ? undefined : '商店暂无新版本'}
            >
              <Download className={`w-3.5 h-3.5 ${busyKind === 'apply' ? 'animate-pulse' : ''}`} />
              {busyKind === 'apply' ? '处理中…' : '立即更新'}
            </Button>
            {tip ? (
              <StatusBanner
                tone={tip.ok ? 'success' : 'danger'}
                className="flex-1 min-w-[12rem] !py-1.5"
              >
                {tip.msg}
              </StatusBanner>
            ) : null}
          </div>

          {remoteHints?.lastError ? (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
              最近一次远端配置缓存刷新：
              <span className="text-rose-500">{remoteHints.lastError}</span>
              （仍会使用上一份成功载荷，如有）
            </p>
          ) : null}
        </div>
      </div>
    </SettingsSection>
  );
}
