import { useEffect, useState } from 'react';
import { AlignJustify, Layers, List, RotateCcw, Trash2 } from 'lucide-react';
import type { HistoryItem, PromptVersion, PromptVersionSource } from '@/lib/types';
import { getVersionOrdinalLabel, type VersionOrdinalKind } from '@/lib/versionLabel';
import { STRATEGY_LABELS } from '@/lib/strategies-meta';
import { formatTime } from '@/lib/format/time';
import { SourceTag } from '@/components/SourceTag';
import { removePromptVersion, restorePromptVersion } from '@/lib/storage';
import { CopyFeedbackLabel, cx } from '@/components/ui';
import { useVersionsListDensity } from '@/hooks/useVersionsListDensity';
import { POPUP_DENSITY_KEY, previewMaxLen } from '@/lib/versionsListDensity';
import { versionListPreviewText, versionListReferencePrompt } from '@/lib/versionPreview';

/** ≤6 条全部展示；>6 条默认只展示前 6 条，可展开其余 */
const VERSION_UI_FULL_THRESHOLD = 6;
const VERSIONS_LIST_SCROLLBAR =
  'scrollbar-thin scrollbar-track-zinc-200/80 dark:scrollbar-track-zinc-800/80 scrollbar-thumb-zinc-400/70 dark:scrollbar-thumb-zinc-600/80 hover:scrollbar-thumb-violet-500/35';

const ORD_TAG_CLASS: Record<VersionOrdinalKind, string> = {
  current: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  initial: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  middle: 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-200',
};

const DOT_CLASS: Record<PromptVersionSource, string> = {
  extracted: 'bg-emerald-500 dark:bg-emerald-400',
  edited: 'bg-amber-500 dark:bg-amber-400',
  refined: 'bg-fuchsia-500 dark:bg-fuchsia-400',
  restored: 'bg-violet-500 dark:bg-violet-400',
};

function VersionRailColumn({
  source,
  isCurrent,
  isFirst,
  isLast,
  compact,
}: {
  source: PromptVersionSource;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;
  compact: boolean;
}) {
  return (
    <div className="relative w-5 flex-none self-stretch" aria-hidden>
      <span
        className={cx(
          'absolute left-1/2 -translate-x-1/2 w-0.5 bg-zinc-300/70 dark:bg-zinc-600/70',
          isFirst ? 'top-1/2' : '-top-1.5',
          isLast ? 'bottom-1/2' : '-bottom-1.5',
        )}
      />
      <span
        className={cx(
          'absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-zinc-100 dark:border-zinc-950',
          DOT_CLASS[source],
          compact ? 'top-1/2 -translate-y-1/2' : 'top-3',
          isCurrent &&
            'ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-zinc-100 dark:ring-offset-zinc-950',
        )}
      />
    </div>
  );
}

