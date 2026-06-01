import type { ReactNode } from 'react';
import { cx } from './cx';

export interface CollapsibleProps {
  open: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
  /** false：即时展开/收起，不做 grid 高度动画（Popup 等场景避免窗口 resize 抖动） */
  animated?: boolean;
}

/**
 * 高度展开/收起：grid 0fr ↔ 1fr + 统一弹性缓动（见 globals.css token）。
 * 子节点始终挂载以便过渡；收起时对内部设 aria-hidden。
 */
export function Collapsible({ open, children, className, id, animated = true }: CollapsibleProps) {
  if (!animated) {
    if (!open) return null;
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={cx('ui-collapse grid', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]', className)}
    >
      <div className="min-h-0 overflow-hidden" aria-hidden={!open}>
        {children}
      </div>
    </div>
  );
}
