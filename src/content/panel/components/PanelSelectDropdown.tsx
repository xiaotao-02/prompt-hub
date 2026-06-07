import type { MouseEvent, ReactNode } from 'react';

export function PanelSelectArrow() {
  return (
    <svg className="sd-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
      <path
        d="M1 1l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type PanelSelectDropdownProps = {
  dataRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  /** 无可见标签时隐藏整个控件（如模型徽章未就绪） */
  hidden?: boolean;
  title?: string;
  'aria-label'?: string;
  /** 追加到 `.strategy-dropdown` 的类名 */
  wrapperClassName?: string;
  triggerClassName?: string;
  triggerLabelClassName?: string;
  menuClassName?: string;
  triggerLabel?: ReactNode;
  /** 若提供则完全替换默认 trigger 内容（仍包在 `.sd-trigger` 按钮内） */
  triggerChildren?: ReactNode;
  children: ReactNode;
};

/** Shadow 面板内 `.strategy-dropdown` / `.sd-*` 下拉外壳（策略、输出风格、模型、洗稿强度等共用） */
export function PanelSelectDropdown({
  dataRole,
  open,
  onOpenChange,
  disabled,
  hidden,
  title,
  'aria-label': ariaLabel,
  wrapperClassName = '',
  triggerClassName = '',
  triggerLabelClassName = 'sd-label',
  menuClassName = '',
  triggerLabel,
  triggerChildren,
  children,
}: PanelSelectDropdownProps) {
  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled || hidden) return;
    onOpenChange(!open);
  };

  const wrapperClasses = [
    'strategy-dropdown',
    wrapperClassName,
    disabled ? 'is-disabled' : '',
    hidden ? 'is-hidden' : '',
    open ? 'open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} data-role={dataRole} title={title} aria-label={ariaLabel}>
      <button
        className={['sd-trigger', triggerClassName].filter(Boolean).join(' ')}
        type="button"
        disabled={disabled || hidden}
        onClick={handleTriggerClick}
      >
        {triggerChildren ?? (
          <>
            <span className={triggerLabelClassName}>{triggerLabel}</span>
            <PanelSelectArrow />
          </>
        )}
      </button>
      <ul className={['sd-menu', menuClassName].filter(Boolean).join(' ')}>{children}</ul>
    </div>
  );
}
