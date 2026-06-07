import { useCallback, useEffect, useState } from 'react';
import { Settings as SettingsIcon, BookOpen, ExternalLink } from 'lucide-react';
import { SegmentedControl } from '@/components/ui';
import SettingsView from './settings/SettingsView';
import { SettingsAutosaveIndicator } from './settings/parts/SettingsAutosaveIndicator';
import type { SettingsSaveState } from './settings/hooks/useSettingsPersistence';
import PromptLibrary from './PromptLibrary';
import type { LibraryDockIntent } from './PromptLibrary/types';

type Tab = 'settings' | 'library';

const TAB_STORAGE_KEY = 'options_active_tab_v1';

function readHashParams(): {
  tab: Tab | null;
  focusId: string | null;
  dockRaw: string | null;
} {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return { tab: null, focusId: null, dockRaw: null };
    const params = new URLSearchParams(hash);
    const t = params.get('tab');
    const focus = params.get('focus');
    return {
      tab: t === 'library' || t === 'settings' ? (t as Tab) : null,
      focusId: focus || null,
      dockRaw: params.get('dock'),
    };
  } catch {
    return { tab: null, focusId: null, dockRaw: null };
  }
}

function normalizeLibraryDock(raw: string | null): LibraryDockIntent {
  if (raw === 'refine' || raw === 'versions') return raw;
  return null;
}

const OPTIONS_ENTRY_DEEPLINK = readHashParams();

function resolveInitialOptionsTab(frozen: typeof OPTIONS_ENTRY_DEEPLINK): Tab {
  if (frozen.focusId) return 'library';
  if (frozen.tab) return frozen.tab;
  try {
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    return saved === 'library' || saved === 'settings' ? saved : 'settings';
  } catch {
    return 'settings';
  }
}

const OPTIONS_HAD_DEEP_LINK = Boolean(
  OPTIONS_ENTRY_DEEPLINK.tab || OPTIONS_ENTRY_DEEPLINK.focusId || OPTIONS_ENTRY_DEEPLINK.dockRaw,
);

export default function OptionsApp() {
  const [tab, setTab] = useState<Tab>(() => resolveInitialOptionsTab(OPTIONS_ENTRY_DEEPLINK));
  const [libraryFocusId, setLibraryFocusId] = useState<string | null>(
    () => OPTIONS_ENTRY_DEEPLINK.focusId,
  );
  const [libraryDockIntent, setLibraryDockIntent] = useState<LibraryDockIntent>(() => {
    const dock = normalizeLibraryDock(OPTIONS_ENTRY_DEEPLINK.dockRaw);
    return OPTIONS_ENTRY_DEEPLINK.focusId && dock ? dock : null;
  });
  const [saveState, setSaveState] = useState<SettingsSaveState>('idle');
  const [saveError, setSaveError] = useState<string | undefined>();

  const clearLibraryDockIntent = useCallback(() => setLibraryDockIntent(null), []);

  useEffect(() => {
    if (!OPTIONS_HAD_DEEP_LINK) return;
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      /* ignore */
    }
  }, []);

  const handleSaveStateChange = useCallback((state: SettingsSaveState, errorMessage?: string) => {
    setSaveState(state);
    setSaveError(errorMessage);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  const containerWidth = 'max-w-[1536px]';
  const tabOptions = [
    { value: 'settings' as const, icon: <SettingsIcon className="w-3.5 h-3.5" />, label: '设置' },
    { value: 'library' as const, icon: <BookOpen className="w-3.5 h-3.5" />, label: '提示词库' },
  ];

  const autosaveIndicator = (
    <SettingsAutosaveIndicator
      state={saveState}
      errorMessage={saveError}
      hidden={tab !== 'settings'}
    />
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/75 backdrop-blur sticky top-0 z-10">
        <div
          className={`${containerWidth} mx-auto px-8 py-4 hidden sm:grid grid-cols-[1fr_auto_1fr] items-center gap-4`}
        >
          <div className="flex items-center gap-2 min-w-0 justify-self-start">
            <img
              src={chrome.runtime.getURL('icons/icon-128.png')}
              alt="Prompt Hub"
              className="w-7 h-7 rounded-lg shadow-sm flex-none object-cover"
            />
            <h1 className="text-base font-semibold truncate">Prompt Hub</h1>
            <a
              href="https://github.com/xiaotao-02/prompt-hub"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs text-violet-600 hover:underline inline-flex items-center gap-1 dark:text-violet-400"
              title="GitHub 开源仓库"
            >
              GitHub
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>
          </div>

          <SegmentedControl
            ariaLabel="选项页视图"
            className="justify-self-center"
            value={tab}
            options={tabOptions}
            onChange={setTab}
          />

          {autosaveIndicator}
        </div>

        <div
          className={`sm:hidden ${containerWidth} mx-auto px-4 py-3 flex items-center justify-between gap-3`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={chrome.runtime.getURL('icons/icon-128.png')}
              alt="Prompt Hub"
              className="w-7 h-7 rounded-lg shadow-sm flex-none object-cover"
            />
            <h1 className="text-base font-semibold truncate">Prompt Hub</h1>
            <a
              href="https://github.com/xiaotao-02/prompt-hub"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs text-violet-600 hover:underline inline-flex items-center gap-1 dark:text-violet-400"
              title="GitHub 开源仓库"
            >
              GitHub
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>
          </div>
          {autosaveIndicator}
        </div>

        <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex justify-center">
          <SegmentedControl
            ariaLabel="选项页视图"
            value={tab}
            options={tabOptions}
            onChange={setTab}
          />
        </div>
      </header>

      <main
        className={`w-full mx-auto px-8 py-8 ${tab === 'settings' ? 'max-w-[920px]' : containerWidth}`}
      >
        <div key={tab} className="ui-fade-in">
          {tab === 'settings' ? (
            <SettingsView onSaveStateChange={handleSaveStateChange} />
          ) : (
            <PromptLibrary
              focusId={libraryFocusId}
              onConsumeFocus={() => setLibraryFocusId(null)}
              dockIntent={libraryDockIntent}
              onConsumeDockIntent={clearLibraryDockIntent}
            />
          )}
        </div>
      </main>
    </div>
  );
}
