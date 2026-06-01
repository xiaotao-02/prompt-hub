import { useLayoutEffect, useRef, type FormEvent } from 'react';
import type { PanelState } from '../state';
import { commitPanelEvent } from '../dispatchPanel';
import { currentState } from '../state';
import { updateDirtyChrome } from '../dirtyChrome';

export type PromptEditorProps = {
  state: PanelState;
  displayedText: string;
  readonly?: boolean;
  placeholder?: string;
  onDraftChange?: (draft: string) => void;
};

function isEditorFocused(ta: HTMLTextAreaElement): boolean {
  const root = ta.getRootNode();
  if (root instanceof ShadowRoot || root instanceof Document) {
    return root.activeElement === ta;
  }
  return document.activeElement === ta;
}

export function PromptEditor({
  state,
  displayedText,
  readonly,
  placeholder,
  onDraftChange,
}: PromptEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const charCount = [...displayedText].length;
  const editorKey = state.sessionRequestId;

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta || isEditorFocused(ta)) return;
    if (ta.value !== displayedText) ta.value = displayedText;
  }, [displayedText]);

  const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
    if (readonly) return;
    const val = e.currentTarget.value;
    const st = currentState;
    if (!st) return;
    let nextSel = st.selectedVersionId;
    if (nextSel) {
      const v = st.versions?.find((x) => x.id === nextSel);
      if (!v || v.prompt !== val) nextSel = undefined;
    }
    commitPanelEvent({
      type: 'ui.setDraft',
      draft: val,
      selectedVersionId: nextSel ?? null,
    });
    onDraftChange?.(val);
    updateDirtyChrome();
  };

  return (
    <div className="prompt-editor-wrap">
      <textarea
        ref={taRef}
        key={editorKey}
        className={`prompt-text${readonly ? ' streaming' : ''}`}
        data-role="editor"
        defaultValue={displayedText}
        readOnly={readonly}
        spellCheck={false}
        placeholder={placeholder}
        onInput={handleInput}
      />
      <span className="editor-char-count" data-role="editor-char-count" aria-live="polite">
        {charCount} 字
      </span>
    </div>
  );
}
