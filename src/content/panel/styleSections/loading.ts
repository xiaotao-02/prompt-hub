/** Panel CSS section: loading */
export const loadingCss = `
.loader-wrap { padding: 8px 0; }
.bar {
  position: relative; width: 100%; height: 6px; border-radius: 4px;
  overflow: hidden; background: var(--pe-bg-muted);
}
@media (prefers-color-scheme: dark) {
  .bar { background: rgba(255,255,255,0.08); }
}
/* 旧的"无方向滑块"：仅在没设 progress 时 fallback，目前不再使用。 */
.bar:not(.progress) span {
  position: absolute; left: -40%; top: 0; width: 40%; height: 100%;
  background: linear-gradient(90deg, var(--pe-accent), var(--pe-accent-hover));
  animation: slide 1.4s infinite;
}
@keyframes slide {
  0% { left: -40%; }
  100% { left: 100%; }
}
/* 阶段映射出的"确定性进度条"。宽度由 JS 控制，只用 transition 平滑。 */
.bar.progress { background: var(--pe-accent-soft); }
.bar.progress span {
  display: block; height: 100%;
  background: var(--pe-accent);
  width: 0%;
  transition: width .35s cubic-bezier(.4,.0,.2,1);
  position: relative;
}
/* 在确定性进度条上叠一层"流动光"，让用户知道还在持续工作中。 */
.bar.progress span::after {
  content: '';
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 40px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%);
  filter: blur(2px);
  animation: shimmer 1.6s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.25; transform: translateX(0); }
  50% { opacity: 0.85; transform: translateX(-6px); }
}

.hint { margin-top: 8px; font-size: 11px; opacity: 0.6; }
.hint-row {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.hint-row .elapsed {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
  font-weight: 500;
  color: var(--pe-accent);
}

.stream-preview {
  display: flex;
  flex-direction: column;
  animation: fadeIn var(--pe-duration-base) var(--pe-ease-standard);
}
.stream-preview.hidden { display: none; }
.panel-content-enter {
  animation: fadeIn var(--pe-duration-base) var(--pe-ease-standard);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.prompt-text.streaming {
  min-height: 220px; max-height: 460px;
  background: color-mix(in srgb, var(--pe-accent-soft) 55%, var(--pe-bg-muted));
  border-color: color-mix(in srgb, var(--pe-accent) 28%, var(--pe-border-strong));
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .panel.library-closing,
  .panel.sidebar-transition,
  .versions-side,
  .stream-preview,
  .panel-content-enter,
  .sd-menu,
  .version-item--rail[data-source="pending"]::after,
  .versions-side.versions-compact .version-item--rail[data-source="pending"]::after,
  .compose-filmstrip.is-loading::after,
  .bar.progress span,
  .bar.progress span::after,
  .spinner,
  .dot.loading {
    animation: none !important;
    transition: none !important;
  }
}
`;
