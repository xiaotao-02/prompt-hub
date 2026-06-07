/** Panel CSS section: shell */
import { UI_FONT_STACK_SANS } from '@/lib/uiFontStack';

export const shellCss = `
:host, * { box-sizing: border-box; }
.panel-sr-announce {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  pointer-events: none;
}
.panel {
  /* 位置和尺寸由 JS 写入到 inline style（top/left/width/height），
     这里只给一组兜底默认值。height 不写死，让面板按内容自适应；
     用户从任意边缘 / 角落拖拽 resize 之后会被 JS 写成固定 px。 */
  position: fixed;
  top: 24px; left: 24px;
  width: min(720px, calc(100vw - 48px));
  min-width: 360px;
  min-height: 220px;
  max-width: calc(100vw - 16px);
  max-height: calc(100vh - 16px);
  display: flex; flex-direction: column;
  background: var(--pe-bg);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  color: var(--pe-text);
  border: 1px solid var(--pe-border);
  border-radius: var(--pe-radius-lg);
  box-shadow: var(--pe-shadow);
  font: 13px/1.5 ${UI_FONT_STACK_SANS};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "kern" 1;
  overflow: hidden;
  /* resize 由 JS 通过 8 个 .resize-handle 自实现（见 events.ts:bindEdgeResize），
     不再依赖 CSS 原生 resize: both，因为后者只支持右下角一个方向。 */
  animation: panelIn .22s cubic-bezier(.2,.9,.3,1.2);
}
/* 主 UI 在 panel-surface 内替换；根节点与拉手常驻，避免整板销毁导致闪断。
   默认高度随内容；用户拖边缘 resize 写入 geometry.height 后根节点带
   .panel-locked-height，再改回 flex:1 铺满固定高度。 */
.panel > [data-role="panel-surface"] {
  position: relative;
  flex: 0 1 auto;
  min-height: var(--pe-panel-surface-min-h, 0px);
  max-height: calc(100vh - 16px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel.panel-locked-height > [data-role="panel-surface"] {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}

/* 8 个边缘 resize 拉手：分别贴在 panel 内侧的 4 边 + 4 角。
   - 边 handle 6px 厚、长边在 10px 内缩，避免挤占角落 handle 的命中区。
   - 角 handle 14x14，位于 panel 4 个圆角处。
   - 角 handle 的 z-index 高于边 handle，保证斜向拖拽优先于单向。
   - 内嵌在 panel 内部（而非 outside 负偏移），这样不会被 panel 的
     overflow:hidden 截断点击区域。代价是 panel 内容（如 header / 按钮）
     最外圈 6~14px 会被 handle 盖住，但这一圈本来就是空白边距区，
     实际不影响功能。 */
.resize-handle {
  position: absolute;
  z-index: 5;
  /* 默认透明，hover 时不显示视觉提示，靠 cursor 让用户知道可以拖拽。 */
  background: transparent;
}
.resize-handle.n  { top: 0;     left: 14px;  right: 14px; height: 6px;  cursor: ns-resize; }
.resize-handle.s  { bottom: 0;  left: 14px;  right: 14px; height: 6px;  cursor: ns-resize; }
.resize-handle.w  { left: 0;    top: 14px;   bottom: 14px; width: 6px;  cursor: ew-resize; }
.resize-handle.e  { right: 0;   top: 14px;   bottom: 14px; width: 6px;  cursor: ew-resize; }
.resize-handle.nw { top: 0;     left: 0;     width: 14px; height: 14px; cursor: nwse-resize; z-index: 6; }
.resize-handle.ne { top: 0;     right: 0;    width: 14px; height: 14px; cursor: nesw-resize; z-index: 6; }
.resize-handle.sw { bottom: 0;  left: 0;     width: 14px; height: 14px; cursor: nesw-resize; z-index: 6; }
.resize-handle.se { bottom: 0;  right: 0;    width: 14px; height: 14px; cursor: nwse-resize; z-index: 6; }
/* panelIn 跑完后由 JS 给 panel 加上 .mounted，永久禁用入场动画。
   这样后续切换 .dragging / .resizing 等 class 时，浏览器不会因为
   "animation: none" 被移除而把 panelIn 当成新的动画声明重播一次，
   也就避免了"拖动 header 松手瞬间面板闪一下 / 像被重建"的现象。
   写在 .dragging / .resizing 之前，由 !important 自身保证胜出。
   注：这里特意不用反引号，外层 STYLE 是模板字符串，反引号会截断它。 */
.panel.mounted {
  animation: none !important;
}
/* 提示词库浮动面板关闭：仅由 JS 显式加 class，避免普通 content panel 误触发。 */
.panel.library-closing {
  animation: panelOut .18s cubic-bezier(.4,0,.2,1) forwards !important;
}
/* 内容/侧栏驱动的几何变化：宽高与位置平滑过渡（由 geometry.ts 临时添加）。
   .dragging / .resizing 的 transition:none!important 会覆盖，安全。 */
.panel.geometry-transition {
  transition: width var(--pe-collapse-duration) var(--pe-collapse-ease),
              height var(--pe-collapse-duration) var(--pe-collapse-ease),
              left var(--pe-collapse-duration) var(--pe-collapse-ease),
              top var(--pe-collapse-duration) var(--pe-collapse-ease);
}
@media (prefers-reduced-motion: reduce) {
  .panel.geometry-transition {
    transition: none !important;
  }
}
.panel.dragging,
.panel.resizing {
  /* 拖拽 / resize 中关掉动画/过渡，避免位置跳动；并提升一下阴影做拾起效果。 */
  animation: none !important;
  transition: none !important;
  box-shadow: var(--pe-shadow);
  user-select: none;
  /* 弱化而非关掉 blur：从「无毛玻璃」跳回满强度时合成路径突变最明显。
     保留轻量 backdrop 以减轻 mouseup 闪感；成本仍低于满载 20px blur。 */
  backdrop-filter: blur(12px) saturate(130%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(130%) !important;
  background: var(--pe-bg);
  /* will-change 告诉合成器为这个层准备好独立合成，避免 reflow 时重新提层。 */
  will-change: left, top, width, height;
}
@media (prefers-color-scheme: dark) {
  .panel.dragging,
  .panel.resizing {
    background: var(--pe-bg);
  }
}
@media (prefers-color-scheme: dark) {
  .panel {
    background: var(--pe-bg);
    color: var(--pe-text);
    border-color: var(--pe-border);
  }
}
@keyframes panelIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes panelOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(8px) scale(0.98); }
}
`;
