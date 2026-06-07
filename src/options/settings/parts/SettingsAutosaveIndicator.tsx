import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cx } from '@/components/ui';
import type { SettingsSaveState } from '../hooks/useSettingsPersistence';

interface Props {
  state: SettingsSaveState;
  errorMessage?: string;
  className?: string;
  /** 非设置 Tab 时占位隐藏，避免 Tab 栏跳动 */
  hidden?: boolean;
}

export function SettingsAutosaveIndicator({ state, errorMessage, className, hidden }: Props) {
  if (hidden) {
    return (
      <span className={cx('justify-self-end text-sm invisible select-none', className)} aria-hidden>
        已保存
      </span>
    );
  }

  if (state === 'idle') {
    return (
      <span
        className={cx(
          'justify-self-end text-xs text-zinc-400 dark:text-zinc-500 select-none',
          className,
        )}
        aria-live="polite"
      >
        {/* 占位保持 header 布局稳定 */}
      </span>
    );
  }

  if (state === 'saving') {
    return (
      <span
        key="saving"
        className={cx(
          'justify-self-end inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 ui-fade-in',
          className,
        )}
        aria-live="polite"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        保存中…
      </span>
    );
  }

  if (state === 'saved') {
    return (
      <span
        key="saved"
        className={cx(
          'justify-self-end inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 ui-fade-in',
          className,
        )}
        aria-live="polite"
      >
        <Check className="w-3.5 h-3.5" aria-hidden />
        已保存
      </span>
    );
  }

  return (
    <span
      key="error"
      className={cx(
        'justify-self-end inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 max-w-[200px] ui-fade-in',
        className,
      )}
      aria-live="assertive"
      title={errorMessage}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span className="truncate">保存失败</span>
    </span>
  );
}