export function PopupVersionsInline({
  item,
  copiedKey,
  onCopy,
  onAfterMutation,
}: {
  item: HistoryItem;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onAfterMutation: () => void | Promise<void>;
}) {
  const versions = item.versions ?? [];
  const { density, toggle: toggleDensity } = useVersionsListDensity({
    storageKey: POPUP_DENSITY_KEY,
    fallback: 'compact',
  });
  const compact = density === 'compact';
  const previewLen = previewMaxLen(density, 'popup');
  const [expandedRest, setExpandedRest] = useState(false);

  useEffect(() => {
    if (versions.length <= VERSION_UI_FULL_THRESHOLD) {
      setExpandedRest(false);
    }
  }, [versions.length]);

  const needsFold = versions.length > VERSION_UI_FULL_THRESHOLD;
  const visibleVersions =
    !needsFold || expandedRest ? versions : versions.slice(0, VERSION_UI_FULL_THRESHOLD);
  const hiddenCount = needsFold ? versions.length - VERSION_UI_FULL_THRESHOLD : 0;

  const extractedCount = versions.filter((v) => v.source === 'extracted').length;
  const distinctModels = new Set(
    versions.map((v) => (v.meta ? `${v.meta.provider}|${v.meta.model}` : '')).filter(Boolean),
  );

  const handleRestore = async (v: PromptVersion) => {
    const next = await restorePromptVersion(item.id, v.id);
    if (next) await onAfterMutation();
  };

  const handleDelete = async (v: PromptVersion, isCurrent: boolean) => {
    if (versions.length <= 1) return;
    const msg = isCurrent
      ? '确定删除「当前版本」吗？删除后将由下一条版本自动顶替为新的当前版本，此操作不可撤销'
      : '确定删除该版本吗？此操作不可撤销';
    if (!confirm(msg)) return;
    const next = await removePromptVersion(item.id, v.id);
    if (next) await onAfterMutation();
  };

  return (
    <div className="mt-3 rounded-lg border border-zinc-300/70 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-950/80 overflow-hidden shadow-inner">
      <div className="px-2.5 py-1.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
          历史版本 · {versions.length}
        </span>
        <button
          type="button"
          onClick={toggleDensity}
          aria-pressed={compact}
          className={cx(
            'p-1 rounded transition',
            compact
              ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300'
              : 'text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800',
          )}
          title={compact ? '切换为详细列表' : '切换为紧凑列表'}
        >
          {compact ? <List className="w-3.5 h-3.5" /> : <AlignJustify className="w-3.5 h-3.5" />}
        </button>
      </div>

      {extractedCount > 1 && (
        <div className="px-2.5 py-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 border-b border-zinc-200/60 dark:border-zinc-800">
          <Layers className="w-3 h-3 text-violet-500 flex-none" />
          被反推 <b className="text-zinc-700 dark:text-zinc-200">{extractedCount}</b> 次
          {distinctModels.size > 1 && (
            <span>
              · <b className="text-zinc-700 dark:text-zinc-200">{distinctModels.size}</b> 个模型
            </span>
          )}
        </div>
      )}

      <ul
        className={cx(
          'p-2 space-y-1.5 max-h-[min(320px,50vh)] overflow-y-auto',
          VERSIONS_LIST_SCROLLBAR,
        )}
      >
        {visibleVersions.map((v, idx) => {
          const isCurrent = versions[0]?.id === v.id;
          const isFirst = idx === 0;
          const isLast = idx === visibleVersions.length - 1;
          const cid = `ver:${item.id}::${v.id}`;
          const ord = getVersionOrdinalLabel(v.versionNo, isCurrent);
          const versionIndex = versions.indexOf(v);
          const { text: preview, truncated: previewTruncated } = versionListPreviewText(
            v.prompt,
            versionListReferencePrompt(versions, versionIndex),
            previewLen,
          );
          const fullTime = new Date(v.createdAt).toLocaleString();
          const meta = v.meta ?? {
            provider: item.provider,
            model: item.model,
            style: item.style,
            strategy: item.strategy,
          };

          const cardClass = cx(
            'rounded-md ring-1 ring-zinc-200/70 dark:ring-zinc-700/60 bg-white/90 dark:bg-zinc-900/70 transition-colors',
            compact ? 'px-2 py-1' : 'px-2.5 py-2',
            isCurrent &&
              'bg-emerald-500/8 dark:bg-emerald-500/10 ring-emerald-500/25 dark:ring-emerald-500/30 border-l-2 border-l-emerald-500',
          );

          if (compact) {
            return (
              <li key={v.id} className="flex gap-1 items-stretch min-w-0">
                <VersionRailColumn
                  source={v.source}
                  isCurrent={isCurrent}
                  isFirst={isFirst}
                  isLast={isLast}
                  compact
                />
                <div className={cx('flex-1 min-w-0', cardClass)}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`flex-none px-1.5 py-px rounded font-semibold text-[10px] ${ORD_TAG_CLASS[ord.kind]}`}
                    >
                      {ord.label}
                    </span>
                    <span className="flex-1 min-w-0 text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                      {preview}
                      {previewTruncated ? '…' : ''}
                    </span>
                    <div className="flex items-center gap-0.5 flex-none ml-auto text-[10px]">
                      <button
                        type="button"
                        onClick={() => onCopy(v.prompt, cid)}
                        className="inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition"
                      >
                        <CopyFeedbackLabel active={copiedKey === cid} />
                      </button>
                      {versions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(v, isCurrent)}
                          title={
                            isCurrent ? '删除当前版本（下一条版本将顶替为当前）' : '删除此版本'
                          }
                          className="inline-flex items-center px-1 py-0.5 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={v.id} className="flex gap-1.5 items-stretch min-w-0">
              <VersionRailColumn
                source={v.source}
                isCurrent={isCurrent}
                isFirst={isFirst}
                isLast={isLast}
                compact={false}
              />
              <div className={cx('flex-1 min-w-0', cardClass)}>
                <div className="flex items-center gap-1.5 text-[10px] mb-1 flex-wrap">
                  <span className={`px-1.5 py-px rounded font-semibold ${ORD_TAG_CLASS[ord.kind]}`}>
                    {ord.label}
                  </span>
                  <SourceTag source={v.source} />
                  {meta.strategy && (
                    <span className="px-1.5 py-px rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {STRATEGY_LABELS[meta.strategy] ?? meta.strategy}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-1.5 py-px rounded bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-200/60 dark:ring-zinc-700/60">
                    <span className="font-medium">{meta.provider}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="font-mono truncate max-w-[100px]">{meta.model}</span>
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500" title={fullTime}>
                    {formatTime(v.createdAt)}
                  </span>
                </div>

                <p className="text-[12px] leading-[1.5] text-zinc-600 dark:text-zinc-400 line-clamp-2 break-words">
                  {preview}
                  {previewTruncated ? '…' : ''}
                </p>

                <div className="mt-1.5 flex items-center gap-1 flex-wrap text-[10px]">
                  <button
                    type="button"
                    onClick={() => onCopy(v.prompt, cid)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition"
                  >
                    <CopyFeedbackLabel active={copiedKey === cid} />
                  </button>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => void handleRestore(v)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
                    >
                      <RotateCcw className="w-3 h-3" /> 恢复此版本
                    </button>
                  )}
                  {versions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(v, isCurrent)}
                      title={isCurrent ? '删除当前版本（下一条版本将顶替为当前）' : '删除此版本'}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {needsFold && (
        <div className="border-t border-zinc-200/70 dark:border-zinc-800 px-2 py-1.5">
          <button
            type="button"
            onClick={() => setExpandedRest((x) => !x)}
            className="w-full text-center text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-md py-1 transition"
          >
            {expandedRest ? '收起' : `展开其余 ${hiddenCount} 条`}
          </button>
        </div>
      )}
    </div>
  );
}
