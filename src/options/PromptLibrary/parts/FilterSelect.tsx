import { useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AnchoredMenuPanel, cx } from '@/components/ui';

export function FilterSelect({
  label,
  icon,
  options,
  value,
  onChange,
  highlightWhen = (v) => v !== 'all',
  ariaLabel,
  compact = false,
}: {
  label: string;
  icon?: ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  highlightWhen?: (value: string) => boolean;
  ariaLabel?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;
  const highlighted = highlightWhen(value);

  return (
    <div ref={rootRef} className="relative inline-flex min-w-0 shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? `${label}：${selectedLabel}`}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'inline-flex min-h-[28px] items-center gap-1 rounded-md border px-2 py-1',
          compact ? 'max-w-[128px]' : 'max-w-[148px] gap-1.5',
          'text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/45',
          highlighted
            ? 'border-violet-400/60 bg-violet-50/70 text-violet-800 dark:border-violet-500/35 dark:bg-violet-500/10 dark:text-violet-200'
            : 'border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600',
          open && 'ring-2 ring-violet-500/30 border-violet-500/50',
        )}
      >
        {icon ? <span className="shrink-0 text-zinc-400 dark:text-zinc-500">{icon}</span> : null}
        {!compact || !icon ? (
          <span className="shrink-0 text-zinc-400 dark:text-zinc-500">{label}</span>
        ) : null}
        <span className="min-w-0 truncate font-medium">{selectedLabel}</span>
        <ChevronDown
          className={cx('h-3 w-3 shrink-0 text-zinc-400 ui-chevron-spring', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      <AnchoredMenuPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        rootRef={rootRef}
        panelRef={panelRef}
        role="listbox"
        aria-label={ariaLabel ?? label}
        fitContent
        fixedWidth={200}
      >
        <ul className="ui-dropdown-scrollbar m-0 max-h-[inherit] list-none overflow-y-auto p-1">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cx(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition',
                    active
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {active ? <Check className="h-3 w-3 shrink-0 text-violet-500" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </AnchoredMenuPanel>
    </div>
  );
}
