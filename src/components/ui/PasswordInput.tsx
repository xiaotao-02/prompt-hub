import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cx } from './cx';

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref) {
    const [show, setShow] = React.useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          type={show ? 'text' : 'password'}
          className={cx('input pr-10', className)}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={show ? '隐藏 API Key' : '显示 API Key'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    );
  },
);
