/**
 * Shadow DOM 建壳共用工具：网页浮窗（content/panel/index.ts）与提示词库浮窗
 * （options/PromptLibrary/LibraryFloatingPanel.tsx）共用同一套「建 Shadow + 注入 STYLE
 * + 建 .panel/surface + 8 个 resize 拉手」逻辑，避免两处各写一份。
 *
 * 注意：两侧的挂载生命周期不同（网页浮窗为消息驱动常驻 stable shell；库浮窗为按 item
 * 挂载/卸载 + backdrop），生命周期由各自维护，本文件只负责「建壳」这一步。
 */
import { STYLE } from './styles';

export const PANEL_RESIZE_DIRS = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] as const;

export const PANEL_SURFACE_SELECTOR = '[data-role="panel-surface"]';

/**
 * 8 个边缘 / 角落 resize 拉手。作为 panel 的直接子节点插入，
 * 由 events.ts:bindEdgeResize 监听 mousedown 实现任意方向缩放。
 * 必须在 React surface 之后追加（不放进 surface 内），换状态整片重渲也不影响其存在。
 */
export function appendPanelResizeHandles(panelRoot: HTMLElement): void {
  for (const d of PANEL_RESIZE_DIRS) {
    const h = document.createElement('div');
    h.className = `resize-handle ${d}`;
    h.dataset.dir = d;
    panelRoot.appendChild(h);
  }
}

/**
 * 建一个带 React surface + resize 拉手的 `.panel` 根节点（不挂载、不建 React 根）。
 */
export function createPanelRoot(): { panelRoot: HTMLDivElement; surface: HTMLDivElement } {
  const panelRoot = document.createElement('div');
  panelRoot.className = 'panel';
  const surface = document.createElement('div');
  surface.dataset.role = 'panel-surface';
  panelRoot.appendChild(surface);
  appendPanelResizeHandles(panelRoot);
  return { panelRoot, surface };
}

/**
 * 建一个注入了面板 STYLE 的 Shadow host（仅 host + shadow + style，不建 .panel）。
 * host 的定位/层级/pointer-events 由调用方通过 hostStyleCss 决定。
 */
export function createPanelShadowHost(options: { hostStyleCss: string; hostId?: string }): {
  host: HTMLDivElement;
  shadow: ShadowRoot;
} {
  const host = document.createElement('div');
  if (options.hostId) host.id = options.hostId;
  host.style.cssText = options.hostStyleCss;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLE;
  shadow.appendChild(style);
  return { host, shadow };
}
