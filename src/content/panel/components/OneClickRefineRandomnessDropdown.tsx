import { useCallback, useState, type MouseEvent } from 'react';
import { safeSendMessage } from '@/content/extensionBridge';
import {
  normalizeOneClickRefineRandomness,
  ONE_CLICK_REFINE_RANDOMNESS_LABELS,
  ONE_CLICK_REFINE_RANDOMNESS_LEVELS,
} from '@/lib/oneClickRefine';
import type { OneClickRefineRandomness, RuntimeMessage } from '@/lib/types';
import { commitPanelEvent } from '../dispatchPanel';
import { currentState, panelHasActiveRefine } from '../state';
import { PanelSelectDropdown } from './PanelSelectDropdown';

export type OneClickRefineRandomnessDropdownProps = {
  level: OneClickRefineRandomness;
  disabled: boolean;
};

export function OneClickRefineRandomnessDropdown({
  level,
  disabled,
}: OneClickRefineRandomnessDropdownProps) {
  const [open, setOpen] = useState(false);
  const rr = normalizeOneClickRefineRandomness(level);

  const handleSelect = useCallback(
    (next: OneClickRefineRandomness) => {
      if (disabled || next === rr) return;
      const st = currentState;
      if (!st || st.status !== 'success' || panelHasActiveRefine(st)) return;
      commitPanelEvent({ type: 'ui.oneClickRefineRandomness', level: next });
      safeSendMessage(
        {
          type: 'SET_ONE_CLICK_REWRITE_RANDOMNESS',
          payload: { level: next },
        } satisfies RuntimeMessage,
        () => void chrome.runtime.lastError,
      );
      setOpen(false);
    },
    [disabled, rr],
  );

  const handleItemClick = (e: MouseEvent<HTMLLIElement>, id: OneClickRefineRandomness) => {
    e.stopPropagation();
    handleSelect(id);
  };

  return (
    <PanelSelectDropdown
      dataRole="one-click-refine-randomness-dropdown"
      wrapperClassName="one-click-refine-randomness-dropdown"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      aria-label="随机风格强度"
      title="随机风格强度"
      triggerLabel={ONE_CLICK_REFINE_RANDOMNESS_LABELS[rr]}
    >
      {ONE_CLICK_REFINE_RANDOMNESS_LEVELS.map((id) => (
        <li
          key={id}
          className={`sd-item${id === rr ? ' active' : ''}`}
          data-randomness={id}
          onClick={(e) => handleItemClick(e, id)}
        >
          {ONE_CLICK_REFINE_RANDOMNESS_LABELS[id]}
        </li>
      ))}
    </PanelSelectDropdown>
  );
}
