import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export type AnchoredDropdownPosition = {
  top: number;
  left: number;
  width: number;
  placeAbove: boolean;
  maxHeight: number;
};

const DEFAULT_MAX_LIST_HEIGHT = 280;
const VIEWPORT_PADDING = 8;

function roundStable(value: number): number {
  return Math.round(value);
}

function posEqual(a: AnchoredDropdownPosition, b: AnchoredDropdownPosition): boolean {
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.placeAbove === b.placeAbove &&
    a.maxHeight === b.maxHeight
  );
}

/**
 * 将下拉浮层锚定到 trigger 的 viewport 坐标（用于 portal + fixed，避免被 overflow 裁剪）。
 */
export type AnchoredDropdownAlign = 'match' | 'left' | 'right' | 'center';

export function useAnchoredDropdown(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  gap = 6,
  preferredMaxHeight = DEFAULT_MAX_LIST_HEIGHT,
  opts?: { align?: AnchoredDropdownAlign; fixedWidth?: number; fitContent?: boolean },
): AnchoredDropdownPosition | null {
  const align = opts?.align ?? 'match';
  const fixedWidth = opts?.fixedWidth;
  const fitContent = opts?.fitContent ?? false;
  const [pos, setPos] = useState<AnchoredDropdownPosition | null>(null);
  const placeAboveLockedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      placeAboveLockedRef.current = null;
      setPos(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const spaceBelow = vh - rect.bottom - VIEWPORT_PADDING;
      const spaceAbove = rect.top - VIEWPORT_PADDING;
      const flipThreshold = fitContent ? Math.min(preferredMaxHeight, 240) : preferredMaxHeight;
      const computedPlaceAbove = spaceBelow < flipThreshold && spaceAbove > spaceBelow;
      if (fitContent && placeAboveLockedRef.current === null) {
        placeAboveLockedRef.current = computedPlaceAbove;
      }
      const placeAbove =
        fitContent && placeAboveLockedRef.current !== null
          ? placeAboveLockedRef.current
          : computedPlaceAbove;
      const available = placeAbove ? spaceAbove : spaceBelow;
      const maxHeight = fitContent
        ? Math.max(120, available - gap)
        : Math.max(120, Math.min(preferredMaxHeight, available - gap));
      const top = roundStable(placeAbove ? rect.top - gap : rect.bottom + gap);
      const width = roundStable(fixedWidth ?? rect.width);
      let left: number;
      if (align === 'right') {
        const raw = rect.right - width;
        left = Math.max(VIEWPORT_PADDING, Math.min(raw, vw - width - VIEWPORT_PADDING));
      } else if (align === 'left') {
        left = Math.max(VIEWPORT_PADDING, Math.min(rect.left, vw - width - VIEWPORT_PADDING));
      } else if (align === 'center') {
        const raw = rect.left + rect.width / 2 - width / 2;
        left = Math.max(VIEWPORT_PADDING, Math.min(raw, vw - width - VIEWPORT_PADDING));
      } else {
        left = Math.max(VIEWPORT_PADDING, Math.min(rect.left, vw - width - VIEWPORT_PADDING));
      }
      left = roundStable(left);

      const next: AnchoredDropdownPosition = {
        top,
        left,
        width,
        placeAbove,
        maxHeight: roundStable(maxHeight),
      };
      setPos((prev) => (prev && posEqual(prev, next) ? prev : next));
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef, gap, preferredMaxHeight, align, fixedWidth, fitContent]);

  return pos;
}
