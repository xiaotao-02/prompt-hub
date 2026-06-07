import * as React from 'react';
import { IconButton } from '@/components/ui';

/** 提示词库网格卡片浮层图标按钮（基于 L2 IconButton，附加卡片浮层样式） */
export function IconBtn({
  children,
  title,
  onClick,
  active,
  hoverColor,
  disabled,
  size = 'md',
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  /** @deprecated 保留参数兼容 */
  activeColor?: 'emerald' | 'amber' | 'violet';
  hoverColor?: 'rose' | 'violet' | 'amber';
  disabled?: boolean;
  size?: 'md' | 'sm';
}) {
  const hoverClass = hoverColor === 'rose' ? 'hover:text-rose-400' : 'hover:text-zinc-100';
  const sizeClass = size === 'sm' ? '!h-6 !w-6' : '!h-7 !w-7';
  return (
    <IconButton
      type="button"
      variant="ghost"
      tone={hoverColor === 'rose' ? 'danger' : 'neutral'}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      title={title}
      className={`${sizeClass} bg-white/90 dark:bg-zinc-900/90 backdrop-blur ring-1 ring-black/8 dark:ring-white/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
        active ? '!text-zinc-800 dark:!text-zinc-100' : '!text-zinc-600 dark:!text-zinc-300'
      } ${disabled ? '' : hoverClass}`}
    >
      {children}
    </IconButton>
  );
}
