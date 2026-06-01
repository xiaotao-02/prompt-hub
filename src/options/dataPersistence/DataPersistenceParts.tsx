import { useState } from 'react';
import {
  AlertTriangle,
  Folder as FolderIcon,
  History as HistoryIcon,
  KeyRound,
  RotateCw,
  X,
} from 'lucide-react';
import { BACKUP_FILE_NAME } from '@/lib/fsBackup';
import type { PendingExistingDecision, PendingShrinkDecision, DataPersistenceBusy } from './types';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ChoiceButton({
  tone,
  title,
  desc,
  disabled,
  busy,
  onClick,
}: {
  tone: 'primary' | 'ghost' | 'danger';
  title: string;
  desc: string;
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  const cls =
    tone === 'primary'
      ? 'border-violet-300 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/10 hover:border-violet-400 hover:bg-violet-100/70 dark:hover:bg-violet-500/15 text-violet-900 dark:text-violet-100'
      : tone === 'danger'
        ? 'border-rose-200 dark:border-rose-500/40 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-700 dark:text-rose-300'
        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-200';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition disabled:opacity-50 ${cls}`}
    >
      <div className="text-[13px] font-medium flex items-center gap-2">
        {title}
        {busy && <RotateCw className="w-3 h-3 animate-spin" />}
      </div>
      <div className="text-[11px] mt-0.5 opacity-80 leading-snug">{desc}</div>
    </button>
  );
}

export function DecisionModal({
  decision,
  busy,
  onChoose,
  onClose,
}: {
  decision: PendingExistingDecision | PendingShrinkDecision;
  busy: DataPersistenceBusy;
  onChoose: (c: 'restore' | 'keep' | 'overwrite') => void;
  onClose: () => void;
}) {
  const [confirmingOverwrite, setConfirmingOverwrite] = useState(false);
  const isPending = decision.kind === 'pending-existing';
  const payload = isPending ? decision.payload : null;
  const historyCount = payload?.history?.length ?? 0;
  const providersWithKey = payload
    ? Object.values(payload.settings?.providers || {}).filter(
        (cfg) => cfg?.apiKey && cfg.apiKey.trim().length > 0,
      ).length
    : 0;
  const folderCount = payload?.folders?.length ?? 0;
  const exportedAt = payload?.exportedAt ? new Date(payload.exportedAt) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-none">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">
              {isPending ? '检测到目录里已有备份' : '即将用空数据覆盖更丰富的备份'}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
              {isPending
                ? '请明确选择如何处理 —— 误操作可能让旧备份被空数据永久覆盖。'
                : '当前 chrome.storage 里几乎没有真实数据（API Key / 历史 / 文件夹都是空的），但目录里的 JSON 备份明显更"重"。请先选择如何处理。'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="关闭（等同「保持备份不动」）"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {payload && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-3 text-[12px] space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                {BACKUP_FILE_NAME}
                {exportedAt && (
                  <span className="ml-auto">
                    导出于{' '}
                    {`${exportedAt.getFullYear()}/${exportedAt.getMonth() + 1}/${exportedAt.getDate()} ${exportedAt.getHours()}:${String(exportedAt.getMinutes()).padStart(2, '0')}`}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat
                  icon={<HistoryIcon className="w-3 h-3" />}
                  label="历史记录"
                  value={historyCount}
                />
                <Stat
                  icon={<KeyRound className="w-3 h-3" />}
                  label="已填 API"
                  value={providersWithKey}
                />
                <Stat
                  icon={<FolderIcon className="w-3 h-3" />}
                  label="文件夹"
                  value={folderCount}
                />
              </div>
            </div>
          )}

          {!confirmingOverwrite ? (
            <div className="space-y-2">
              <ChoiceButton
                tone="primary"
                disabled={busy !== null}
                onClick={() => onChoose('restore')}
                title={isPending ? '恢复备份（推荐）' : '从备份恢复'}
                desc={
                  isPending
                    ? '把这份备份完整还原到插件里 —— 适合刚重装后选回旧目录的场景'
                    : '把目录里的 JSON 完整还原到插件里 —— 推荐做法'
                }
                busy={busy === 'restore'}
              />
              <ChoiceButton
                tone="ghost"
                disabled={busy !== null}
                onClick={() => onChoose('keep')}
                title="保持备份不动"
                desc="不读也不写；备份和插件数据都保持现状（关闭弹窗等同此选项）"
              />
              <ChoiceButton
                tone="danger"
                disabled={busy !== null}
                onClick={() => setConfirmingOverwrite(true)}
                title="用当前数据覆盖备份"
                desc="把插件里现在的数据写到 JSON，把旧备份永久覆盖（不可撤销）"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-3 space-y-3">
              <div className="text-[12px] text-rose-700 dark:text-rose-200 leading-relaxed flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-none mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">这一步不可撤销！</div>
                  你确定要用当前
                  {historyCount > 0 || providersWithKey > 0 || folderCount > 0
                    ? '（更少的）'
                    : '（空的）'}
                  数据覆盖目录里这份备份吗？
                  {(historyCount > 0 || providersWithKey > 0) && (
                    <>
                      <br />
                      旧备份里有 <b>{historyCount}</b> 条历史 / <b>{providersWithKey}</b> 个 API Key
                      会立刻消失。
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-[12px] font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                  disabled={busy !== null}
                  onClick={() => {
                    setConfirmingOverwrite(false);
                    onChoose('overwrite');
                  }}
                >
                  确认覆盖
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-[12px] font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  disabled={busy !== null}
                  onClick={() => setConfirmingOverwrite(false)}
                >
                  返回
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
