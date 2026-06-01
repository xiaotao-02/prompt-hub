/** Panel CSS section: versions */
export const versionsCss = `
.panel-row {
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

/* 左侧历史版本侧栏：常驻 DOM 的 flex 列，展开时把 .body 挤窄而不是
   覆盖在它上面。
   设计要点：
   - 收起时 width: 0 + overflow: hidden，DOM 在但视觉完全消失。
   - 用 width 过渡做"展开/收起"动画，比 transform 浮层更直观地告诉用户
     主体内容是被推开了，不会再有"按钮被挡住点不到"的问题。
   - pointer-events 收起时关掉，万一里面有焦点也接不到键鼠事件。
   - flex: none 防止它被父级 flex 算法压缩到非 width 设定的尺寸。
   - min-height: 0：避免默认 min-height:auto 卡住，保证 .versions-list
     可在父列 flex 约束下收紧并出现滚动条。 */
.versions-side {
  flex: none;
  contain: size;
  width: 0;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--pe-bg-muted);
  border-right: 1px solid transparent;
  transition: width var(--pe-collapse-duration) var(--pe-collapse-ease),
              border-right-color var(--pe-collapse-duration) ease,
              opacity .18s ease;
  opacity: 0;
  pointer-events: none;
}
.panel-row.versions-open .versions-side {
  width: var(--pe-versions-width, 280px);
  border-right-color: var(--pe-border);
  opacity: 1;
  pointer-events: auto;
}
/* sidebar 内部布局始终按 --pe-versions-width 计算，外层 width 在 0 ↔ 目标宽 过渡时，
   .versions-head 标题 / .version-preview 文本不会跟着挤压换行 → 过渡
   视觉更稳。外层 overflow:hidden 会把多出来的部分裁掉。 */
.versions-side > *:not(.versions-resize-handle) {
  min-width: var(--pe-versions-width, 280px);
}
.versions-side {
  position: relative;
}
.panel-row.versions-open .versions-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  z-index: 2;
  touch-action: none;
}
.panel-row.versions-open .versions-resize-handle:hover,
.panel-row.versions-open .versions-side.versions-resizing .versions-resize-handle {
  background: rgba(99,102,241,0.18);
}
@media (prefers-color-scheme: dark) {
  .panel-row.versions-open .versions-resize-handle:hover,
  .panel-row.versions-open .versions-side.versions-resizing .versions-resize-handle {
    background: rgba(139,92,246,0.22);
  }
}
@media (prefers-color-scheme: dark) {
  .versions-side {
    background: rgba(30,30,34,0.98);
  }
  .panel-row.versions-open .versions-side {
    border-right-color: rgba(255,255,255,0.10);
  }
}
.versions-head {
  padding: 10px 12px;
  font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  flex: none;
  opacity: 0.85;
}
.versions-head-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.versions-head-actions .icon-btn[aria-pressed="true"] {
  color: var(--pe-accent);
  background: var(--pe-accent-soft);
}
@media (prefers-color-scheme: dark) {
  .versions-head { border-bottom-color: rgba(255,255,255,0.06); }
}
.versions-list {
  list-style: none; margin: 0; padding: 0;
  flex: 1 1 auto; min-height: 0;
  overflow-y: auto;
}
.version-item {
  position: relative;
  padding: 8px 10px 8px 26px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
  transition: background .12s, transform var(--pe-version-flip-duration, .28s) ease;
}
@media (prefers-reduced-motion: reduce) {
  .version-item {
    transition: background .12s;
  }
}
/* git 轨道：竖线 + 来源色圆点 */
.version-item--rail::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(161,161,170,0.35);
  pointer-events: none;
}
.versions-list .version-item--rail:first-child::before { top: 50%; }
.versions-list .version-item--rail:last-child::before { bottom: 50%; }
.version-item--rail::after {
  content: '';
  position: absolute;
  left: 9px;
  top: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(161,161,170,0.55);
  border: 2px solid var(--pe-bg-muted, #f4f4f5);
  box-sizing: border-box;
  pointer-events: none;
  z-index: 1;
}
.version-item--rail[data-source="extracted"]::after { background: #10b981; }
.version-item--rail[data-source="edited"]::after { background: #f59e0b; }
.version-item--rail[data-source="refined"]::after { background: #a855f7; }
.version-item--rail[data-source="restored"]::after { background: #6366f1; }
.version-item--rail[data-source="pending"]::after {
  background: rgba(161,161,170,0.65);
  animation: version-rail-pending-pulse 1.4s ease-in-out infinite;
}
.version-item--rail.current::after {
  box-shadow: 0 0 0 2px rgba(16,185,129,0.35), 0 0 0 4px rgba(16,185,129,0.12);
}
@keyframes version-rail-pending-pulse {
  0%, 100% { opacity: 0.55; transform: scale(0.92); }
  50% { opacity: 1; transform: scale(1); }
}
@media (prefers-color-scheme: dark) {
  .version-item--rail::before { background: rgba(113,113,122,0.45); }
  .version-item--rail::after { border-color: rgba(30,30,34,0.98); }
  .version-item--rail[data-source="extracted"]::after { background: #34d399; }
  .version-item--rail[data-source="edited"]::after { background: #fbbf24; }
  .version-item--rail[data-source="refined"]::after { background: #c084fc; }
  .version-item--rail[data-source="restored"]::after { background: #818cf8; }
  .version-item--rail[data-source="pending"]::after { background: rgba(161,161,170,0.75); }
  .version-item--rail.current::after {
    box-shadow: 0 0 0 2px rgba(52,211,153,0.45), 0 0 0 4px rgba(52,211,153,0.15);
  }
}
.versions-side.versions-compact .version-item--rail::after {
  top: 50%;
  transform: translateY(-50%);
}
.versions-side.versions-compact .version-item--rail[data-source="pending"]::after {
  animation: version-rail-pending-pulse-compact 1.4s ease-in-out infinite;
}
@keyframes version-rail-pending-pulse-compact {
  0%, 100% { opacity: 0.55; transform: translateY(-50%) scale(0.92); }
  50% { opacity: 1; transform: translateY(-50%) scale(1); }
}
.version-item.refine-pending { opacity: 0.95; }
.version-item.refine-pending .version-preview { font-style: italic; color: rgba(80,80,90,0.95); }
.version-item:last-child { border-bottom: none; }
.version-item:hover { background: rgba(99,102,241,0.06); }
.version-item:focus-visible {
  outline: 2px solid var(--pe-focus);
  outline-offset: -2px;
}
.version-item.current { background: rgba(16,185,129,0.06); }
/* selected：editor 内容匹配的那一条。紫色背景只表示正在预览；
   恢复历史版本仍必须显式点击"恢复此版本"。
   写在 .current 后面，覆盖它的绿色背景，让"选中态"优先于"最新版"。 */
.version-item.selected { background: rgba(99,102,241,0.12); }
.version-item.selected:hover { background: rgba(99,102,241,0.16); }
@media (prefers-color-scheme: dark) {
  .version-item { border-bottom-color: rgba(255,255,255,0.04); }
  .version-item:hover { background: rgba(139,92,246,0.10); }
  .version-item.current { background: rgba(16,185,129,0.10); }
  .version-item.selected { background: rgba(139,92,246,0.18); }
  .version-item.selected:hover { background: rgba(139,92,246,0.22); }
}
.version-head {
  display: flex; align-items: center; gap: 6px; font-size: 11px; margin-bottom: 4px;
  flex-wrap: nowrap;
  min-width: 0;
}
.version-tag {
  flex: none;
  white-space: nowrap;
  padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;
  background: rgba(99,102,241,0.12); color: #4f46e5;
}
.version-tag.extracted { background: rgba(16,185,129,0.12); color: #047857; }
.version-tag.edited { background: rgba(245,158,11,0.14); color: #b45309; }
.version-tag.restored { background: rgba(99,102,241,0.12); color: #4f46e5; }
.version-tag.refined { background: rgba(168,85,247,0.14); color: #7e22ce; }
@media (prefers-color-scheme: dark) {
  .version-tag.extracted { background: rgba(16,185,129,0.18); color: #6ee7b7; }
  .version-tag.edited { background: rgba(245,158,11,0.20); color: #fbbf24; }
  .version-tag.restored { background: rgba(139,92,246,0.20); color: #c4b5fd; }
  .version-tag.refined { background: rgba(168,85,247,0.25); color: #d8b4fe; }
}
.version-time {
  flex: none;
  white-space: nowrap;
  margin-left: auto;
  opacity: 0.65;
}
.version-meta, .version-strategy {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;
  background: rgba(255,255,255,0.70); color: #52525b;
  border: 1px solid rgba(212,212,216,0.70);
}
.version-strategy {
  background: rgba(245,158,11,0.12); color: #b45309; border-color: rgba(245,158,11,0.25);
}
@media (prefers-color-scheme: dark) {
  .version-meta {
    background: rgba(39,39,42,0.80); color: #d4d4d8; border-color: rgba(63,63,70,0.80);
  }
  .version-strategy {
    background: rgba(245,158,11,0.18); color: #fbbf24; border-color: rgba(245,158,11,0.26);
  }
}
/* 版本序号 chip：与来源 chip 并列在同一行，按 versionNo 显示
   "初始 / 版本N / 当前"。当前 = emerald，初始 = sky 蓝（与 emerald 区分），
   中间版本 = 中性灰。 */
.version-ord {
  flex: none;
  white-space: nowrap;
  padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;
  background: rgba(113,113,122,0.18); color: #3f3f46;
}
.version-ord.current { background: rgba(16,185,129,0.18); color: #047857; }
.version-ord.initial { background: rgba(14,165,233,0.18); color: #0369a1; }
@media (prefers-color-scheme: dark) {
  .version-ord { background: rgba(161,161,170,0.20); color: #e4e4e7; }
  .version-ord.current { background: rgba(16,185,129,0.25); color: #6ee7b7; }
  .version-ord.initial { background: rgba(56,189,248,0.25); color: #7dd3fc; }
}
.version-preview {
  font-size: 12px; line-height: 1.5; opacity: 0.85;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; word-break: break-word;
}
.version-actions {
  display: flex; gap: 4px; margin-top: 4px;
  flex-wrap: wrap;
}
/* 紧凑列表：单行 flex — 版本 | 预览 | 复制 | 删除 */
.versions-side.versions-compact .version-item--compact {
  padding: 4px 8px 4px 26px;
}
.versions-side.versions-compact .version-compact-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.versions-side.versions-compact .version-compact-row .version-ord {
  flex: none;
}
.versions-side.versions-compact .version-compact-row .version-preview {
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  opacity: 0.85;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.versions-side.versions-compact .version-compact-row .version-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0;
  margin-left: auto;
}
.versions-side.versions-compact .version-compact-row .version-actions .link-btn {
  font-size: 10px;
  padding: 1px 4px;
}
.versions-side.versions-compact .version-item.refine-pending .version-compact-row .version-preview {
  font-style: italic;
  color: rgba(80,80,90,0.95);
}
@media (prefers-color-scheme: dark) {
  .versions-side.versions-compact .version-item.refine-pending .version-compact-row .version-preview {
    color: rgba(180,180,190,0.9);
  }
}

/* ── 自定义策略下拉选择器 ── */
`;
