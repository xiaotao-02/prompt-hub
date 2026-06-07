import type { ReactNode } from 'react';
import { cx } from '@/components/ui';

export interface SettingsSectionProps {
  title: ReactNode;
  description?: ReactNode;
  /** 描述与标题同一行（默认叠在标题下方） */
  descriptionInline?: boolean;
  /** 右侧附加信息（如版本号） */
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** 与上一分区之间显示顶部分隔线 */
  bordered?: boolean;
}

const titleClass = 'text-sm font-semibold text-zinc-900 dark:text-zinc-100';
const descriptionClass = 'text-xs text-zinc-500 dark:text-zinc-400 leading-snug';

/**
 * 设置分区：标题 + 可选说明 + 内容，统一 Linear 式纵向节奏。
 */
export function SettingsSection({
  title,
  description,
  descriptionInline = false,
  trailing,
  children,
  className,
  bordered = false,
}: SettingsSectionProps) {
  return (
    <section
      className={cx(
        'space-y-3',
        bordered && 'border-t border-zinc-200/90 pt-5 dark:border-zinc-800/90',
        className,
      )}
    >
      <header
        className={cx(
          'flex justify-between gap-3 min-w-0',
          trailing ? 'items-center' : 'items-start',
        )}
      >
        <div
          className={cx(
            'min-w-0 flex-1',
            descriptionInline
              ? 'flex flex-wrap items-baseline gap-x-2 gap-y-0.5'
              : description
                ? 'space-y-0.5'
                : undefined,
          )}
        >
          <h2 className={titleClass}>{title}</h2>
          {description ? <p className={descriptionClass}>{description}</p> : null}
        </div>
        {trailing ? (
          <div className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">{trailing}</div>
        ) : null}
      </header>
      {children}
    </section>
  );
}
