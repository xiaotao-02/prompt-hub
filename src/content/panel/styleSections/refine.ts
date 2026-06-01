/** Panel CSS section: refine */
export const refineCss = `
.refine-slot {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--pe-collapse-duration) var(--pe-collapse-ease);
}
.refine-slot.is-open { grid-template-rows: 1fr; }
.refine-slot-inner {
  min-height: 0;
  overflow: hidden;
}

.refine-box {
  border: 1px solid color-mix(in srgb, var(--pe-accent) 28%, transparent);
  background: var(--pe-accent-soft);
  border-radius: var(--pe-radius-lg);
  padding: 10px;
  display: flex; flex-direction: column; gap: 8px;
  position: relative;
  transition: opacity .15s;
}
.refine-box.loading { opacity: 0.85; }
@media (prefers-color-scheme: dark) {
  .refine-box {
    border-color: rgba(139,92,246,0.35);
    background: linear-gradient(180deg, rgba(139,92,246,0.10), rgba(99,102,241,0.06));
  }
}
.refine-head {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; font-weight: 600;
  color: var(--pe-accent);
}
.refine-head > span:first-child {
  display: inline-flex; align-items: center; gap: 6px;
}
@media (prefers-color-scheme: dark) {
  .refine-head { color: #c4b5fd; }
}
.refine-input {
  width: 100%; min-height: 80px; max-height: 220px; resize: vertical;
  padding: 8px 10px; border-radius: var(--pe-radius);
  border: 1px solid color-mix(in srgb, var(--pe-accent) 28%, transparent);
  background: var(--pe-surface);
  color: inherit; font-size: 12px; line-height: 1.5;
  font-family: inherit;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.refine-input:focus {
  border-color: var(--pe-accent);
  box-shadow: 0 0 0 3px var(--pe-focus);
}
.refine-input:disabled {
  opacity: 0.6; cursor: not-allowed;
}
@media (prefers-color-scheme: dark) {
  .refine-input {
    background: rgba(0,0,0,0.25);
    border-color: rgba(139,92,246,0.35);
  }
}
.refine-error {
  padding: 6px 10px; border-radius: 6px;
  background: rgba(239,68,68,0.12); color: #b91c1c;
  font-size: 11px; line-height: 1.45;
}
@media (prefers-color-scheme: dark) {
  .refine-error { color: #fca5a5; background: rgba(239,68,68,0.18); }
}
.refine-suggest {
  display: flex; flex-wrap: wrap; gap: 4px;
}
.chip {
  border: 1px solid color-mix(in srgb, var(--pe-accent) 28%, transparent);
  background: var(--pe-surface);
  color: var(--pe-accent);
  font-size: 11px; padding: 2px 8px; border-radius: 999px;
  cursor: pointer; font-family: inherit;
  transition: background .12s, opacity .12s;
}
.chip:hover { background: rgba(99,102,241,0.10); }
.chip:disabled { opacity: 0.5; cursor: not-allowed; }
@media (prefers-color-scheme: dark) {
  .chip {
    background: rgba(139,92,246,0.10);
    border-color: rgba(139,92,246,0.35);
    color: #c4b5fd;
  }
  .chip:hover { background: rgba(139,92,246,0.20); }
}
.refine-actions {
  display: flex; justify-content: flex-end; gap: 6px;
}
/* refine 流式进度块。和顶部 loading 状态共用 .bar.progress / .hint-row 的样式，
   这里只负责给一个内边距和淡入动画。 */
.refine-progress {
  padding: 4px 0 0;
  animation: fadeIn .2s ease-out;
}
.refine-progress .hint-row { margin-top: 6px; }
/* refine 流式预览的 textarea：比顶部 loading 那个矮一点，省得在面板里把
   底部按钮挤下去。 */
.prompt-text.streaming.refine-streaming {
  min-height: 120px; max-height: 280px;
  font-size: 12px; line-height: 1.55;
}
.spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.link-btn {
  background: transparent; border: none; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-radius: 6px;
  color: inherit; opacity: 0.7;
  font-size: 11px;
  line-height: 1;
  font-family: inherit;
}
.link-btn:hover { opacity: 1; background: rgba(0,0,0,0.05); }
.link-btn.active { opacity: 1; background: rgba(99,102,241,0.12); color: #4f46e5; }
.link-btn.primary { color: var(--pe-accent); opacity: 0.9; }
.link-btn.primary:hover { background: rgba(99,102,241,0.12); opacity: 1; }
/* 危险动作（删除版本）：常态保持中性灰，hover 才变玫红，避免在
   sidebar 一排按钮里抢眼。margin-left:auto 把它推到右端，与
   "复制 / 恢复" 留出视觉间距。 */
.link-btn.danger { color: inherit; opacity: 0.55; margin-left: auto; }
.link-btn.danger:hover {
  opacity: 1; background: rgba(244,63,94,0.10); color: #e11d48;
}
.link-btn[disabled] { cursor: not-allowed; opacity: 0.35; }
.link-btn[disabled]:hover { background: transparent; }
@media (prefers-color-scheme: dark) {
  .link-btn:hover { background: rgba(255,255,255,0.06); }
  .link-btn.active { background: rgba(139,92,246,0.18); color: #c4b5fd; }
  .link-btn.primary { color: #a5b4fc; }
  .link-btn.primary:hover { background: rgba(139,92,246,0.18); }
  .link-btn.danger:hover { background: rgba(244,63,94,0.18); color: #fda4af; }
}

/* panel-row：success 状态下，header 下方的横向容器。
   - flex: 1 1 auto + min-height: 0：占满 panel 剩余高度；align-items:
     stretch 让 .body 与 .versions-side 等高，侧栏内含 .versions-list
     在固定高度内 overflow-y 滚动。
   - overflow: hidden：避免 sidebar width 过渡的中间帧把超出宽度推出去。
   - sidebar 现在是占布局空间的 flex item，不再是覆盖层，所以这里不需要
     position: relative 提供定位上下文。 */
`;
