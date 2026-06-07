import { useRef, useState } from 'react';
import { Check, ChevronDown, RefreshCw } from 'lucide-react';
import { AnchoredMenuPanel, cx } from '@/components/ui';
import { isProviderVisionUnsupported } from '@/lib/providerVisionCatalog';
import { PROVIDERS, PROVIDER_LIST_SORTED } from '@/lib/providers';
import type { ProviderId } from '@/lib/types';

interface Props {
  value: ProviderId;
  onChange: (id: ProviderId) => void;
  fetchingIds?: Set<ProviderId>;
  id?: string;
  className?: string;
}

/** 模型供应商下拉：英文在前、中文拼音在后；无识图能力项右侧 Tag 标注。 */
export default function ProviderSelect({
  value,
  onChange,
  fetchingIds,
  id,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFetching = fetchingIds?.has(value);
  const selectedLabel = PROVIDERS[value]?.label ?? value;

  return (
    <div className={cx('flex items-center gap-2 min-w-0', className)}>
      <div ref={rootRef} className="relative flex-1 min-w-0">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((o) => !o)}
          className={cx(
            'input w-full flex items-center justify-between gap-2 text-left text-sm',
            'focus-visible:ring-2 focus-visible:ring-violet-500/45',
            open && 'ring-2 ring-violet-500/30 border-violet-500/50',
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown
            className={cx('w-4 h-4 shrink-0 text-zinc-400 ui-chevron-spring', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      </div>
      {isFetching && (
        <RefreshCw
          className="w-4 h-4 shrink-0 animate-spin text-violet-500"
          aria-label="正在拉取模型"
        />
      )}
      <AnchoredMenuPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        rootRef={rootRef}
        panelRef={dropdownRef}
        role="listbox"
        aria-label="选择服务商"
      >
        <ul className="ui-dropdown-scrollbar overflow-y-auto p-1 list-none m-0 max-h-[inherit]">
          {PROVIDER_LIST_SORTED.map((p) => {
            const active = p.id === value;
            const noVision = isProviderVisionUnsupported(p.id);
            return (
              <li key={p.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  title={p.description}
                  className={cx(
                    'w-full text-left px-2.5 py-2 text-sm rounded-lg flex items-center justify-between gap-2 transition',
                    active
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
                  )}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{p.label}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {noVision && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                        暂不支持识图
                      </span>
                    )}
                    {active && <Check className="w-3.5 h-3.5 text-violet-500" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </AnchoredMenuPanel>
    </div>
  );
}
