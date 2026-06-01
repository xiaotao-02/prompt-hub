import * as React from 'react';
import { cx } from './cx';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<SegmentedControlOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  /** 全宽等分 Tab（用于首选/次选 API 切换） */
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        'rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/70',
        fullWidth
          ? `grid w-full gap-1 grid-cols-${options.length}`
          : 'inline-flex items-center gap-0.5 p-0.5',
        className,
      )}
      style={
        fullWidth ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined
      }
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              'inline-flex items-center justify-center gap-1.5 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/45',
              fullWidth ? 'h-9 rounded-lg px-3 text-sm' : 'h-7 rounded-md px-2.5 text-xs',
              active
                ? 'bg-white text-violet-700 shadow-sm dark:bg-zinc-950 dark:text-violet-300'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
