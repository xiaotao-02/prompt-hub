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
  background: linear-gradient(90deg,#6366f1,#8b5cf6);
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
@media (prefers-color-scheme: dark) {
  .hint-row .elapsed { color: #c4b5fd; }
}

.stream-preview {
  display: flex;
  flex-direction: column;
  animation: fadeIn .2s ease-out;
}
.stream-preview.hidden { display: none; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.prompt-text.streaming {
  min-height: 220px; max-height: 460px;
  background: linear-gradient(180deg, rgba(99,102,241,0.04), rgba(139,92,246,0.03));
  border-color: rgba(99,102,241,0.25);
  cursor: default;
}
@media (prefers-color-scheme: dark) {
  .prompt-text.streaming {
    background: linear-gradient(180deg, rgba(139,92,246,0.08), rgba(99,102,241,0.04));
    border-color: rgba(139,92,246,0.30);
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .panel.library-closing,
  .panel.sidebar-transition,
  .refine-slot,
  .versions-side,
  .refine-box,
  .stream-preview,
  .bar.progress span,
  .bar.progress span::after,
  .spinner,
  .dot.loading {
    animation: none !important;
    transition: none !important;
  }
}
`;
