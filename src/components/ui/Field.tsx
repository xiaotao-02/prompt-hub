import * as React from 'react';
import { cx } from './cx';

export interface FieldProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, description, action, children, className }: FieldProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</label>
        {action}
      </div>
      {children}
      {description && (
        <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}
