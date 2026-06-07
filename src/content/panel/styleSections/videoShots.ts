/** Panel CSS section: video shot outline navigation */
export const videoShotsCss = `
.video-shot-outline {
  width: 100%;
  flex: none;
  min-width: 0;
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-bg-muted);
}
@media (prefers-color-scheme: dark) {
  .video-shot-outline {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
  }
}

.video-shot-outline-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  min-width: 0;
}

.video-shot-outline-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--pe-text-muted, rgba(0,0,0,0.55));
  flex: none;
}
@media (prefers-color-scheme: dark) {
  .video-shot-outline-label { color: rgba(255,255,255,0.55); }
}

.video-shot-outline-meta {
  font-size: 11px;
  color: rgba(0,0,0,0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (prefers-color-scheme: dark) {
  .video-shot-outline-meta { color: rgba(255,255,255,0.45); }
}

.video-shot-outline-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}
.video-shot-outline-chips::-webkit-scrollbar {
  height: 4px;
}
.video-shot-outline-chips::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 999px;
}
@media (prefers-color-scheme: dark) {
  .video-shot-outline-chips::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
  }
}

.video-shot-chip {
  flex: none;
  appearance: none;
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-bg, #fff);
  color: inherit;
  font-size: 11px;
  line-height: 1.2;
  padding: 5px 10px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color .15s, background .15s, box-shadow .15s;
}
.video-shot-chip:hover {
  border-color: var(--pe-accent);
}
.video-shot-chip.is-active {
  border-color: var(--pe-accent);
  background: var(--pe-focus, rgba(99,102,241,0.12));
  box-shadow: 0 0 0 2px var(--pe-focus);
}
@media (prefers-color-scheme: dark) {
  .video-shot-chip {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
  }
}
`;
