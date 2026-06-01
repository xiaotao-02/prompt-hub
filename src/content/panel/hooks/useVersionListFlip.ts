import { useLayoutEffect, useRef, type RefObject } from 'react';

const FLIP_DURATION_MS = 280;

let flipArmed = false;

/** 在即将触发版本列表重排（如恢复版本）前调用，允许下一次 layout 执行 FLIP 动画。 */
export function armVersionListFlip(): void {
  flipArmed = true;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function measureItemTops(ul: HTMLElement): Map<string, number> {
  const tops = new Map<string, number>();
  ul.querySelectorAll<HTMLElement>('.version-item[data-version-id]').forEach((el) => {
    const id = el.dataset.versionId;
    if (id) tops.set(id, el.getBoundingClientRect().top);
  });
  return tops;
}

export function useVersionListFlip(listRef: RefObject<HTMLUListElement | null>): void {
  const prevTopsRef = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;

    const prevTops = prevTopsRef.current;
    const curTops = measureItemTops(ul);
    const shouldAnimate = flipArmed && !prefersReducedMotion();

    if (shouldAnimate && prevTops.size > 0) {
      flipArmed = false;
      const items: { el: HTMLElement; delta: number }[] = [];

      ul.querySelectorAll<HTMLElement>('.version-item[data-version-id]').forEach((el) => {
        const id = el.dataset.versionId;
        if (!id) return;
        const prevTop = prevTops.get(id);
        const curTop = curTops.get(id);
        if (prevTop == null || curTop == null) return;
        const delta = prevTop - curTop;
        if (Math.abs(delta) < 0.5) return;
        items.push({ el, delta });
      });

      if (items.length > 0) {
        items.forEach(({ el, delta }) => {
          el.style.transition = 'none';
          el.style.transform = `translateY(${delta}px)`;
        });
        void ul.offsetHeight;
        requestAnimationFrame(() => {
          items.forEach(({ el }) => {
            el.style.transition = `transform ${FLIP_DURATION_MS}ms ease`;
            el.style.transform = '';
          });
          window.setTimeout(() => {
            items.forEach(({ el }) => {
              el.style.transition = '';
              el.style.transform = '';
            });
          }, FLIP_DURATION_MS + 50);
        });
      }
    } else if (flipArmed) {
      flipArmed = false;
    }

    prevTopsRef.current = curTops;
  });
}

/** 恢复版本后把列表滚到顶部，便于看到新的「当前」行。 */
export function scrollVersionsListToTopInPanel(root: HTMLElement | null | undefined): void {
  const ul = root?.querySelector<HTMLUListElement>('.versions-list');
  if (ul) ul.scrollTop = 0;
}
