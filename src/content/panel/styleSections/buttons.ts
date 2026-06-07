/** Panel CSS section: buttons */
export const buttonsCss = `
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
  min-width: 0;
}
.actions-cluster {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  min-width: 0;
}
.actions-cluster-secondary {
  flex: 1 1 auto;
  justify-content: flex-start;
  min-width: 0;
}
.actions-cluster-primary {
  flex: 0 0 auto;
  justify-content: flex-end;
}
.actions-save-btn {
  animation: actionsSaveIn .18s ease-out;
}
@keyframes actionsSaveIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .actions-save-btn { animation: none; }
}

.one-click-refine-control-group {
  display: inline-flex;
  align-items: stretch;
  flex-shrink: 0;
}
.one-click-refine-control-group > .strategy-dropdown {
  align-self: stretch;
  position: relative;
  z-index: 0;
}
.one-click-refine-control-group > .strategy-dropdown:focus-within {
  z-index: 1;
}
.one-click-refine-control-group > .strategy-dropdown .sd-trigger {
  box-sizing: border-box;
  min-height: 34px;
  border-radius: 8px 0 0 8px;
  border-right: none;
  padding-top: 6px;
  padding-bottom: 6px;
}
.one-click-refine-control-group .one-click-refine-btn {
  border-radius: 0 8px 8px 0;
  margin-left: -1px;
  position: relative;
  z-index: 0;
  min-height: 34px;
}
.one-click-refine-control-group .one-click-refine-btn:focus-visible {
  z-index: 1;
}
.one-click-refine-btn {
  border-radius: 8px;
  min-height: 34px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 12px;
  border-radius: var(--pe-radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform var(--pe-duration-fast) var(--pe-ease-standard),
    background var(--pe-duration-fast) var(--pe-ease-standard),
    opacity var(--pe-duration-fast) var(--pe-ease-standard),
    border-color var(--pe-duration-fast) var(--pe-ease-standard),
    color var(--pe-duration-fast) var(--pe-ease-standard);
  font-family: inherit;
  color: inherit;
  flex-shrink: 0;
  white-space: nowrap;
}
.btn:active { transform: scale(0.97); }
.btn.primary {
  background: var(--pe-accent);
  color: #fff;
  border-color: transparent;
}
.btn.primary:hover:not(:disabled):not(.disabled) { background: var(--pe-accent-hover); }
.btn.ghost {
  background: transparent;
  color: var(--pe-text-muted);
  border-color: var(--pe-border-strong);
}
.btn.ghost:hover:not(:disabled):not(.disabled) {
  background: var(--pe-bg-muted);
  color: var(--pe-text);
}
.btn.disabled, .btn[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn.disabled:hover, .btn[disabled]:hover {
  filter: none;
  background: transparent;
}
.btn.primary.disabled:hover, .btn.primary[disabled]:hover {
  background: var(--pe-accent);
}
@media (prefers-color-scheme: dark) {
  .btn.ghost {
    border-color: var(--pe-border-strong);
    color: var(--pe-text-muted);
  }
  .btn.ghost:hover:not(:disabled):not(.disabled) {
    background: rgba(255,255,255,0.06);
    color: var(--pe-text);
  }
}
.btn.copied {
  background: var(--pe-success) !important;
  color: #fff !important;
  border-color: transparent !important;
  transition: background var(--pe-duration-fast) var(--pe-ease-standard),
    color var(--pe-duration-fast) var(--pe-ease-standard),
    border-color var(--pe-duration-fast) var(--pe-ease-standard),
    transform var(--pe-duration-fast) var(--pe-ease-standard);
}
.btn.secondary {
  background: var(--pe-surface);
  color: var(--pe-accent);
  border-color: var(--pe-border-strong);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.btn.secondary:hover:not(:disabled) {
  background: var(--pe-bg-muted);
  border-color: color-mix(in srgb, var(--pe-accent) 35%, var(--pe-border-strong));
}
@media (prefers-color-scheme: dark) {
  .btn.secondary {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  }
}
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--pe-focus);
}
.btn.sm {
  min-height: 32px;
  padding: 5px 10px;
  font-size: 12px;
}

.panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}
.panel-icon svg {
  display: block;
}
`;
