import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cx } from './cx';

type BannerTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<BannerTone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100',
  danger:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200',
};

const ICONS: Record<BannerTone, React.ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
  danger: <XCircle className="h-4 w-4" />,
};

export interface StatusBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: BannerTone;
  icon?: React.ReactNode;
}

export function StatusBanner({
  className,
  tone = 'info',
  icon = ICONS[tone],
  children,
  ...props
}: StatusBannerProps) {
  return (
    <div
      className={cx(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 shrink-0 opacity-85">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
