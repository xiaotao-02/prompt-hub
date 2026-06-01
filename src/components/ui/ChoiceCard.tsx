import * as React from 'react';
import { Check } from 'lucide-react';
import { cx } from './cx';

export interface ChoiceCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** 紧凑模式：仅标题行，不展示 description / meta */
  compact?: boolean;
  titleText: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
}

export const ChoiceCard = React.forwardRef<HTMLButtonElement, ChoiceCardProps>(
  (
    {
      active = false,
      compact = false,
      titleText,
      description,
      meta,
      badge,
      className,
      type = 'button',
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cx(
        'relative flex h-full min-h-0 w-full flex-col rounded-lg border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/45',
        compact ? 'p-2' : 'p-3',
        active
          ? 'border-violet-500 bg-violet-50/80 ring-1 ring-violet-500/20 dark:bg-violet-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/45',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <span className="min-w-0 truncate">{titleText}</span>
            {badge}
          </div>
          {!compact && description && (
            <div className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </div>
          )}
        </div>
        {active && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      {!compact && meta && <div className="mt-auto pt-2 text-[10px] text-zinc-400">{meta}</div>}
      {children}
    </button>
  ),
);
ChoiceCard.displayName = 'ChoiceCard';
