import * as React from 'react';
import { Button, type ButtonProps } from './Button';
import { cx } from './cx';

type IconTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<IconTone, string> = {
  neutral: '',
  primary: 'text-violet-600 dark:text-violet-300',
  success: 'text-emerald-600 dark:text-emerald-300',
  warning: 'text-amber-600 dark:text-amber-300',
  danger: 'text-rose-600 dark:text-rose-300',
};

export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  tone?: IconTone;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone = 'neutral', variant = 'ghost', children, ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={cx(TONE_CLASS[tone], className)}
      {...props}
    >
      {children}
    </Button>
  ),
);
IconButton.displayName = 'IconButton';
