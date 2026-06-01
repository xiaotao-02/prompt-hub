import { useCallback, useState, type MouseEvent } from 'react';
import { safeSendMessage, isExtensionContextValid } from '@/content/extensionBridge';
import { STRATEGY_LABELS, type StrategyId } from '@/lib/strategies-meta';
import type { RuntimeMessage } from '@/lib/types';
import { commitPanelEvent } from '../dispatchPanel';
import { currentState } from '../state';
import { resolveStrategyDisplayId, strategyDisplayLabel } from '../strategyDisplay';
import { patchVersionList } from '../versionListUi';

export type StrategyDropdownProps = {
  currentStrategy: StrategyId | undefined;
  disabled?: boolean;
  onStrategyChange?: (strategy: StrategyId) => void;
};

export function StrategyDropdown({
  currentStrategy,
  disabled,
  onStrategyChange,
}: StrategyDropdownProps) {
  const [open, setOpen] = useState(false);
  const displayId = resolveStrategyDisplayId(currentStrategy);
  const entries = Object.entries(STRATEGY_LABELS) as [StrategyId, string][];

  const handleSelect = useCallback(
    (newStrategy: StrategyId) => {
      if (disabled || !newStrategy || newStrategy === currentStrategy) return;
      const st = currentState;
      if (!st) return;
      const prevStatus = st.status;
      if ((prevStatus !== 'success' && prevStatus !== 'compose') || !isExtensionContextValid()) {
        return;
      }
      commitPanelEvent({ type: 'ui.strategy', strategy: newStrategy });
      onStrategyChange?.(newStrategy);
      if (prevStatus === 'success') {
        patchVersionList();
      }
      safeSendMessage(
        {
          type: 'SET_PROMPT_STRATEGY',
          payload: { strategy: newStrategy },
        } satisfies RuntimeMessage,
        () => void chrome.runtime.lastError,
      );
      setOpen(false);
    },
    [currentStrategy, disabled, onStrategyChange],
  );

  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled) return;
    setOpen((v) => !v);
  };

  const handleItemClick = (e: MouseEvent<HTMLLIElement>, id: StrategyId) => {
    e.stopPropagation();
    handleSelect(id);
  };

  return (
    <div
      className={`strategy-dropdown${open ? ' open' : ''}`}
      data-role="strategy-dropdown"
      title="切换策略后需点击重新生成生效"
    >
      <button className="sd-trigger" type="button" disabled={disabled} onClick={handleTriggerClick}>
        <span className="sd-label">{strategyDisplayLabel(currentStrategy)}</span>
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
        {entries.map(([id, label]) => (
          <li
            key={id}
            className={`sd-item${id === displayId ? ' active' : ''}`}
            data-strategy={id}
            onClick={(e) => handleItemClick(e, id)}
          >
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
