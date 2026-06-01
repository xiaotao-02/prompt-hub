import * as React from 'react';

export function IconBtn({
  children,
  title,
  onClick,
  active,
  activeColor,
  hoverColor,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: 'emerald' | 'amber' | 'violet';
  hoverColor?: 'rose' | 'violet' | 'amber';
  disabled?: boolean;
}) {
  const activeMap = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    violet: 'text-violet-400',
  } as const;
  // hover 默认跟"主操作色"violet 走；rose 用于危险动作（删除），
  // violet 用于「跳到其它编辑容器」这类导航类操作（如召回到网页浮动面板），
  // amber 用于「移动到 / 文件夹」这类归类操作。
  const hoverClass =
    hoverColor === 'rose'
      ? 'hover:text-rose-500'
      : hoverColor === 'amber'
        ? 'hover:text-amber-600 dark:hover:text-amber-300'
        : 'hover:text-violet-600 dark:hover:text-violet-300';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        // 网格卡片整卡可点击打开浮动面板，浮层按钮（复制/置顶/删除）必须阻止冒泡，
        // 否则会同时触发外层 onOpenPanel。
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      title={title}
      className={`w-7 h-7 rounded-md inline-flex items-center justify-center bg-white/85 dark:bg-zinc-900/85 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
        active ? activeMap[activeColor || 'violet'] : 'text-zinc-600 dark:text-zinc-200'
      } ${disabled ? '' : hoverClass}`}
    >
      {children}
    </button>
  );
}
