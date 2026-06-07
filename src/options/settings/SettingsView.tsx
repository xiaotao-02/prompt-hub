import { useEffect, useState } from 'react';
import { PROVIDERS } from '@/lib/providers';
import { getSettings } from '@/lib/storage';
import UpdateSection from '../UpdateSection';
import OutputSettingsPanel from '../OutputSettingsPanel';
import InteractionSettingsPanel from './tabs/InteractionSettingsPanel';
import DataPersistence from '../DataPersistence';
import SettingsNav from './parts/SettingsNav';
import { SettingsLoadingSkeleton } from './parts/SettingsLoadingSkeleton';
import ProviderSettingsPanel from './tabs/ProviderSettingsPanel';
import { useSettingsPersistence, type SettingsSaveState } from './hooks/useSettingsPersistence';
import { useProviderConnection } from './hooks/useProviderConnection';
import {
  SETTINGS_PANEL_NAV,
  SETTINGS_PANEL_STORAGE_KEY,
  readInitialPanelId,
  type SettingsPanelId,
} from './types';

interface Props {
  onSaveStateChange?: (state: SettingsSaveState, errorMessage?: string) => void;
}

export default function SettingsView({ onSaveStateChange }: Props) {
  const [panelId, setPanelId] = useState<SettingsPanelId>(readInitialPanelId);

  const { settings, setSettings, commitSettings, persistAndMark, settingsRef } =
    useSettingsPersistence({ onSaveStateChange });

  const { panelProps } = useProviderConnection({
    settings,
    commitSettings,
    setSettings,
    persistAndMark,
    settingsRef,
    panelId,
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
    return <SettingsLoadingSkeleton />;
  }

  const activePanelLabel = SETTINGS_PANEL_NAV.find((n) => n.id === panelId)?.label;

  return (
    <div className="space-y-4">
      <div className="card !p-0 overflow-hidden flex flex-col lg:flex-row lg:overflow-visible">
        <SettingsNav panelId={panelId} onPanelChange={setPanelId} />

        <main
          id="settings-main-panel"
          aria-label={activePanelLabel ? `设置 · ${activePanelLabel}` : '设置内容'}
          className="flex-1 min-w-0 p-5 sm:p-6"
        >
          <div key={panelId} className="mx-auto w-full max-w-[920px] space-y-6 ui-fade-in">
            {panelId === 'provider' && panelProps && <ProviderSettingsPanel {...panelProps} />}

            {panelId === 'output' && (
              <OutputSettingsPanel settings={settings} commitSettings={commitSettings} />
            )}

            {panelId === 'interaction' && (
              <InteractionSettingsPanel settings={settings} commitSettings={commitSettings} />
            )}

            {panelId === 'data' && (
              <DataPersistence
                onDataRestored={async () => {
                  const fresh = await getSettings();
                  commitSettings(fresh, { immediate: true });
                }}
              />
            )}

            {panelId === 'updates' && <UpdateSection />}

            <footer className="text-xs text-zinc-400 dark:text-zinc-500 pt-5 mt-6 text-center border-t border-zinc-100 dark:border-zinc-800/80">
              数据仅保存在你的浏览器本地，不会上传到任何第三方服务器。
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
