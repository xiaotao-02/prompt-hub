/** Panel CSS section: dropdown */
export const dropdownCss = `
.strategy-dropdown {
  position: relative;
  display: inline-flex;
  max-width: 160px;
}
.one-click-refine-randomness-dropdown {
  max-width: 92px;
}
.one-click-refine-randomness-dropdown.is-disabled {
  opacity: 0.45;
}
.sd-trigger:disabled {
  cursor: not-allowed;
}
.sd-trigger {
  display: inline-flex; align-items: center; gap: 4px;
  border: 1px solid color-mix(in srgb, var(--pe-accent) 28%, transparent);
  background: var(--pe-accent-soft);
  color: var(--pe-accent);
  font-size: 11px; font-weight: 500; font-family: inherit;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer; outline: none;
  transition: background .12s, border-color .15s, box-shadow .15s;
  max-width: 160px;
  white-space: nowrap;
}
.sd-label {
  flex: 1 1 0;
  min-width: 2.5em;
  overflow: hidden; text-overflow: ellipsis;
}
.sd-arrow {
  flex: none;
  width: 10px; height: 6px;
  transition: transform .18s ease;
}
.strategy-dropdown.open .sd-arrow { transform: rotate(180deg); }
.sd-trigger:hover:not(:disabled) {
  background: rgba(99,102,241,0.12);
  border-color: rgba(99,102,241,0.4);
}
.sd-trigger:focus-visible {
  border-color: var(--pe-accent);
  box-shadow: 0 0 0 3px var(--pe-focus);
}
.sd-menu {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 140px;
  max-width: 220px;
  list-style: none;
  margin: 0; padding: 4px;
  background: var(--pe-bg);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--pe-border);
  border-radius: var(--pe-radius-lg);
  box-shadow: 0 8px 24px -4px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
  z-index: 20;
  animation: sdIn .14s ease-out;
}
.strategy-dropdown.open .sd-menu { display: block; }
@keyframes sdIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.sd-item {
  padding: 6px 10px;
  font-size: 12px; font-weight: 400; font-family: inherit;
  color: #1f2937;
  border-radius: 6px;
  cursor: pointer;
  transition: background .1s, color .1s;
  white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.sd-item:hover {
  background: rgba(99,102,241,0.08);
  color: var(--pe-accent);
}
.sd-item.active {
  background: rgba(99,102,241,0.12);
  color: var(--pe-accent);
  font-weight: 600;
}
@media (prefers-color-scheme: dark) {
  .sd-trigger {
    background: rgba(139,92,246,0.12);
    border-color: rgba(139,92,246,0.35);
    color: #c4b5fd;
  }
  .sd-trigger:hover:not(:disabled) {
    background: rgba(139,92,246,0.20);
    border-color: rgba(139,92,246,0.5);
  }
  .sd-trigger:focus-visible {
    border-color: rgba(139,92,246,0.6);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.2);
  }
  .sd-menu {
    background: rgba(30,30,34,0.98);
    border-color: rgba(255,255,255,0.10);
    box-shadow: 0 8px 28px -4px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.3);
  }
  .sd-item { color: #d1d5db; }
  .sd-item:hover {
    background: rgba(139,92,246,0.16);
    color: #e0d4fc;
  }
  .sd-item.active {
    background: rgba(139,92,246,0.22);
    color: #e0d4fc;
  }
}
`;
