import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { safeSendMessage, isExtensionContextValid } from '@/content/extensionBridge';
import { getSettings } from '@/lib/storage/settings';
import { getUserStrategyPresets, briefUserPresetFingerprint } from '@/lib/storage';
import { USER_STRATEGY_PRESETS_KEY, SETTINGS_KEY } from '@/lib/storage/keys';
import {
  isBuiltinStrategyOptionActive,
  isPresetOptionActive,
  resolveStrategySelectTriggerLabel,
} from '@/lib/strategySelectDisplay';
import { STRATEGY_LABELS, type StrategyId } from '@/lib/strategies-meta';
import type { RuntimeMessage, UserStrategyPreset } from '@/lib/types';
import { commitPanelEvent } from '../dispatchPanel';
import { currentState, panelActions } from '../state';
import { resolveStrategyDisplayId } from '../strategyDisplay';
import { patchVersionList } from '../versionListUi';
import { PanelSelectDropdown } from './PanelSelectDropdown';

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
  const [presets, setPresets] = useState<UserStrategyPreset[]>([]);
  const [panelSettings, setPanelSettings] = useState<Awaited<
    ReturnType<typeof getSettings>
  > | null>(null);

  const refreshStrategyContext = useCallback(async () => {
    const [nextPresets, nextSettings] = await Promise.all([
      getUserStrategyPresets(),
      getSettings(),
    ]);
    setPresets(nextPresets);
    setPanelSettings(nextSettings);
  }, []);

  useEffect(() => {
    void refreshStrategyContext();
  }, [refreshStrategyContext]);

  useEffect(() => {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local') return;
      if (!(USER_STRATEGY_PRESETS_KEY in changes)) return;
      void refreshStrategyContext();
    };
    const syncHandler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'sync') return;
      if (!(SETTINGS_KEY in changes)) return;
      void refreshStrategyContext();
    };
    chrome.storage.onChanged.addListener(handler);
    chrome.storage.onChanged.addListener(syncHandler);
    return () => {
      chrome.storage.onChanged.removeListener(handler);
      chrome.storage.onChanged.removeListener(syncHandler);
    };
  }, [refreshStrategyContext]);

  const displayId = resolveStrategyDisplayId(currentStrategy);
  const entries = Object.entries(STRATEGY_LABELS) as [StrategyId, string][];
  const settingsForDisplay =
    panelSettings ?? ({ promptStrategy: displayId } as Awaited<ReturnType<typeof getSettings>>);
  const triggerLabel = resolveStrategySelectTriggerLabel(
    settingsForDisplay,
    displayId,
    presets,
    (id) => STRATEGY_LABELS[id] ?? id,
  );

  const handleSelectBuiltin = useCallback(
    (newStrategy: StrategyId) => {
      if (disabled || !newStrategy || newStrategy === currentStrategy) return;
      const st = currentState;
      if (!st) return;
      const prevStatus = st.status;
      if ((prevStatus !== 'success' && prevStatus !== 'compose') || !isExtensionContextValid()) {
        return;
      }
      const next = commitPanelEvent({ type: 'ui.strategy', strategy: newStrategy });
      onStrategyChange?.(newStrategy);
      if (next) {
        if (prevStatus === 'success') patchVersionList();
        else panelActions.renderPanel(next);
      }
      safeSendMessage(
        {
          type: 'SET_PROMPT_STRATEGY',
          payload: { strategy: newStrategy },
        } satisfies RuntimeMessage,
        () => void chrome.runtime.lastError,
      );
      void refreshStrategyContext();
      setOpen(false);
    },
    [currentStrategy, disabled, onStrategyChange, refreshStrategyContext],
  );

  const handleSelectPreset = useCallback(
    (preset: UserStrategyPreset) => {
      if (disabled || !isExtensionContextValid()) return;
      const st = currentState;
      if (!st) return;
      const prevStatus = st.status;
      if (prevStatus !== 'success' && prevStatus !== 'compose') return;
      const next = commitPanelEvent({ type: 'ui.strategy', strategy: 'custom' });
      onStrategyChange?.('custom');
      if (next) {
        if (prevStatus === 'success') patchVersionList();
        else panelActions.renderPanel(next);
      }
      safeSendMessage(
        {
          type: 'APPLY_USER_STRATEGY_PRESET',
          payload: { presetId: preset.id },
        } satisfies RuntimeMessage,
        () => void chrome.runtime.lastError,
      );
      void refreshStrategyContext();
      setOpen(false);
    },
    [disabled, onStrategyChange, refreshStrategyContext],
  );

  const handleBuiltinClick = (e: MouseEvent<HTMLLIElement>, id: StrategyId) => {
    e.stopPropagation();
    handleSelectBuiltin(id);
  };

  const handlePresetClick = (e: MouseEvent<HTMLLIElement>, preset: UserStrategyPreset) => {
    e.stopPropagation();
    handleSelectPreset(preset);
  };

  return (
    <PanelSelectDropdown
      dataRole="strategy-dropdown"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      title="切换后可直接点「让 AI 调整」生效（将重新识图反推）"
      triggerLabel={triggerLabel}
    >
      {entries.map(([id, label]) => (
        <li
          key={id}
          className={`sd-item${isBuiltinStrategyOptionActive(settingsForDisplay, id, presets) ? ' active' : ''}`}
          data-strategy={id}
          onClick={(e) => handleBuiltinClick(e, id)}
        >
          {label}
        </li>
      ))}
      {presets.length > 0 && (
        <li className="sd-item sd-item-muted sd-item-section" role="presentation">
          我的预设
        </li>
      )}
      {presets.map((preset) => (
        <li
          key={preset.id}
          className={`sd-item${isPresetOptionActive(settingsForDisplay, preset, presets) ? ' active' : ''}`}
          data-preset-id={preset.id}
          title={briefUserPresetFingerprint(preset)}
          onClick={(e) => handlePresetClick(e, preset)}
        >
          {preset.name}
        </li>
      ))}
    </PanelSelectDropdown>
  );
}
