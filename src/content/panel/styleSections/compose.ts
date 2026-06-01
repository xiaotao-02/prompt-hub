/** Panel CSS section: compose */
export const composeCss = `
.compose-body {
  gap: 10px;
}
.compose-mode-tabs {
  display: flex;
  width: 100%;
  gap: 2px;
  padding: 2px;
  border-radius: var(--pe-radius-lg);
  background: var(--pe-bg-muted);
}
.compose-mode-tab {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: none;
  border-radius: calc(var(--pe-radius-lg) - 2px);
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  background: transparent;
  color: var(--pe-text-subtle);
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.compose-mode-tab:hover {
  color: var(--pe-text);
}
.compose-mode-tab[aria-selected="true"] {
  background: var(--pe-surface);
  color: var(--pe-accent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.compose-ref-count {
  margin: -2px 0 0;
  font-size: 11px;
  color: var(--pe-text-subtle);
  line-height: 1.35;
}
.compose-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.compose-pane[hidden] {
  display: none !important;
}
.compose-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.compose-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.ref-url-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  font: inherit;
  font-size: 12px;
  background: var(--pe-surface);
  color: inherit;
}
.compose-hint {
  margin: 0;
  font-size: 11px;
  color: var(--pe-text-subtle);
  line-height: 1.45;
}
.compose-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.compose-actions {
  margin-top: 4px;
  gap: 8px;
}
.ref-file-input-hidden {
  display: none;
}
.compose-video-segment {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--pe-radius-lg);
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-bg-muted);
}
.compose-video-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.compose-video-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.compose-video-segment-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--pe-text-subtle);
  flex: 0 0 auto;
}
.compose-video-seg-tilde {
  font-size: 12px;
  opacity: 0.55;
  user-select: none;
}
.compose-video-time-input {
  width: 5.5rem;
  padding: 6px 8px;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  font: inherit;
  font-size: 12px;
  background: var(--pe-surface);
  color: inherit;
}
.strategy-dropdown.compose-video-dropdown {
  flex: 1 1 100%;
  min-width: 0;
  max-width: 100%;
  display: flex;
}
.strategy-dropdown.compose-video-dropdown .sd-trigger {
  flex: 1 1 auto;
  min-width: 0;
  max-width: none;
  width: 100%;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 400;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-surface);
  color: inherit;
}
.strategy-dropdown.compose-video-dropdown .sd-menu {
  top: calc(100% + 6px);
  bottom: auto;
  left: 0;
  right: 0;
  min-width: 0;
  max-width: none;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
}
.strategy-dropdown.compose-video-dropdown .sd-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
}
.strategy-dropdown.compose-video-dropdown .sd-item-title {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.strategy-dropdown.compose-video-dropdown .sd-item-meta {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.65;
  line-height: 1.3;
}
.strategy-dropdown.compose-video-dropdown.is-disabled {
  opacity: 0.55;
}
@media (prefers-color-scheme: dark) {
  .compose-mode-tabs {
    background: rgba(255, 255, 255, 0.06);
  }
  .compose-mode-tab {
    color: rgba(255, 255, 255, 0.55);
  }
  .compose-mode-tab:hover {
    color: rgba(255, 255, 255, 0.85);
  }
  .compose-mode-tab[aria-selected="true"] {
    background: rgba(255, 255, 255, 0.1);
    color: var(--pe-accent);
    box-shadow: none;
  }
  .compose-ref-count {
    color: rgba(255, 255, 255, 0.5);
  }
  .compose-video-segment {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.04);
  }
  .compose-video-segment-label {
    color: rgba(255, 255, 255, 0.55);
  }
  .compose-video-time-input,
  .strategy-dropdown.compose-video-dropdown .sd-trigger {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }
  .strategy-dropdown.compose-video-dropdown .sd-item-meta {
    opacity: 0.55;
  }
}
.btn.sm {
  padding: 6px 10px;
  font-size: 12px;
}
@media (prefers-color-scheme: dark) {
  .compose-hint { color: rgba(255,255,255,0.5); }
  .ref-url-input {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
  }
}
`;
