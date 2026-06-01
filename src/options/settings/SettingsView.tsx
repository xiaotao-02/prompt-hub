import { useCallback, useEffect, useState } from 'react';
import { PROVIDERS } from '@/lib/providers';
import { getSettings } from '@/lib/storage';
import { StatusBanner } from '@/components/ui';
import { UI_SAVED_TOAST_MS } from '@/lib/uiFeedback';
import { UI_ACTION } from '@/lib/uiCopy';
import UpdateSection from '../UpdateSection';
import OutputSettingsPanel from '../OutputSettingsPanel';
import StrategySettingsPanel from '../StrategySettingsPanel';
import DataPersistence from '../DataPersistence';
import SettingsNav from './parts/SettingsNav';
import ProviderSettingsPanel from './tabs/ProviderSettingsPanel';
import { useSettingsPersistence } from './hooks/useSettingsPersistence';
import { useProviderConnection } from './hooks/useProviderConnection';
import {
  SETTINGS_PANEL_NAV,
  SETTINGS_PANEL_STORAGE_KEY,
  readInitialPanelId,
  type SettingsPanelId,
} from './types';

interface Props {
  /** 父组件提供的「保存中 / 已保存」状态，按钮渲染在外层 header，方便和 Tab 切换共用。 */
  registerSaveHandler?: (handler: () => Promise<void>) => void;
  /**
   * 通知父级当前 settings 是否相对「上次落盘」有修改，
   * 父级据此把顶部按钮在「保存设置」与「已保存」之间切换。
   */
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * 设置面板：模型供应商 / 输出风格 / 其他 / 自动更新。
 *
 * 薄编排层：导航 + 折页路由 + hooks 组合。
 */
export default function SettingsView({ registerSaveHandler, onDirtyChange }: Props) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [panelId, setPanelId] = useState<SettingsPanelId>(readInitialPanelId);

  const markSaved = useCallback(() => {
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), UI_SAVED_TOAST_MS);
  }, []);

  const { settings, setSettings, lastSavedSig, dirty, persistAndMark, settingsRef } =
    useSettingsPersistence({
      registerSaveHandler,
      onDirtyChange,
      onSaved: markSaved,
    });

  const { panelProps } = useProviderConnection({
    settings,
    setSettings,
    lastSavedSig,
    dirty,
    persistAndMark,
    settingsRef,
    panelId,
    onSaved: markSaved,
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SETTINGS_PANEL_STORAGE_KEY, panelId);
    } catch {
      /* ignore */
    }
  }, [panelId]);

  const extractMeta = settings ? PROVIDERS[settings.activeProvider] : null;

  if (!settings || !extractMeta) {
    return <div className="p-8 text-sm text-zinc-500">加载中…</div>;
  }

  const activePanelLabel = SETTINGS_PANEL_NAV.find((n) => n.id === panelId)?.label;

  return (
    <div className="space-y-4">
      {savedAt && <StatusBanner tone="success">{UI_ACTION.savedSettings}</StatusBanner>}

      <div className="card !p-0 overflow-hidden flex flex-col min-h-[50vh] lg:flex-row lg:overflow-visible">
        <SettingsNav panelId={panelId} onPanelChange={setPanelId} />

        <main
          id="settings-main-panel"
          aria-label={activePanelLabel ? `设置 · ${activePanelLabel}` : '设置内容'}
          className="flex-1 min-w-0 px-4 py-4 sm:p-5"
        >
          {panelId === 'provider' && panelProps && (
            <ProviderSettingsPanel {...panelProps} onNavigatePanel={setPanelId} />
          )}

          {panelId === 'output' && (
            <OutputSettingsPanel settings={settings} setSettings={setSettings} />
          )}

          {panelId === 'strategy' && (
            <StrategySettingsPanel settings={settings} setSettings={setSettings} />
          )}

          {panelId === 'data' && (
            <DataPersistence
              variant="plain"
              onDataRestored={async () => {
                setSettings(await getSettings());
              }}
            />
          )}

          {panelId === 'updates' && <UpdateSection variant="plain" />}

          <footer className="text-xs text-zinc-400 dark:text-zinc-500 pt-6 mt-8 text-center border-t border-zinc-100 dark:border-zinc-800/80">
            数据仅保存在你的浏览器本地，不会上传到任何第三方服务器。
          </footer>
        </main>
      </div>
    </div>
  );
}
