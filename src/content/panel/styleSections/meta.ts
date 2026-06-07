/** Panel CSS section: meta */
export const metaCss = `
.error-msg {
  padding: 10px 12px; border-radius: var(--pe-radius);
  background: color-mix(in srgb, var(--pe-danger) 10%, transparent);
  color: var(--pe-danger);
  font-size: 12px; line-height: 1.5; word-break: break-word;
}
@media (prefers-color-scheme: dark) {
  .error-msg { color: var(--pe-danger); }
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  gap: 8px;
  min-width: 0;
}
.meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
  flex: 1 1 auto;
}
.meta-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  min-width: 0;
}
.meta-group-settings {
  gap: 4px;
}
.meta-group-settings .strategy-dropdown {
  flex-shrink: 0;
}
.meta-divider {
  flex: none;
  width: 1px;
  height: 18px;
  background: var(--pe-border-strong);
  opacity: 0.85;
}
.meta-row .link-btn {
  min-height: 28px;
  padding: 4px 8px;
  box-sizing: border-box;
}
.meta-row .strategy-dropdown .sd-trigger {
  min-height: 28px;
  padding: 4px 8px;
  box-sizing: border-box;
}
.dirty-hint {
  flex: none;
  opacity: 0;
  transition: opacity .15s;
  color: var(--pe-warning);
  font-weight: 500;
  white-space: nowrap;
}
.dirty-hint.show { opacity: 1; }
@media (prefers-color-scheme: dark) {
  .dirty-hint { color: var(--pe-warning); }
}
`;
