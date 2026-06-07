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
} from 'lucide-react';
import { BACKUP_FILE_NAME } from '@/lib/fsBackup';
import { formatTime } from '@/lib/format/time';
import { Button, ConfirmDialog, StatusBanner } from '@/components/ui';
import { DecisionModal } from './DataPersistenceParts';
import { SettingsSection } from '../settings/parts/SettingsSection';
import { HelpDisclosure } from '../settings/parts/HelpDisclosure';
import type { DataPersistenceProps } from './types';
import { formatBytes, formatReason } from './utils';
import type { DataPersistenceController } from './useDataPersistence';

type ViewProps = DataPersistenceProps & {
  ctrl: DataPersistenceController;
};

function TipBanner({ tip }: { tip: { ok: boolean; msg: string } }) {
  return (
    <StatusBanner tone={tip.ok ? 'success' : 'danger'} className="flex-none max-w-sm">
      {tip.msg}
    </StatusBanner>
  );
}

export function DataPersistenceView({ ctrl }: ViewProps) {
  const {
    state,
    meta,
    busy,
    tip,
    decision,
    confirm,
    setConfirm,
    importInputRef,
    fsaSupported,
    isSyncActive,
    onPick,
    onSyncNow,
    onRestoreNow,
    runRestoreFromDirectory,
    onDisconnect,
    runDisconnectDirectory,
    onExport,
    onImportFile,
    runImportJson,
    applyDecision,
    closeDecision,
  } = ctrl;

  if (!state) {
    return (
      <div className="animate-pulse space-y-3" aria-busy="true" aria-label="加载数据状态">
        <div className="h-5 w-28 rounded bg-zinc-100 dark:bg-zinc-800/80" />
        <div className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
      </div>
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

  const dataDirBlock = fsaSupported ? (
    <div className="space-y-3 border-t border-zinc-200/90 pt-4 dark:border-zinc-800/90">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
        <FolderOpen className="w-4 h-4 text-emerald-500" />
        数据目录
      </div>

      {state.configured ? (
        <div className="space-y-2">
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
        <div className="space-y-2.5">
          <StatusBanner tone="warning" icon={<AlertTriangle className="w-4 h-4" />}>
            <span className="font-semibold">之前配过数据目录？</span> 点下方
            <b>「选择数据目录…」</b>选回原来的文件夹，有旧备份时会弹窗让你一键恢复。
          </StatusBanner>
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
  ) : null;

  const confirmDialog = confirm ? (
    confirm.kind === 'restore-directory' ? (
      <ConfirmDialog
        open
        title="从数据目录恢复？"
        description="将用目录中的 JSON 完整覆盖当前插件里的设置与历史记录。此操作不可自动撤销。"
        onClose={() => setConfirm(null)}
        actions={[
          { label: '取消', variant: 'secondary', onClick: () => setConfirm(null) },
          {
            label: '确认恢复',
            variant: 'danger',
            onClick: () => void runRestoreFromDirectory(),
          },
        ]}
      />
    ) : confirm.kind === 'disconnect-directory' ? (
      <ConfirmDialog
        open
        title="解除数据目录绑定？"
        description="不会删除磁盘上的 JSON 文件；下次仍可重新选择同一文件夹。"
        onClose={() => setConfirm(null)}
        actions={[
          { label: '取消', variant: 'secondary', onClick: () => setConfirm(null) },
          {
            label: '解除绑定',
            variant: 'danger',
            onClick: () => void runDisconnectDirectory(),
          },
        ]}
      />
    ) : (
      <ConfirmDialog
        open
        title="从 JSON 备份恢复"
        description="请选择恢复方式：完全替换适合刚重装后导入旧备份；合并会按 id 去重并保留较新版本。"
        onClose={() => setConfirm(null)}
        actions={[
          { label: '取消', variant: 'secondary', onClick: () => setConfirm(null) },
          {
            label: '与现有数据合并',
            variant: 'secondary',
            onClick: () => void runImportJson('merge'),
          },
          {
            label: '完全替换',
            variant: 'danger',
            onClick: () => void runImportJson('replace'),
          },
        ]}
      />
    )
  ) : null;

  return (
    <div className="space-y-4">
      <SettingsSection
        title="数据与备份"
        description="把 API 配置和历史记录双写到本地文件夹，重装插件后可还原"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm min-w-0">
            <HardDrive className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex flex-wrap items-center gap-x-2 min-w-0">{statusSummary}</div>
          </div>
          {tip ? <TipBanner tip={tip} /> : null}
        </div>

        {!fsaSupported ? (
          <StatusBanner tone="warning" className="mt-3">
            当前浏览器不支持 File System Access API，「数据目录」功能不可用。请使用下方的
            <b>手动导出 / 导入 JSON</b>作为替代方案。
          </StatusBanner>
        ) : null}

        {dataDirBlock}
      </SettingsSection>

      <HelpDisclosure
        title={fsaSupported ? '手动备份兜底' : '没有 File System API？ / 手动备份'}
        defaultOpen={!fsaSupported}
      >
        <p>
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
              if (f) onImportFile(f);
            }}
          />
        </div>
      </HelpDisclosure>

      {decision ? (
        <DecisionModal
          decision={decision}
          busy={busy}
          onChoose={(c) => void applyDecision(c)}
          onClose={closeDecision}
        />
      ) : null}

      {confirmDialog}
    </div>
  );
}
