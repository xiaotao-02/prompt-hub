import type { ReactNode } from 'react';
import { cx } from '@/components/ui';

export interface SettingRowProps {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 最后一行可去掉底部分隔线 */
  last?: boolean;
}

/**
 * 单行设置项：左说明、右控件，发丝底部分隔线。
 */
export function SettingRow({ label, hint, children, className, last = false }: SettingRowProps) {
  return (
    <div
      className={cx(
        'flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        !last && 'border-b border-zinc-100 dark:border-zinc-800/80',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-800 dark:text-zinc-200">{label}</div>
        {hint ? (
          <div className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            {hint}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-start sm:justify-end">{children}</div>
    </div>
  );
}
