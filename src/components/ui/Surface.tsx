import * as React from 'react';
import { cx } from './cx';

type SurfaceTone = 'default' | 'muted' | 'toolbar' | 'floating';

const TONE_CLASS: Record<SurfaceTone, string> = {
  default: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
  muted: 'border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/35',
  toolbar: 'border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70',
  floating:
    'border-zinc-200 bg-white shadow-lg shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20',
};

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, tone = 'default', ...props }, ref) => (
    <div ref={ref} className={cx('rounded-lg border', TONE_CLASS[tone], className)} {...props} />
  ),
);
Surface.displayName = 'Surface';
