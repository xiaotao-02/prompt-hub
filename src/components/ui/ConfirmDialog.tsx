import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';
import { cx } from './cx';

export interface ConfirmDialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
  onClick: () => void;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  actions: ConfirmDialogAction[];
  onClose?: () => void;
}

export function ConfirmDialog({ open, title, description, actions, onClose }: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={() => onClose?.()}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
        <div className={cx('mt-4 flex flex-wrap gap-2 justify-end')}>
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant={action.variant ?? 'secondary'}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
