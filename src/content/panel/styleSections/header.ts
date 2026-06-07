/** Panel CSS section: header */
export const headerCss = `
.header {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--pe-border);
  flex: none;
  overflow: visible;
  /* header 整条作为拖拽把手；内部 icon-btn 会单独覆盖回 pointer。 */
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
@media (prefers-color-scheme: dark) {
  .header { border-bottom-color: rgba(255,255,255,0.06); }
}
.title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; color: var(--pe-text); }
.badge {
  font-weight: 400; font-size: 11px; padding: 2px 6px;
  border-radius: 6px;
  background: var(--pe-bg-muted);
  color: var(--pe-text-muted);
}
@media (prefers-color-scheme: dark) {
  .badge { background: var(--pe-bg-muted); color: var(--pe-text-muted); }
}
/* loading 头部的策略档位标签：用品牌紫色淡底，和右下角进度条的高亮色保持呼应。 */
.strategy-badge {
  background: var(--pe-accent-soft);
  color: var(--pe-accent);
  font-weight: 500;
  flex: none;
  min-width: 4.5rem;
}
@media (prefers-color-scheme: dark) {
  .strategy-badge { background: var(--pe-accent-soft); color: var(--pe-accent); }
}
/* 隐藏时仍占位，避免 settings 回传 model/strategy 后标题行横向抖动 */
.strategy-badge.hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}
/* loading 头部的模型标签：用品牌青蓝色和 strategy 区分一下，
   让用户一眼能看出"用谁的什么模型在跑"。 */
.model-badge {
  background: rgba(14,165,233,0.12);
  color: var(--pe-info);
  font-weight: 500;
  flex: none;
  min-width: 5.5rem;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (prefers-color-scheme: dark) {
  .model-badge { background: rgba(56,189,248,0.20); color: #7dd3fc; }
}
.model-badge.hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}
.quota-badge {
  background: rgba(16,185,129,0.12);
  color: var(--pe-success);
  font-weight: 500;
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  font: inherit;
  font-size: inherit;
  padding: 2px 6px;
  border-radius: 999px;
}
.quota-badge.is-low {
  background: rgba(245,158,11,0.15);
  color: #b45309;
}
.quota-badge.is-error {
  background: rgba(244,63,94,0.12);
  color: var(--pe-danger);
}
.quota-badge.is-muted {
  background: rgba(113,113,122,0.12);
  color: var(--pe-muted);
}
.quota-badge.is-loading { opacity: 0.65; }
@media (prefers-color-scheme: dark) {
  .quota-badge { background: rgba(52,211,153,0.18); color: #6ee7b7; }
  .quota-badge.is-low { background: rgba(251,191,36,0.18); color: #fcd34d; }
}
.quota-badge.hidden { display: none; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dot.loading { background: #f59e0b; animation: pulse 1.2s infinite; }
.dot.success { background: var(--pe-success); }
.dot.error { background: var(--pe-danger); }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

.icon-btn {
  background: transparent; border: none; padding: 4px;
  border-radius: 6px; color: inherit; opacity: 0.6;
  display: inline-flex; align-items: center; justify-content: center;
  /* header 整条 cursor:move，按钮单独恢复成手型，不让人误以为按钮也是拖拽区。 */
  cursor: pointer;
}
.icon-btn:hover { opacity: 1; background: rgba(0,0,0,0.05); }
@media (prefers-color-scheme: dark) {
  .icon-btn:hover { background: rgba(255,255,255,0.08); }
}
`;
