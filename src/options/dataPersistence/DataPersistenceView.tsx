import {
  HardDrive,
  FolderOpen,
  FolderCheck,
  RotateCw,
  Download,
  Upload,
  Link2Off,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Check,
  Info,
} from 'lucide-react';
import { BACKUP_FILE_NAME } from '@/lib/fsBackup';
import { formatTime } from '@/lib/format/time';
import { Button, Collapsible } from '@/components/ui';
import { DecisionModal } from './DataPersistenceParts';
import type { DataPersistenceProps } from './types';
import { formatBytes, formatReason } from './utils';
import type { DataPersistenceController } from './useDataPersistence';

type ViewProps = DataPersistenceProps & {
  ctrl: DataPersistenceController;
};

function TipBadge({ tip }: { tip: { ok: boolean; msg: string } }) {
  return (
    <span
      className={`text-[11px] flex items-center gap-1 flex-none ${
        tip.ok ? 'text-emerald-600' : 'text-rose-500'
      }`}
    >
      {tip.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {tip.msg}
    </span>
  );
}

export function DataPersistenceView({ variant = 'card', ctrl }: ViewProps) {
  const {
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
  } = ctrl;

  if (!state) {
    if (variant === 'plain') {
      return <div className="text-xs text-zinc-500">加载数据状态…</div>;
    }
    return (
      <section className="card">
        <div className="text-xs text-zinc-500">加载数据状态…</div>
      </section>
    );
  }

  const statusSummary = state.configured ? (
    <>
      <span className="text-emerald-600 dark:text-emerald-300 font-medium">已连接</span>
      <span className="text-zinc-400">·</span>
      <span className="font-mono text-xs truncate">
        {state.name}/{BACKUP_FILE_NAME}
      </span>
      {meta?.lastSyncedAt ? (
        <>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-500">上次同步 {formatTime(meta.lastSyncedAt)}</span>
        </>
      ) : (
        <>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-500">尚未同步</span>
        </>
      )}
    </>
  ) : (
    <span className="text-amber-700 dark:text-amber-300 font-medium">未配置数据目录</span>
  );

  const Root = variant === 'plain' ? 'div' : 'section';
  const rootClass = variant === 'plain' ? 'space-y-4' : 'card space-y-4';

  return (
    <Root className={rootClass}>
      {variant === 'plain' ? (
        <>
          <h2 className="text-sm font-semibold">数据与备份</h2>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm min-w-0">
              <HardDrive className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex flex-wrap items-center gap-x-2 min-w-0">{statusSummary}</div>
            </div>
            {tip && <TipBadge tip={tip} />}
          </div>
        </>
      ) : (
        <header className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white flex-none">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              数据持久化
              <span className="text-[10px] font-normal px-1.5 py-px rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                卸载重装后可还原
              </span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              把 API 配置和历史记录双写到你挑选的本地文件夹里的 JSON 文件。
              <b>重装插件后只需在这里选回同一个文件夹，就能自动识别并还原所有数据。</b>
            </p>
          </div>
          {tip && <TipBadge tip={tip} />}
        </header>
      )}

      {!fsaSupported && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-200 flex gap-2">
          <Info className="w-3.5 h-3.5 flex-none mt-px" />
          <span>
            当前浏览器不支持 File System Access API， 「数据目录」功能不可用。可使用下方的
            <b>手动导出 / 导入 JSON</b>作为替代方案。
          </span>
        </div>
      )}

      {fsaSupported && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
            <FolderOpen className="w-4 h-4 text-emerald-500" />
            数据目录
          </div>

          {state.configured ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-medium">
                  <FolderCheck className="w-3.5 h-3.5" />
                  {state.name}/{BACKUP_FILE_NAME}
                </span>
                {state.permissionGranted ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-px rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> 已授权
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-px rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px]">
                    <AlertCircle className="w-3 h-3" /> 权限已过期，点「立即同步」会重新请求
                  </span>
                )}
              </div>

              {meta?.lastSyncedAt ? (
                <div className="text-[11px] text-zinc-500">
                  上次同步：{formatTime(meta.lastSyncedAt)}
                  {meta.bytes ? ` · ${formatBytes(meta.bytes)}` : ''}
                  {meta.lastError && (
                    <span className="text-rose-500 ml-2">
                      · 上次出错：{formatReason(meta.lastError)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500">尚未同步</div>
              )}

              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant={isSyncActive ? 'primary' : 'secondary'}
                  size="xs"
                  onClick={onSyncNow}
                  disabled={busy !== null && busy !== 'sync'}
                  aria-busy={isSyncActive}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSyncActive ? 'animate-spin' : ''}`} />
                  {isSyncActive ? '同步中' : '立即同步'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={onRestoreNow}
                  disabled={busy !== null}
                  title="从数据目录的 JSON 全量恢复"
                >
                  <Upload className="w-3.5 h-3.5" />
                  从目录恢复
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={onPick}
                  disabled={busy !== null}
                  title="换一个数据目录"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  更换目录
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={onDisconnect}
                  disabled={busy !== null}
                  className="text-zinc-500 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-500/40"
                  title="解除绑定（不会删除磁盘文件）"
                >
                  <Link2Off className="w-3.5 h-3.5" />
                  解除绑定
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2.5 text-[12px] text-amber-800 dark:text-amber-200 flex gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-none mt-0.5 text-amber-600 dark:text-amber-300" />
                <div className="leading-relaxed">
                  <span className="font-semibold">之前配过数据目录？</span>
                  点下方<b>「选择数据目录…」</b>选回原来的文件夹，有旧备份时会弹窗让你一键恢复。
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                <b>第一次使用？</b>选一个你<b>自己常用的固定文件夹</b>（建议放到 OneDrive /
                坚果云这类带历史版本的同步盘里，多一层保险）。插件会在里面维护一个{' '}
                <code className="font-mono">{BACKUP_FILE_NAME}</code>{' '}
                文件，所有写入都会同步进去；重装后再选回这个文件夹即可自动识别并还原。
              </p>
              <Button
                type="button"
                variant="primary"
                size="xs"
                onClick={onPick}
                disabled={busy !== null}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                {busy === 'pick' ? '请在系统对话框中选择…' : '选择数据目录…'}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setManualBackupOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          aria-expanded={manualBackupOpen}
        >
          <span className="inline-flex items-center gap-2">
            <Download className="w-4 h-4 text-zinc-500" />
            {fsaSupported ? '手动备份兜底' : '没有 File System API？ / 手动备份'}
          </span>
          <span className="text-zinc-400">{manualBackupOpen ? '−' : '+'}</span>
        </button>
        <Collapsible open={manualBackupOpen}>
          <div className="space-y-2 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              一键导出包含设置 + 全部历史的 JSON 备份；或从 JSON 文件恢复。
              适合不想配置数据目录的场景，或当作额外保险。
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={onExport}
                disabled={busy !== null}
              >
                <Download className="w-3.5 h-3.5" />
                导出全量备份
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => importInputRef.current?.click()}
                disabled={busy !== null}
              >
                <Upload className="w-3.5 h-3.5" />从 JSON 恢复
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onImportFile(f);
                }}
              />
            </div>
          </div>
        </Collapsible>
      </div>

      {decision && (
        <DecisionModal
          decision={decision}
          busy={busy}
          onChoose={(c) => void applyDecision(c)}
          onClose={closeDecision}
        />
      )}
    </Root>
  );
}
