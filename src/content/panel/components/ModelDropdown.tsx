import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import {
  getActiveModelOptionsFromExtension,
  isExtensionContextValid,
  safeSendMessage,
} from '@/content/extensionBridge';
import { partitionByVision, type ModelVisionSupport } from '@/lib/modelVision';
import type { RuntimeMessage } from '@/lib/types';
import { commitPanelEvent } from '../dispatchPanel';
import { panelModelDisplayName } from '../modelDisplayName';
import { currentState } from '../state';
import type { PanelState } from '../state';
import { patchVersionList } from '../versionListUi';
import { PanelSelectArrow, PanelSelectDropdown } from './PanelSelectDropdown';

export type ModelDropdownProps = {
  state: PanelState;
  disabled?: boolean;
};

function sortModelsForPanel(
  models: string[],
  visionById: Record<string, ModelVisionSupport>,
): string[] {
  if (Object.keys(visionById).length === 0) return models;
  const { vision, unknown, noVision } = partitionByVision(models, visionById);
  return [...vision, ...unknown, ...noVision];
}

export function ModelDropdown({ state, disabled }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [visionById, setVisionById] = useState<Record<string, ModelVisionSupport>>({});
  const [activeProvider, setActiveProvider] = useState<string | undefined>(state.provider);

  const label = panelModelDisplayName(state.provider, state.model);
  const hidden = !label;

  const sortedModels = useMemo(() => sortModelsForPanel(models, visionById), [models, visionById]);

  useEffect(() => {
    if (!open || !isExtensionContextValid()) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    void getActiveModelOptionsFromExtension().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setFetchError(res.error ?? '加载失败');
        return;
      }
      setActiveProvider(res.provider);
      setModels(res.models);
      setVisionById(res.visionById);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSelect = useCallback(
    (newModel: string) => {
      if (disabled || !newModel || newModel === state.model) {
        setOpen(false);
        return;
      }
      const st = currentState;
      if (!st) return;
      if (st.status !== 'success' && st.status !== 'loading') return;
      if (!isExtensionContextValid()) return;

      const provider = activeProvider ?? st.provider;
      commitPanelEvent({ type: 'ui.model', model: newModel, provider });
      if (st.status === 'success' || st.status === 'loading') {
        patchVersionList();
      }
      safeSendMessage(
        {
          type: 'SET_EXTRACT_MODEL',
          payload: { model: newModel },
        } satisfies RuntimeMessage,
        () => void chrome.runtime.lastError,
      );
      setOpen(false);
    },
    [activeProvider, disabled, state.model],
  );

  const handleOpenOptions = useCallback((e: MouseEvent<HTMLLIElement>) => {
    e.stopPropagation();
    if (!isExtensionContextValid()) return;
    safeSendMessage({
      type: 'OPEN_OPTIONS',
      payload: { tab: 'settings' },
    } satisfies RuntimeMessage);
    setOpen(false);
  }, []);

  const handleItemClick = (e: MouseEvent<HTMLLIElement>, modelId: string) => {
    e.stopPropagation();
    handleSelect(modelId);
  };

  const renderItem = (m: string) => {
    const active = m === state.model;
    const support = visionById[m];
    const isVision = support === 'vision';
    const display = m.length > 48 ? `${m.slice(0, 46)}…` : m;
    return (
      <li
        key={m}
        className={`sd-item${active ? ' active' : ''}`}
        data-model={m}
        title={m}
        onClick={(e) => handleItemClick(e, m)}
      >
        <span className="sd-item-label">{display}</span>
        {isVision && <span className="sd-vision-tag">识图</span>}
      </li>
    );
  };

  let menuBody: ReactNode;
  if (loading) {
    menuBody = <li className="sd-item sd-item-muted">加载中…</li>;
  } else if (fetchError) {
    menuBody = <li className="sd-item sd-item-muted">{fetchError}</li>;
  } else if (sortedModels.length === 0) {
    menuBody = (
      <>
        <li className="sd-item sd-item-muted">未发现模型，请先在设置页拉取</li>
        <li className="sd-item sd-item-action" onClick={handleOpenOptions}>
          打开设置页
        </li>
      </>
    );
  } else {
    menuBody = sortedModels.map((m) => renderItem(m));
  }

  return (
    <PanelSelectDropdown
      dataRole="model-dropdown"
      wrapperClassName="model-dropdown"
      menuClassName="model-dropdown-menu"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      hidden={hidden}
      title={label ? `反推模型：${label}（点击切换）` : undefined}
      triggerClassName="model-badge-trigger"
      triggerChildren={
        <>
          <span className="sd-label badge model-badge" data-role="model-badge">
            {label || ''}
          </span>
          <PanelSelectArrow />
        </>
      }
    >
      {menuBody}
    </PanelSelectDropdown>
  );
}
