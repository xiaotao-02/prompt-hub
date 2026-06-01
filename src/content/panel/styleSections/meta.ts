/** Panel CSS section: meta */
export const metaCss = `
.error-msg {
  padding: 10px 12px; border-radius: var(--pe-radius);
  background: rgba(239,68,68,0.08); color: var(--pe-danger);
  font-size: 12px; line-height: 1.5; word-break: break-word;
}
@media (prefers-color-scheme: dark) { .error-msg { color: #fca5a5; } }

.meta-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px;
  gap: 6px;
}
.meta-left { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.meta-left .strategy-dropdown { flex-shrink: 0; }
.dirty-hint {
  opacity: 0; transition: opacity .15s;
  color: var(--pe-warning); font-weight: 500;
}
.dirty-hint.show { opacity: 1; }
@media (prefers-color-scheme: dark) {
  .dirty-hint { color: #fbbf24; }
}

/* refine-slot：常驻 DOM；grid 高度折叠，与历史侧栏共用弹性缓动 token。 */
`;
