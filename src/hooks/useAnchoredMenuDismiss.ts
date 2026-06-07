import { useEffect, type RefObject } from 'react';

/** 锚定浮层：点击外部 / Escape 关闭 */
export function useAnchoredMenuDismiss(
  open: boolean,
  onClose: () => void,
  opts: {
    rootRef?: RefObject<HTMLElement | null>;
    panelRef: RefObject<HTMLElement | null>;
    /** 不关闭嵌套的其它 data-anchored-dropdown 浮层（如 Popup 服务菜单内 ModelPicker） */
    ignoreNestedAnchoredDropdown?: boolean;
  },
): void {
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (opts.rootRef?.current?.contains(t) || opts.panelRef.current?.contains(t)) return;
      if (
        opts.ignoreNestedAnchoredDropdown &&
        t instanceof HTMLElement &&
        t.closest('[data-anchored-dropdown]')
      ) {
        return;
      }
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        e.stopPropagation();
      }
    };
    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, opts.rootRef, opts.panelRef, opts.ignoreNestedAnchoredDropdown]);
}
