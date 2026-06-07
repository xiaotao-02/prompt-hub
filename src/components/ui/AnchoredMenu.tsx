import { createPortal } from 'react-dom';
import { useRef } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { cx } from './cx';
import {
  useAnchoredDropdown,
  type AnchoredDropdownAlign,
  type AnchoredDropdownPosition,
} from '@/hooks/useAnchoredDropdown';
import { useAnchoredMenuDismiss } from '@/hooks/useAnchoredMenuDismiss';

const PANEL_CLASS =
  'fixed z-[2147483601] overflow-hidden rounded-xl border border-zinc-200 bg-white/98 shadow-lg backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/98';

export function anchoredMenuPanelStyle(
  pos: AnchoredDropdownPosition,
  opts?: { fitContent?: boolean },
): CSSProperties {
  return {
    top: pos.top,
    left: pos.left,
    width: pos.width,
    transform: pos.placeAbove ? 'translateY(-100%)' : undefined,
    maxHeight: opts?.fitContent ? undefined : pos.maxHeight,
  };
}

export interface AnchoredMenuPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  rootRef?: RefObject<HTMLElement | null>;
  gap?: number;
  preferredMaxHeight?: number;
  align?: AnchoredDropdownAlign;
  fixedWidth?: number;
  fitContent?: boolean;
  showBackdrop?: boolean;
  role?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  ignoreNestedAnchoredDropdown?: boolean;
}

/** Portal 锚定浮层壳：定位 + 外点/Escape 关闭 + data-anchored-dropdown */
export function AnchoredMenuPanel({
  open,
  onClose,
  anchorRef,
  panelRef,
  rootRef,
  gap = 6,
  preferredMaxHeight = 280,
  align = 'match',
  fixedWidth,
  fitContent,
  showBackdrop,
  role,
  'aria-label': ariaLabel,
  className,
  style,
  children,
  ignoreNestedAnchoredDropdown,
}: AnchoredMenuPanelProps) {
  const presence = usePresence(open);
  const pos = useAnchoredDropdown(open, anchorRef, gap, preferredMaxHeight, {
    align,
    fixedWidth,
    fitContent,
  });
  const lastPosRef = useRef(pos);
  if (pos) lastPosRef.current = pos;
  const displayPos = pos ?? lastPosRef.current;

  useAnchoredMenuDismiss(open, onClose, {
    rootRef,
    panelRef,
    ignoreNestedAnchoredDropdown,
  });

  if (!presence.mounted || !displayPos || typeof document === 'undefined') return null;

  const isExiting = presence.status === 'exit';

  return createPortal(
    <>
      {showBackdrop ? (
        <div
          className={cx(
            'fixed inset-0 z-[2147483599] bg-zinc-900/10 backdrop-blur-[2px] dark:bg-black/20 ui-backdrop-fade',
            isExiting ? 'opacity-0' : 'opacity-100',
          )}
          aria-hidden
        />
      ) : null}
      <div
        ref={panelRef}
        role={role}
        aria-label={ariaLabel}
        data-anchored-dropdown=""
        className={cx(
          PANEL_CLASS,
          isExiting ? 'ui-pop-in-exit' : 'ui-pop-in',
          fitContent &&
            'overflow-y-auto overflow-x-hidden ui-dropdown-scrollbar [scrollbar-gutter:stable]',
          className,
        )}
        style={{
          ...anchoredMenuPanelStyle(displayPos, { fitContent }),
          ...(fitContent
            ? { maxHeight: displayPos.maxHeight, scrollbarGutter: 'stable' }
            : undefined),
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
