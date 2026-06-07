/** Panel CSS section: compose */
export const composeCss = `
:host {
  --compose-letterbox-bg: #18181b;
}
@media (prefers-color-scheme: light) {
  :host {
    --compose-letterbox-bg: #e4e4e7;
  }
}

.compose-body {
  gap: 12px;
}

/* --- Header mode tabs --- */
.compose-header-tabs {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  flex: 0 1 auto;
  min-width: 0;
  gap: 2px;
  padding: 2px;
  border-radius: var(--pe-radius-lg);
  background: var(--pe-bg-muted);
  cursor: default;
}
.compose-header-tabs .compose-mode-tab {
  flex: 0 0 auto;
  padding: 4px 8px;
}
.compose-mode-tab {
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

/* --- Shared section / card chrome --- */
.compose-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.compose-section-head,
.compose-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.compose-section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--pe-text-muted);
  line-height: 1.35;
  letter-spacing: 0.01em;
}
.compose-output-title {
  margin: 0;
}
.compose-count-pill,
.compose-seg-readout-pill {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  color: var(--pe-text-subtle);
  background: var(--pe-bg-muted);
  border: 1px solid var(--pe-border);
  white-space: nowrap;
}
.compose-seg-readout-pill {
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.compose-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--pe-radius-lg);
  border: 1px solid var(--pe-border);
  background: color-mix(in srgb, var(--pe-surface) 88%, transparent);
  overflow: hidden;
  min-width: 0;
}
.compose-card-head {
  padding: 8px 10px;
  border-bottom: 1px solid var(--pe-border);
  background: color-mix(in srgb, var(--pe-bg-muted) 55%, transparent);
}
.compose-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  min-width: 0;
}
.compose-card-foot {
  padding: 8px 10px;
  border-top: 1px solid var(--pe-border);
  background: color-mix(in srgb, var(--pe-bg-muted) 40%, transparent);
}

/* --- Image mode: collect card --- */
.compose-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.compose-pane[hidden] {
  display: none !important;
}
.compose-collect-card .compose-card-body {
  gap: 0;
}
.compose-collect-card .ref-strip {
  justify-content: flex-start;
  gap: 8px;
}
.compose-collect-card .ref-strip:not(:empty) + .compose-dropzone,
.compose-collect-card .compose-dropzone + .ref-strip:not(:empty) {
  margin-top: 8px;
}
.compose-collect-card .ref-item {
  width: 100px;
  height: 100px;
}
.compose-collect-card .ref-strip-empty {
  display: none;
}
.compose-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 108px;
  padding: 14px 12px;
  border-radius: var(--pe-radius);
  border: 1px dashed var(--pe-border-strong);
  background: var(--pe-bg-muted);
  text-align: center;
}
.compose-dropzone-icon {
  display: inline-flex;
  color: var(--pe-text-subtle);
  opacity: 0.75;
}
.compose-dropzone-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--pe-text-muted);
  line-height: 1.35;
}
.compose-dropzone-hint {
  font-size: 10px;
  color: var(--pe-text-subtle);
  line-height: 1.45;
  max-width: 240px;
}
.compose-collect-card:has(.ref-strip:not(.ref-strip-empty)) .compose-dropzone {
  display: none;
}
.compose-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.compose-toolbar-actions {
  display: flex;
  flex: 0 0 auto;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}
.ref-url-input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  font: inherit;
  font-size: 12px;
  background: var(--pe-surface);
  color: inherit;
}
.ref-url-input:focus-visible {
  outline: none;
  border-color: var(--pe-accent);
  box-shadow: 0 0 0 3px var(--pe-focus);
}
.compose-caption {
  margin: 0;
  font-size: 10px;
  color: var(--pe-text-subtle);
  line-height: 1.5;
  padding: 0 2px;
}
.ref-file-input-hidden {
  display: none;
}

/* --- Video refs strip (compact, scoped) --- */
.compose-refs-section .ref-strip-compact {
  padding: 8px 10px;
  border-radius: var(--pe-radius-lg);
  border: 1px solid var(--pe-border);
  background: color-mix(in srgb, var(--pe-surface) 88%, transparent);
}
.compose-refs-section .ref-strip-compact.ref-strip-empty {
  min-height: 56px;
}
.compose-refs-section .ref-item-compact {
  width: 52px;
  height: 52px;
  border-radius: calc(var(--pe-radius) - 2px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* --- Output settings --- */
.compose-output-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: center;
  min-width: 0;
}
.compose-output-row .strategy-dropdown,
.compose-output-row .output-style-dropdown {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  width: 100%;
  display: flex;
}
.compose-output-row .strategy-dropdown .sd-trigger,
.compose-output-row .output-style-dropdown .sd-trigger {
  min-height: 32px;
  padding: 6px 10px;
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-surface);
}

/* --- Actions --- */
.compose-actions {
  margin-top: 2px;
  padding-top: 4px;
  border-top: 1px solid var(--pe-border);
}
.compose-actions .btn.primary.compose-primary-cta:not(:disabled):not(.disabled) {
  box-shadow: 0 2px 8px color-mix(in srgb, var(--pe-accent) 35%, transparent);
}

/* --- Video studio --- */
.compose-video-studio {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.compose-video-source .strategy-dropdown.compose-video-dropdown {
  width: 100%;
}
.compose-preview-card {
  padding: 0;
  gap: 0;
}
.compose-preview-frame {
  padding: 8px 8px 0;
  background: var(--compose-letterbox-bg);
  border-radius: var(--pe-radius-lg) var(--pe-radius-lg) 0 0;
}
.compose-video-preview-player {
  display: block;
  width: 100%;
  max-height: 200px;
  border-radius: var(--pe-radius);
  border: none;
  background: var(--compose-letterbox-bg);
  object-fit: contain;
}
.compose-video-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 10px;
}
.compose-video-play-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--pe-border-strong);
  border-radius: var(--pe-radius);
  background: var(--pe-bg-muted);
  color: var(--pe-text);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}
.compose-video-play-btn:hover {
  background: var(--pe-surface);
  border-color: color-mix(in srgb, var(--pe-accent) 30%, var(--pe-border-strong));
}
.compose-scrubber {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
}
.compose-scrubber-track {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: color-mix(in srgb, var(--pe-border-strong) 65%, transparent);
  pointer-events: none;
}
.compose-scrubber-region {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: inherit;
  background: color-mix(in srgb, var(--pe-accent) 55%, var(--pe-text-muted));
  pointer-events: none;
}
.compose-scrubber-playhead {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: var(--pe-text);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--pe-bg) 40%, transparent);
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 1;
}
.compose-scrubber-time {
  flex: 0 0 auto;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--pe-text-subtle);
  white-space: nowrap;
}
.compose-video-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  margin: 10px;
  padding: 12px;
  border-radius: var(--pe-radius);
  border: 1px dashed var(--pe-border-strong);
  background: var(--pe-bg-muted);
  font-size: 11px;
  color: var(--pe-text-subtle);
  text-align: center;
  line-height: 1.45;
}

/* --- Region / filmstrip card --- */
.compose-region-card .compose-card-body {
  gap: 10px;
}
.compose-region-body {
  padding-top: 8px;
}
.compose-filmstrip {
  position: relative;
  height: 56px;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-bg-muted);
  overflow: hidden;
  cursor: pointer;
  touch-action: none;
  user-select: none;
}
.compose-filmstrip.is-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--pe-accent) 18%, transparent),
    transparent
  );
  animation: compose-filmstrip-shimmer 1.2s infinite;
  pointer-events: none;
}
.compose-filmstrip.is-fallback .compose-filmstrip-track {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--pe-bg-muted),
    color-mix(in srgb, var(--pe-accent-soft) 80%, var(--pe-surface)),
    var(--pe-bg-muted)
  );
}
.compose-filmstrip.is-failed::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  background: repeating-linear-gradient(
    -12deg,
    transparent,
    transparent 6px,
    color-mix(in srgb, var(--pe-border) 55%, transparent) 6px,
    color-mix(in srgb, var(--pe-border) 55%, transparent) 7px
  );
  opacity: 0.35;
  pointer-events: none;
}
@keyframes compose-filmstrip-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.compose-filmstrip-track {
  display: flex;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.compose-filmstrip-thumb {
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  object-fit: cover;
  display: block;
}
.compose-filmstrip-status {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 500;
  color: var(--pe-text-subtle);
  text-align: center;
  pointer-events: none;
}
.compose-filmstrip-status-failed {
  color: var(--pe-text-muted);
}
.compose-seg-mask {
  position: absolute;
  top: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--pe-bg) 72%, transparent);
  pointer-events: none;
  z-index: 1;
}
.compose-seg-mask-left {
  left: 0;
}
.compose-seg-mask-right {
  right: 0;
}
.compose-seg-selection {
  position: absolute;
  top: 0;
  bottom: 0;
  border-top: 2px solid var(--pe-accent);
  border-bottom: 2px solid var(--pe-accent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pe-accent) 35%, transparent);
  pointer-events: none;
  z-index: 2;
}
.compose-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--pe-text);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--pe-bg) 40%, transparent);
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 3;
}
.compose-seg-handle {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: var(--pe-accent);
  box-shadow: 0 1px 6px color-mix(in srgb, var(--pe-accent) 45%, transparent);
  transform: translate(-50%, -50%);
  cursor: ew-resize;
  z-index: 4;
  transition: transform 0.08s ease;
}
.compose-seg-handle:active {
  transform: translate(-50%, -50%) scaleY(1.04);
}
.compose-seg-handle::after {
  content: '';
  position: absolute;
  inset: 5px 2px;
  border-left: 1px solid rgba(255, 255, 255, 0.45);
  border-right: 1px solid rgba(255, 255, 255, 0.45);
}
.compose-seg-handle-start {
  border-top-right-radius: 2px;
  border-bottom-right-radius: 2px;
}
.compose-seg-handle-end {
  border-top-left-radius: 2px;
  border-bottom-left-radius: 2px;
}
.compose-seg-controls {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}
.compose-inout-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.compose-inout-row .btn {
  flex: 0 0 auto;
}
.compose-seg-inputs {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}
.compose-inout-actions {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
}
.compose-video-seg-tilde {
  font-size: 12px;
  opacity: 0.55;
  user-select: none;
}
.compose-video-time-input {
  width: 5.25rem;
  padding: 6px 8px;
  border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  font: inherit;
  font-size: 12px;
  background: var(--pe-surface);
  color: inherit;
  cursor: ew-resize;
}
.compose-video-time-input:focus-visible {
  outline: none;
  border-color: var(--pe-accent);
  box-shadow: 0 0 0 3px var(--pe-focus);
}
.compose-video-time-input.is-scrubbing {
  touch-action: none;
  user-select: none;
}

/* Video picker dropdown (unchanged behavior, card context) */
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
  padding: 8px 10px;
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
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--pe-text-subtle) 55%, transparent)
    color-mix(in srgb, var(--pe-bg-muted) 85%, transparent);
}
.strategy-dropdown.compose-video-dropdown .sd-menu::-webkit-scrollbar {
  width: 6px;
}
.strategy-dropdown.compose-video-dropdown .sd-menu::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
.strategy-dropdown.compose-video-dropdown .sd-menu::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--pe-bg-muted) 85%, transparent);
  border-radius: 999px;
}
.strategy-dropdown.compose-video-dropdown .sd-menu::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--pe-text-subtle) 55%, transparent);
  border-radius: 999px;
}
.strategy-dropdown.compose-video-dropdown .sd-menu::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--pe-accent) 45%, var(--pe-text-subtle));
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
  :host {
    --compose-letterbox-bg: #09090b;
  }
  .compose-header-tabs {
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
  .compose-card {
    background: color-mix(in srgb, var(--pe-surface) 92%, transparent);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .compose-card-head,
  .compose-card-foot {
    border-color: rgba(255, 255, 255, 0.08);
  }
  .compose-count-pill,
  .compose-seg-readout-pill {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.55);
  }
  .compose-dropzone {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.04);
  }
  .compose-refs-section .ref-strip-compact {
    border-color: rgba(255, 255, 255, 0.1);
    background: color-mix(in srgb, var(--pe-surface) 92%, transparent);
  }
  .compose-refs-section .ref-item-compact {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  }
  .compose-actions {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
  .compose-video-play-btn {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.85);
  }
  .compose-video-play-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .compose-scrubber-region {
    background: color-mix(in srgb, var(--pe-accent) 65%, rgba(255, 255, 255, 0.5));
  }
  .compose-video-preview-empty {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.5);
  }
  .compose-filmstrip {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.04);
  }
  .compose-filmstrip.is-fallback .compose-filmstrip-track {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.04),
      color-mix(in srgb, var(--pe-accent-soft) 90%, rgba(255, 255, 255, 0.06)),
      rgba(255, 255, 255, 0.04)
    );
  }
  .compose-filmstrip-status {
    color: rgba(255, 255, 255, 0.5);
  }
  .compose-filmstrip-status-failed {
    color: rgba(255, 255, 255, 0.65);
  }
  .compose-video-time-input,
  .compose-output-row .strategy-dropdown .sd-trigger,
  .compose-output-row .output-style-dropdown .sd-trigger,
  .strategy-dropdown.compose-video-dropdown .sd-trigger,
  .ref-url-input {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }
  .strategy-dropdown.compose-video-dropdown .sd-item-meta {
    opacity: 0.55;
  }
  .compose-caption {
    color: rgba(255, 255, 255, 0.45);
  }
}
.btn.sm {
  padding: 6px 10px;
  font-size: 12px;
}
`;
