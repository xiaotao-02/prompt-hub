/** Panel CSS section: editor */
export const editorCss = `
.prompt-editor-wrap {
  position: relative;
  width: 100%;
  flex: none;
  min-width: 0;
}
.editor-char-count {
  position: absolute;
  right: 12px;
  bottom: 10px;
  font-size: 11px;
  line-height: 1;
  color: rgba(0,0,0,0.45);
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
}
@media (prefers-color-scheme: dark) {
  .editor-char-count { color: rgba(255,255,255,0.45); }
}

.prompt-text {
  width: 100%; min-height: 240px; max-height: 480px; resize: vertical;
  padding: 12px 14px; border-radius: var(--pe-radius);
  border: 1px solid var(--pe-border-strong);
  background: var(--pe-bg-muted);
  color: inherit; font-size: 13px; line-height: 1.6;
  font-family: inherit;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.prompt-editor-wrap .prompt-text {
  padding-bottom: 32px;
}
.prompt-text:focus {
  border-color: var(--pe-accent);
  box-shadow: 0 0 0 3px var(--pe-focus);
}
@media (prefers-color-scheme: dark) {
  .prompt-text { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
}
`;
