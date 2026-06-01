import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cx } from '@/components/ui';
import { partitionByVision } from '@/lib/modelVision';
import type { ModelVisionSupport } from '@/lib/modelVision';
import { sortModelsGroupedNewestFirst } from '@/lib/api/modelSort';

function formatTimeAgo(t: number): string {
  const diff = Date.now() - t;
  if (diff < 60_000) return '刚刚拉取';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface ModelPickerProps {
  models: string[];
  value: string;
  onChange: (model: string) => void;
  visionById?: Record<string, ModelVisionSupport>;
  discoveredAt?: number;
  disabled?: boolean;
  fetching?: boolean;
  placeholder?: string;
}

export type ModelPickerHandle = {
  open: () => void;
  focusTrigger: () => void;
};

function sortWithVisionBuckets(
  ids: string[],
  visionById: Record<string, ModelVisionSupport>,
): string[] {
  const { vision, unknown, noVision } = partitionByVision(ids, visionById);
  return [...vision, ...unknown, ...noVision];
}

/**
 * 端点拉取模型的自定义下拉（替代原生 select），按识图能力分组。
 */
const ModelPicker = forwardRef<ModelPickerHandle, ModelPickerProps>(function ModelPicker(
  {
    models,
    value,
    onChange,
    visionById = {},
    discoveredAt,
    disabled = false,
    fetching = false,
    placeholder = '选择模型',
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({
    focusTrigger: () => {
      triggerRef.current?.focus();
    },
    open: () => {
      if (disabled || fetching) {
        triggerRef.current?.focus();
        return;
      }
      setOpen(true);
      triggerRef.current?.focus();
    },
  }));

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setFilter('');
  }, [open]);

  const sortedModels = useMemo(() => {
    const base = sortModelsGroupedNewestFirst(models.map((id) => ({ id })));
    if (Object.keys(visionById).length === 0) return base;
    return sortWithVisionBuckets(base, visionById);
  }, [models, visionById]);

  const lowerFilter = filter.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      lowerFilter
        ? sortedModels.filter((m) => m.toLowerCase().includes(lowerFilter))
        : sortedModels,
    [sortedModels, lowerFilter],
  );

  const {
    vision: filteredVision,
    noVision: filteredNoVision,
    unknown: filteredUnknown,
  } = useMemo(() => partitionByVision(filtered, visionById), [filtered, visionById]);

  const visionCount = useMemo(
    () => sortedModels.filter((m) => visionById[m] === 'vision').length,
    [sortedModels, visionById],
  );
  const unknownCount = useMemo(
    () => sortedModels.filter((m) => visionById[m] === 'unknown' || visionById[m] == null).length,
    [sortedModels, visionById],
  );

  const displayValue = value || placeholder;
  const inList = value && sortedModels.includes(value);
  const showSearch = sortedModels.length > 6;

  const metaLine =
    sortedModels.length > 0
      ? `${sortedModels.length} 个 · 识图 ${visionCount} · 未确认 ${unknownCount}${discoveredAt != null ? ` · ${formatTimeAgo(discoveredAt)}` : ''}`
      : null;

  const renderOption = (m: string) => {
    const active = m === value;
    const support = visionById[m];
    const isVision = support === 'vision';
    return (
      <li key={m} role="presentation">
        <button
          type="button"
          role="option"
          aria-selected={active}
          className={cx(
            'w-full text-left px-2.5 py-2 text-xs font-mono rounded-lg flex items-center justify-between gap-2 transition',
            active
              ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200'
              : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
          )}
          onClick={() => {
            onChange(m);
            setOpen(false);
          }}
        >
          <span className="truncate">{m}</span>
          <span className="flex items-center gap-1 shrink-0">
            {isVision && (
              <span className="text-[9px] font-sans font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                识图
              </span>
            )}
            {active && <Check className="w-3.5 h-3.5 text-violet-500" />}
          </span>
        </button>
      </li>
    );
  };

  const renderGroup = (title: string, items: string[]) => {
    if (items.length === 0) return null;
    return (
      <>
        <li
          role="presentation"
          className="sticky top-0 z-[1] px-2.5 py-1.5 text-[10px] font-medium text-zinc-500 bg-zinc-50/95 dark:bg-zinc-900/95 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800"
        >
          {title}
        </li>
        {items.map(renderOption)}
      </>
    );
  };

  const hasVisionGroups =
    Object.keys(visionById).length > 0 &&
    (filteredVision.length > 0 || filteredNoVision.length > 0 || filteredUnknown.length > 0);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || fetching}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled || fetching) return;
          setOpen((o) => !o);
        }}
        className={cx(
          'input w-full flex items-center justify-between gap-2 text-left font-mono text-sm',
          'focus-visible:ring-2 focus-visible:ring-violet-500/45',
          open && 'ring-2 ring-violet-500/30 border-violet-500/50',
          !inList && value && 'text-amber-700 dark:text-amber-200',
        )}
      >
        <span className="truncate">{fetching ? '拉取中…' : displayValue}</span>
        <ChevronDown
          className={cx('w-4 h-4 shrink-0 text-zinc-400 ui-chevron-spring', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && !disabled && !fetching && (
        <div
          role="listbox"
          aria-label="选择模型"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white/98 shadow-lg backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/98"
        >
          {metaLine && (
            <div className="px-3 py-2 text-[11px] text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
              {metaLine}
            </div>
          )}
          {showSearch && (
            <div className="relative px-2 pt-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className="input pl-8 py-1.5 text-xs font-sans"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`搜索（${sortedModels.length}）`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <ul className="max-h-[280px] overflow-y-auto p-1 list-none m-0">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-zinc-400 text-center">
                {filter ? `没有匹配「${filter}」的模型` : '暂无模型'}
              </li>
            ) : hasVisionGroups ? (
              <>
                {renderGroup('支持识图', filteredVision)}
                {renderGroup('未确认', filteredUnknown)}
                {renderGroup('不支持识图', filteredNoVision)}
              </>
            ) : (
              filtered.map((m) => renderOption(m))
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

export default ModelPicker;
