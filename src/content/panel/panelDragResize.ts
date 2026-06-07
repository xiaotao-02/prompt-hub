import {
  clampGeometry,
  getLayoutViewportBox,
  MIN_HEIGHT,
  MIN_WIDTH,
  updateGeometry,
  VIEWPORT_MARGIN,
} from './geometry';
import { panelGeometry, type PanelGeometry } from './state';

export function bindHeaderDrag(root: HTMLElement): void {
  root.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const header = (e.target as HTMLElement).closest('.header');
    if (!header || !root.contains(header)) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('.icon-btn, .compose-header-tabs, button, a, input, textarea'))
      return;

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = root.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;
    const lockedWidth = rect.width;
    const lockedHeight = rect.height;

    e.preventDefault();
    root.classList.add('dragging');

    const onMove = (mv: MouseEvent) => {
      const next = clampGeometry({
        left: startLeft + (mv.clientX - startX),
        top: startTop + (mv.clientY - startY),
        width: panelGeometry?.width ?? lockedWidth,
        height: panelGeometry?.height ?? lockedHeight,
      });
      root.style.left = `${next.left}px`;
      root.style.top = `${next.top}px`;
    };

    const onUp = () => {
      teardown();
      const r = root.getBoundingClientRect();
      const patch: { left: number; top: number; width?: number; height?: number } = {
        left: r.left,
        top: r.top,
      };
      if (root.style.width && panelGeometry?.width === undefined) {
        patch.width = Math.round(r.width);
      }
      updateGeometry(patch);
    };

    const teardown = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onEscape, true);
      root.classList.remove('dragging');
    };

    const onEscape = (ke: KeyboardEvent) => {
      if (ke.key !== 'Escape') return;
      ke.preventDefault();
      ke.stopPropagation();
      teardown();
      root.style.left = `${startLeft}px`;
      root.style.top = `${startTop}px`;
      updateGeometry({ left: startLeft, top: startTop });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onEscape, true);
  });
}

export function bindEdgeResize(root: HTMLElement): void {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  root.querySelectorAll<HTMLElement>('.resize-handle').forEach((h) => {
    h.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const dir = h.dataset.dir || '';
      if (!dir) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = root.getBoundingClientRect();
      const startL = rect.left;
      const startT = rect.top;
      const startW = rect.width;
      const startH = rect.height;
      const right = startL + startW;
      const bottom = startT + startH;
      const startX = e.clientX;
      const startY = e.clientY;
      const resizeW = dir.includes('e') || dir.includes('w');
      const resizeH = dir.includes('n') || dir.includes('s');

      root.classList.add('resizing');
      updateGeometry({
        width: Math.round(startW),
        height: Math.round(startH),
      });

      const onMove = (mv: MouseEvent) => {
        const dx = mv.clientX - startX;
        const dy = mv.clientY - startY;
        const {
          width: vvW,
          height: vvH,
          originLeft: oLeft,
          originTop: oTop,
        } = getLayoutViewportBox();

        let newL = startL;
        let newT = startT;
        let newW = startW;
        let newH = startH;

        const edgeRight = oLeft + vvW - VIEWPORT_MARGIN;
        const edgeBottom = oTop + vvH - VIEWPORT_MARGIN;

        if (dir.includes('e')) {
          newW = clamp(startW + dx, MIN_WIDTH, edgeRight - startL);
          newL = startL;
        } else if (dir.includes('w')) {
          const maxL = right - MIN_WIDTH;
          const minL = Math.max(oLeft + VIEWPORT_MARGIN, right - (vvW - VIEWPORT_MARGIN * 2));
          newL = clamp(startL + dx, minL, maxL);
          newW = right - newL;
        }

        if (dir.includes('s')) {
          newH = clamp(startH + dy, MIN_HEIGHT, edgeBottom - startT);
          newT = startT;
        } else if (dir.includes('n')) {
          const maxT = bottom - MIN_HEIGHT;
          const minT = Math.max(oTop + VIEWPORT_MARGIN, bottom - (vvH - VIEWPORT_MARGIN * 2));
          newT = clamp(startT + dy, minT, maxT);
          newH = bottom - newT;
        }

        root.style.left = `${newL}px`;
        root.style.top = `${newT}px`;
        if (resizeW) root.style.width = `${newW}px`;
        if (resizeH) root.style.height = `${newH}px`;
      };

      const teardownResize = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('keydown', onEscapeResize, true);
        root.classList.remove('resizing');
      };

      const onUp = () => {
        teardownResize();
        const r = root.getBoundingClientRect();
        const patch: Partial<PanelGeometry> = {
          left: r.left,
          top: r.top,
        };
        if (resizeW) {
          patch.width = Math.round(r.width);
          patch.widthUserLocked = true;
        }
        if (resizeH) patch.height = Math.round(r.height);
        updateGeometry(patch);
      };

      const onEscapeResize = (ke: KeyboardEvent) => {
        if (ke.key !== 'Escape') return;
        ke.preventDefault();
        ke.stopPropagation();
        teardownResize();
        root.style.left = `${startL}px`;
        root.style.top = `${startT}px`;
        if (resizeW) root.style.width = `${startW}px`;
        if (resizeH) root.style.height = `${startH}px`;
        const escapePatch: Partial<{ left: number; top: number; width: number; height: number }> = {
          left: Math.round(startL),
          top: Math.round(startT),
        };
        if (resizeW) escapePatch.width = Math.round(startW);
        if (resizeH) escapePatch.height = Math.round(startH);
        updateGeometry(escapePatch);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('keydown', onEscapeResize, true);
    });
  });
}
