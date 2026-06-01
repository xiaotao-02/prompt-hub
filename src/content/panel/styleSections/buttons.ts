/** Panel CSS section: buttons */
export const buttonsCss = `
.actions { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; align-items: center; }

.one-click-refine-control-group {
  display: inline-flex;
  align-items: stretch;
}
.one-click-refine-control-group > .strategy-dropdown {
  align-self: stretch;
}
.one-click-refine-control-group > .strategy-dropdown .sd-trigger {
  box-sizing: border-box;
  min-height: 34px;
  border-radius: 8px 0 0 8px;
  border-right: none;
  padding-top: 6px;
  padding-bottom: 6px;
}
.one-click-refine-control-group > .strategy-dropdown {
  position: relative;
  z-index: 0;
}
.one-click-refine-control-group > .strategy-dropdown:focus-within {
  z-index: 1;
}
.one-click-refine-control-group .one-click-refine-btn {
  border-radius: 0 8px 8px 0;
  margin-left: -1px;
  position: relative;
  z-index: 0;
}
.one-click-refine-control-group .one-click-refine-btn:focus-visible {
  z-index: 1;
}
.one-click-refine-btn {
  border-radius: 8px;
}
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: var(--pe-radius);
  font-size: 12px; font-weight: 500;
  cursor: pointer; border: 1px solid transparent;
  transition: transform .08s, background .12s, opacity .12s;
  font-family: inherit;
  color: inherit;
}
.btn:active { transform: scale(0.97); }
.btn.primary {
  background: var(--pe-accent);
  color: #fff;
}
.btn.primary:hover { background: var(--pe-accent-hover); }
.btn.ghost {
  background: transparent;
  color: inherit;
  border-color: var(--pe-border-strong);
}
.btn.ghost:hover { background: rgba(0,0,0,0.05); }
.btn.disabled, .btn[disabled] {
  opacity: 0.45; cursor: not-allowed;
}
.btn.disabled:hover, .btn[disabled]:hover { filter: none; background: transparent; }
@media (prefers-color-scheme: dark) {
  .btn.ghost { border-color: rgba(255,255,255,0.12); }
  .btn.ghost:hover { background: rgba(255,255,255,0.06); }
}
.btn.copied {
  background: var(--pe-success) !important;
  color: #fff !important;
  border-color: transparent !important;
}
.btn.secondary {
  background: var(--pe-surface);
  color: inherit;
  border-color: var(--pe-border-strong);
  box-shadow: var(--pe-shadow, none);
}
.btn.secondary:hover { background: var(--pe-bg-muted); }
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--pe-focus);
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
