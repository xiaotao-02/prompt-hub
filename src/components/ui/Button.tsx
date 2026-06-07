import * as React from 'react';
import { cx } from './cx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type ButtonSize = 'xs' | 'sm' | 'md' | 'icon';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-violet-600 text-white shadow-sm hover:bg-violet-500 active:bg-violet-700 disabled:hover:bg-violet-600',
  secondary:
    'border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
  ghost:
    'border-transparent bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
  danger:
    'border-transparent bg-transparent text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300',
  quiet:
    'border-zinc-200/80 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-[11px]',
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  icon: 'h-8 w-8 justify-center p-0',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'sm', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border font-medium ui-transition active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
