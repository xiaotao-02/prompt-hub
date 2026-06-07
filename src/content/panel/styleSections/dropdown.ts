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
  opacity: 0.45;
}
.sd-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-surface);
  color: var(--pe-text-muted);
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  transition: background var(--pe-duration-fast) var(--pe-ease-standard),
    border-color var(--pe-duration-fast) var(--pe-ease-standard),
    box-shadow var(--pe-duration-fast) var(--pe-ease-standard),
    color var(--pe-duration-fast) var(--pe-ease-standard);
  max-width: 160px;
  white-space: nowrap;
}
.sd-label {
  flex: 1 1 0;
  min-width: 2.5em;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sd-arrow {
  flex: none;
  width: 10px;
  height: 6px;
  opacity: 0.65;
  transition: transform var(--pe-duration-base) var(--pe-ease-standard),
    opacity var(--pe-duration-fast) var(--pe-ease-standard);
}
.strategy-dropdown.open .sd-arrow,
.model-dropdown.open .sd-arrow {
  transform: rotate(180deg);
  opacity: 0.85;
}
.sd-trigger:hover:not(:disabled) {
  background: var(--pe-bg-muted);
  border-color: color-mix(in srgb, var(--pe-accent) 30%, var(--pe-border-strong));
  color: var(--pe-text);
}
.strategy-dropdown.open .sd-trigger:not(:disabled),
.model-dropdown.open .model-badge-trigger:not(:disabled) {
  background: var(--pe-accent-soft);
  border-color: color-mix(in srgb, var(--pe-accent) 35%, var(--pe-border-strong));
  color: var(--pe-accent);
}
.sd-trigger:focus-visible {
  border-color: var(--pe-accent);
  box-shadow: 0 0 0 3px var(--pe-focus);
  color: var(--pe-text);
}
.sd-menu {
  display: block;
  position: absolute;
  top: auto;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 140px;
  max-width: 220px;
  list-style: none;
  margin: 0;
  padding: 4px;
  background: var(--pe-bg);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--pe-border);
  border-radius: var(--pe-radius-lg);
  box-shadow: var(--pe-shadow);
  z-index: 20;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(4px);
  transition: opacity var(--pe-duration-fast) var(--pe-ease-standard),
    transform var(--pe-duration-fast) var(--pe-ease-standard),
    visibility 0s linear var(--pe-duration-fast);
}
.strategy-dropdown.open .sd-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition: opacity var(--pe-duration-fast) var(--pe-ease-standard),
    transform var(--pe-duration-fast) var(--pe-ease-standard),
    visibility 0s;
}
/* header 模型下拉：菜单向下展开，避免被顶部裁切 */
.model-dropdown {
  position: relative;
  display: inline-flex;
  max-width: 220px;
  flex: none;
  z-index: 30;
}
.model-dropdown.is-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  min-width: 5.5rem;
}
.model-dropdown .model-badge-trigger {
  max-width: 220px;
  background: color-mix(in srgb, var(--pe-info) 10%, var(--pe-surface));
  color: var(--pe-info);
  border-color: color-mix(in srgb, var(--pe-info) 22%, var(--pe-border-strong));
}
.model-dropdown .model-badge-trigger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--pe-info) 14%, var(--pe-bg-muted));
  border-color: color-mix(in srgb, var(--pe-info) 32%, var(--pe-border-strong));
  color: var(--pe-info);
}
.model-dropdown .model-badge-trigger .model-badge {
  border: none;
  background: transparent;
  padding: 0;
  min-width: 0;
  max-width: none;
}
.model-dropdown.open .model-dropdown-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  top: calc(100% + 6px);
  bottom: auto;
  min-width: 180px;
  max-width: 280px;
  max-height: min(240px, 40vh);
  overflow-y: auto;
  z-index: 40;
  transition: opacity var(--pe-duration-fast) var(--pe-ease-standard),
    transform var(--pe-duration-fast) var(--pe-ease-standard),
    visibility 0s;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--pe-text-subtle) 55%, transparent)
    color-mix(in srgb, var(--pe-bg-muted) 85%, transparent);
}
.model-dropdown.open .model-dropdown-menu::-webkit-scrollbar {
  width: 6px;
}
.model-dropdown.open .model-dropdown-menu::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
.model-dropdown.open .model-dropdown-menu::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--pe-bg-muted) 85%, transparent);
  border-radius: 999px;
}
.model-dropdown.open .model-dropdown-menu::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--pe-text-subtle) 55%, transparent);
  border-radius: 999px;
}
.model-dropdown.open .model-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--pe-accent) 45%, var(--pe-text-subtle));
}
.model-dropdown-menu .sd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.model-dropdown-menu .sd-item-label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}
.model-dropdown-menu .sd-vision-tag {
  flex: none;
  font-size: 9px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--pe-success) 16%, transparent);
  color: var(--pe-success);
}
.model-dropdown-menu .sd-item-muted {
  cursor: default;
  color: var(--pe-text-muted);
  font-size: 11px;
  white-space: normal;
  line-height: 1.35;
}
.model-dropdown-menu .sd-item-muted:hover {
  background: transparent;
  color: var(--pe-text-muted);
}
.model-dropdown-menu .sd-item-action {
  color: var(--pe-accent);
  font-weight: 500;
}
.sd-item {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 400;
  font-family: inherit;
  color: var(--pe-text);
  border-radius: 6px;
  cursor: pointer;
  transition: background var(--pe-duration-fast) var(--pe-ease-standard),
    color var(--pe-duration-fast) var(--pe-ease-standard);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sd-item:hover {
  background: var(--pe-accent-soft);
  color: var(--pe-accent);
}
.sd-item.active {
  background: var(--pe-accent-soft);
  color: var(--pe-accent);
  font-weight: 600;
}
.one-click-refine-control-group .sd-trigger {
  background: transparent;
  color: var(--pe-text-muted);
  border-color: var(--pe-border-strong);
}
.one-click-refine-control-group .sd-trigger:hover:not(:disabled) {
  background: var(--pe-bg-muted);
  color: var(--pe-text);
}
.one-click-refine-control-group .strategy-dropdown.open .sd-trigger:not(:disabled) {
  background: var(--pe-bg-muted);
  color: var(--pe-text);
  border-color: var(--pe-border-strong);
}
@media (prefers-reduced-motion: reduce) {
  .sd-menu,
  .model-dropdown-menu {
    transition: none !important;
    transform: none !important;
  }
  .strategy-dropdown.open .sd-menu,
  .model-dropdown.open .model-dropdown-menu {
    transform: none !important;
  }
}
@media (prefers-color-scheme: dark) {
  .sd-menu {
    background: var(--pe-bg);
    border-color: var(--pe-border);
  }
  .sd-item {
    color: var(--pe-text-muted);
  }
  .sd-item:hover,
  .sd-item.active {
    color: var(--pe-accent);
  }
  .model-dropdown .model-badge-trigger {
    background: color-mix(in srgb, var(--pe-info) 14%, var(--pe-surface));
    border-color: color-mix(in srgb, var(--pe-info) 28%, var(--pe-border-strong));
  }
  .model-dropdown .model-badge-trigger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--pe-info) 20%, var(--pe-bg-muted));
  }
}
`;
