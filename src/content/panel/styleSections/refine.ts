/** Panel CSS section: refine */
export const refineCss = `
.refine-box {
  display: flex; flex-direction: column; gap: 8px;
  position: relative;
  transition: opacity .15s;
}
.refine-box.loading { opacity: 0.85; }
.refine-input {
  width: 100%; min-height: 80px; max-height: 220px; resize: vertical;
  padding: 8px 10px; border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
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
    background: color-mix(in srgb, var(--pe-surface) 70%, transparent);
  }
}
.refine-error {
  padding: 6px 10px; border-radius: 6px;
  background: color-mix(in srgb, var(--pe-danger) 12%, transparent);
  color: var(--pe-danger);
  font-size: 11px; line-height: 1.45;
}
.refine-suggest {
  display: flex; flex-wrap: wrap; gap: 4px;
}
.chip {
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-surface);
  color: var(--pe-text-muted);
  font-size: 11px; padding: 2px 8px; border-radius: 999px;
  cursor: pointer; font-family: inherit;
  transition: background .12s, opacity .12s, color .12s, border-color .12s;
}
.chip:hover {
  color: var(--pe-accent);
  border-color: color-mix(in srgb, var(--pe-accent) 28%, var(--pe-border-strong));
  background: var(--pe-accent-soft);
}
.chip:disabled { opacity: 0.5; cursor: not-allowed; }
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
.btn.secondary .spinner {
  border-color: color-mix(in srgb, var(--pe-text-muted) 40%, transparent);
  border-top-color: var(--pe-text-muted);
}
@keyframes spin { to { transform: rotate(360deg); } }

.link-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--pe-text-muted);
  font-size: 11px;
  line-height: 1;
  font-family: inherit;
  transition: background .12s, color .12s, opacity .12s;
}
.link-btn:hover:not([disabled]) {
  color: var(--pe-text);
  background: var(--pe-bg-muted);
}
.link-btn.active {
  color: var(--pe-accent);
  background: var(--pe-accent-soft);
}
.link-btn.primary {
  color: var(--pe-accent);
}
.link-btn.primary:hover:not([disabled]) {
  background: var(--pe-accent-soft);
}
/* 危险动作（删除版本）：常态保持中性灰，hover 才变 danger 色 */
.link-btn.danger {
  color: var(--pe-text-muted);
  margin-left: auto;
}
.link-btn.danger:hover:not([disabled]) {
  color: var(--pe-danger);
  background: color-mix(in srgb, var(--pe-danger) 10%, transparent);
}
.link-btn[disabled] {
  cursor: not-allowed;
  opacity: 0.35;
}
.link-btn[disabled]:hover {
  background: transparent;
}
@media (prefers-color-scheme: dark) {
  .link-btn:hover:not([disabled]) {
    background: rgba(255,255,255,0.06);
  }
}

/* panel-row：success 状态下，header 下方的横向容器。
   - flex: 1 1 auto + min-height: 0：占满 panel 剩余高度；align-items:
     stretch 让 .body 与 .versions-side 等高，侧栏内含 .versions-list
     在固定高度内 overflow-y 滚动。
   - overflow: hidden：避免 sidebar width 过渡的中间帧把超出宽度推出去。
   - sidebar 现在是占布局空间的 flex item，不再是覆盖层，所以这里不需要
     position: relative 提供定位上下文。 */
`;
