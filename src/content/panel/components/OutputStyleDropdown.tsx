import { useCallback, useState, type MouseEvent } from 'react';
import { safeSendMessage, isExtensionContextValid } from '@/content/extensionBridge';
import { OUTPUT_STYLE_ORDER } from '@/lib/strategies-meta';
import type { OutputStyle, RuntimeMessage } from '@/lib/types';
import { commitPanelEvent } from '../dispatchPanel';
import { outputStyleDisplayLabel, resolveOutputStyleDisplayId } from '../outputStyleDisplay';
import { currentState, panelActions } from '../state';
import { patchVersionList } from '../versionListUi';
import { PanelSelectDropdown } from './PanelSelectDropdown';

export type OutputStyleDropdownProps = {
  currentStyle: OutputStyle | undefined;
  disabled?: boolean;
  onOutputStyleChange?: (style: OutputStyle) => void;
};

export function OutputStyleDropdown({
  currentStyle,
  disabled,
  onOutputStyleChange,
}: OutputStyleDropdownProps) {
  const [open, setOpen] = useState(false);
  const displayId = resolveOutputStyleDisplayId(currentStyle);

  const handleSelect = useCallback(
    (newStyle: OutputStyle) => {
      if (disabled || !newStyle || newStyle === currentStyle) return;
      const st = currentState;
      if (!st) return;
      const prevStatus = st.status;
      if ((prevStatus !== 'success' && prevStatus !== 'compose') || !isExtensionContextValid()) {
        return;
      }
      const next = commitPanelEvent({ type: 'ui.outputStyle', outputStyle: newStyle });
      onOutputStyleChange?.(newStyle);
      safeSendMessage(
        {
          type: 'SET_OUTPUT_STYLE',
          payload: { style: newStyle },
        } satisfies RuntimeMessage,
        () => void chrome.runtime.lastError,
      );
      if (next) {
        if (prevStatus === 'success') patchVersionList();
        else panelActions.renderPanel(next);
      }
      setOpen(false);
    },
    [currentStyle, disabled, onOutputStyleChange],
  );

  const handleItemClick = (e: MouseEvent<HTMLLIElement>, id: OutputStyle) => {
    e.stopPropagation();
    handleSelect(id);
  };

  return (
    <PanelSelectDropdown
      dataRole="output-style-dropdown"
      wrapperClassName="output-style-dropdown"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      title="切换后可直接点「让 AI 调整」生效（将按新格式改写）"
      triggerLabel={outputStyleDisplayLabel(currentStyle)}
    >
      {OUTPUT_STYLE_ORDER.map((id) => (
        <li
          key={id}
          className={`sd-item${id === displayId ? ' active' : ''}`}
          data-output-style={id}
          onClick={(e) => handleItemClick(e, id)}
        >
          {outputStyleDisplayLabel(id)}
        </li>
      ))}
    </PanelSelectDropdown>
  );
}
