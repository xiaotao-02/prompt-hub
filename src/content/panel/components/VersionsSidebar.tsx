import { useCallback, useRef, type MouseEvent, type ReactNode } from 'react';
import { useVersionListFlip } from '../hooks/useVersionListFlip';
import type { PromptVersion } from '@/lib/types';
import { getCachedVersionsListDensity } from '@/lib/versionsListDensity';
import {
  clampVersionsSidebarWidth,
  getCachedVersionsSidebarWidth,
  setVersionsSidebarWidth,
} from '@/lib/versionsSidebarWidth';
import { updateGeometry } from '../geometry';
import type { PanelState } from '../state';
import { panel, panelGeometry } from '../state';
import { panelExtractJobs, panelHasActiveRefine, panelRefineJobs } from '../state';
import { runPanelAction } from '../panelActionBridge';
import { IconHtml } from './IconHtml';
import {
  ICON_CLOSE,
  ICON_VERSIONS_DENSITY_COMPACT,
  ICON_VERSIONS_DENSITY_COMFORTABLE,
} from '../icons';

export type VersionsSidebarProps = {
  state: PanelState;
  versions: PromptVersion[];
  listContent: ReactNode;
};

export function versionsRowChrome(
  state: PanelState,
  versions: PromptVersion[],
): { showSidebar: boolean; openClassSuffix: string; displayCount: number } {
  const baseLen = versions.length;
  const extractSlots =
    state.status === 'success' || (state.status === 'loading' && baseLen > 0)
      ? panelExtractJobs(state).length
      : 0;
  const showSidebar = baseLen > 0 || panelHasActiveRefine(state) || extractSlots > 0;
  if (!showSidebar) {
    return { showSidebar: false, openClassSuffix: '', displayCount: 0 };
  }
  const displayCount = baseLen + panelRefineJobs(state).length + extractSlots;
  const openClassSuffix = state.versionsOpen ? ' versions-open' : '';
  return { showSidebar: true, openClassSuffix, displayCount };
}

function applySidebarWidthCss(widthPx: number): void {
  const w = `${widthPx}px`;
  if (panel) panel.style.setProperty('--pe-versions-width', w);
}

export function VersionsSidebar({ state, versions, listContent }: VersionsSidebarProps) {
  const listRef = useRef<HTMLUListElement>(null);
  useVersionListFlip(listRef);
  const { showSidebar, displayCount } = versionsRowChrome(state, versions);

  const handleResizeMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || !state.versionsOpen) return;
      e.preventDefault();
      e.stopPropagation();

      const root = panel;
      if (!root) return;

      const aside = e.currentTarget.closest<HTMLElement>('.versions-side');
      if (!aside) return;

      const startX = e.clientX;
      const startW = getCachedVersionsSidebarWidth();
      const rect = root.getBoundingClientRect();
      const startLeft = rect.left;
      const startPanelW = rect.width;
      const lockedLeft = panelGeometry?.left ?? startLeft;
      const lockedWidth = panelGeometry?.width ?? startPanelW;

      aside.classList.add('versions-resizing');
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      let lastW = startW;
      const onMove = (mv: MouseEvent | globalThis.MouseEvent) => {
        const dx = mv.clientX - startX;
        const newW = clampVersionsSidebarWidth(startW + dx);
        lastW = newW;
        const delta = newW - startW;
        applySidebarWidthCss(newW);
        updateGeometry({
          left: lockedLeft - delta,
          width: lockedWidth + delta,
        });
      };

      const teardown = () => {
        window.removeEventListener('mousemove', onMoveWindow);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('keydown', onEscape, true);
        aside.classList.remove('versions-resizing');
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
      };

      const onMoveWindow = (mv: globalThis.MouseEvent) => onMove(mv);

      const onUp = () => {
        teardown();
        applySidebarWidthCss(lastW);
        void setVersionsSidebarWidth(lastW);
      };

      const onEscape = (ke: KeyboardEvent) => {
        if (ke.key !== 'Escape') return;
        ke.preventDefault();
        ke.stopPropagation();
        teardown();
        applySidebarWidthCss(startW);
        updateGeometry({ left: lockedLeft, width: lockedWidth });
        void setVersionsSidebarWidth(startW);
      };

      window.addEventListener('mousemove', onMoveWindow);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('keydown', onEscape, true);
    },
    [state.versionsOpen],
  );

  if (!showSidebar) return null;

  const density = getCachedVersionsListDensity();
  const compactClass = density === 'compact' ? ' versions-compact' : '';
  const densityIcon =
    density === 'compact' ? ICON_VERSIONS_DENSITY_COMFORTABLE : ICON_VERSIONS_DENSITY_COMPACT;
  const densityTitle = density === 'compact' ? '切换为详细列表' : '切换为紧凑列表';

  return (
    <aside className={`versions-side${compactClass}`} data-role="versions-side">
      <div className="versions-head">
        <span>历史版本 · {displayCount}</span>
        <div className="versions-head-actions">
          <button
            type="button"
            className="icon-btn"
            data-action="toggle-versions-density"
            aria-pressed={density === 'compact' ? 'true' : 'false'}
            title={densityTitle}
            onClick={(e) =>
              runPanelAction('toggle-versions-density', e.currentTarget, e.nativeEvent)
            }
          >
            <IconHtml html={densityIcon} />
          </button>
          <button
            type="button"
            className="icon-btn"
            data-action="toggle-versions"
            title="收起"
            onClick={(e) => runPanelAction('toggle-versions', e.currentTarget, e.nativeEvent)}
          >
            <IconHtml html={ICON_CLOSE} />
          </button>
        </div>
      </div>
      <ul ref={listRef} className="versions-list">
        {listContent}
      </ul>
      {state.versionsOpen ? (
        <div
          className="versions-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="调整历史版本侧栏宽度"
          title="拖动调整侧栏宽度"
          onMouseDown={handleResizeMouseDown}
        />
      ) : null}
    </aside>
  );
}
