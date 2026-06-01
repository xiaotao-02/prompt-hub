import { useCallback, useState, type MouseEvent } from 'react';
import { safeSendMessage } from '@/content/extensionBridge';
import {
  normalizeOneClickRefineRandomness,
  ONE_CLICK_REFINE_RANDOMNESS_LABELS,
} from '@/lib/oneClickRefine';
import type { OneClickRefineRandomness, RuntimeMessage } from '@/lib/types';
import { commitPanelEvent } from '../dispatchPanel';
import { currentState, panelHasActiveRefine } from '../state';

const RANDOMNESS_KEYS = [
  'subtle',
  'moderate',
  'bold',
] as const satisfies readonly OneClickRefineRandomness[];

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

  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled) return;
    setOpen((v) => !v);
  };

  return (
    <div
      className={`strategy-dropdown one-click-refine-randomness-dropdown${disabled ? ' is-disabled' : ''}${open ? ' open' : ''}`}
      data-role="one-click-refine-randomness-dropdown"
      aria-label="随机风格强度"
      title="随机风格强度"
    >
      <button className="sd-trigger" type="button" disabled={disabled} onClick={handleTriggerClick}>
        <span className="sd-label">{ONE_CLICK_REFINE_RANDOMNESS_LABELS[rr]}</span>
        <svg className="sd-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ul className="sd-menu">
        {RANDOMNESS_KEYS.map((id) => (
          <li
            key={id}
            className={`sd-item${id === rr ? ' active' : ''}`}
            data-randomness={id}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(id);
            }}
          >
            {ONE_CLICK_REFINE_RANDOMNESS_LABELS[id]}
          </li>
        ))}
      </ul>
    </div>
  );
}
