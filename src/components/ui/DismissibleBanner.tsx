import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';
import { StatusBanner } from './StatusBanner';
import { cx } from './cx';

type DismissibleBannerTone = 'danger' | 'warning' | 'success';

const DISMISS_HOVER_CLASS: Record<DismissibleBannerTone, string> = {
  danger: 'hover:bg-rose-100 dark:hover:bg-rose-500/20',
  warning: 'hover:bg-amber-100 dark:hover:bg-amber-500/20',
  success: 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
};

export interface DismissibleBannerProps {
  open: boolean;
  tone: DismissibleBannerTone;
  children: ReactNode;
  onDismiss: () => void;
}

export function DismissibleBanner({ open, tone, children, onDismiss }: DismissibleBannerProps) {
  const presence = usePresence(open);

  if (!presence.mounted) return null;

  return (
    <StatusBanner
      tone={tone}
      className={cx(
        'rounded-none border-x-0 border-t-0 px-3 py-2',
        presence.status === 'exit' ? 'ui-slide-down-in-exit' : 'ui-slide-down-in',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="flex-1">{children}</span>
        <button
          type="button"
          onClick={onDismiss}
          className={cx('p-0.5 rounded ui-transition', DISMISS_HOVER_CLASS[tone])}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </StatusBanner>
  );
}
