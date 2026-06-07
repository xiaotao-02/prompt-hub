import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AnchoredMenuPanel, cx } from '@/components/ui';
import { getStrategyList } from '@/lib/strategies';
import {
  isBuiltinStrategyOptionActive,
  isPresetOptionActive,
  resolveStrategySelectTriggerLabel,
} from '@/lib/strategySelectDisplay';
import { briefUserPresetFingerprint } from '@/lib/storage';
import type { StrategyId } from '@/lib/strategies-meta';
import type { AppSettings, UserStrategyPreset } from '@/lib/types';

const STRATEGY_LIST = getStrategyList();

interface Props {
  settings: AppSettings;
  value: StrategyId;
  presets: UserStrategyPreset[];
  onSelectBuiltin: (id: StrategyId) => void;
  onSelectPreset: (preset: UserStrategyPreset) => void;
  id?: string;
  className?: string;
}

/** 策略版本下拉：内置档位 + 我的预设。 */
export default function StrategySelect({
  settings,
  value,
  presets,
  onSelectBuiltin,
  onSelectPreset,
  id,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLabel = resolveStrategySelectTriggerLabel(
    settings,
    value,
    presets,
    (strategyId) => STRATEGY_LIST.find((s) => s.id === strategyId)?.label ?? strategyId,
  );

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
      <AnchoredMenuPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        rootRef={rootRef}
        panelRef={dropdownRef}
        role="listbox"
        aria-label="选择策略版本"
      >
        <ul className="ui-dropdown-scrollbar overflow-y-auto p-1 list-none m-0 max-h-[inherit]">
          {STRATEGY_LIST.map((s) => {
            const active = isBuiltinStrategyOptionActive(settings, s.id, presets);
            return (
              <li key={s.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  title={s.description}
                  className={cx(
                    'w-full text-left px-2.5 py-2 text-sm rounded-lg flex items-center justify-between gap-2 transition',
                    active
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
                  )}
                  onClick={() => {
                    onSelectBuiltin(s.id);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.label}</span>
                    <span className="block truncate text-[10px] text-zinc-400 mt-0.5">
                      {s.description}
                    </span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0 text-violet-500" />}
                </button>
              </li>
            );
          })}
          {presets.length > 0 && (
            <li
              role="presentation"
              className="px-2.5 py-1.5 text-[10px] font-medium text-zinc-400 border-t border-zinc-100 mt-1 dark:border-zinc-800/80"
            >
              我的预设
            </li>
          )}
          {presets.map((p) => {
            const active = isPresetOptionActive(settings, p, presets);
            return (
              <li key={p.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cx(
                    'w-full text-left px-2.5 py-2 text-sm rounded-lg flex items-center justify-between gap-2 transition',
                    active
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
                  )}
                  onClick={() => {
                    onSelectPreset(p);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-[10px] text-zinc-400 mt-0.5">
                      {briefUserPresetFingerprint(p)}
                    </span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0 text-violet-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      </AnchoredMenuPanel>
    </div>
  );
}
