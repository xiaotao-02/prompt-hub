import { SETTINGS_PANEL_NAV, settingsPanelNavButtonClass, type SettingsPanelId } from '../types';

interface Props {
  panelId: SettingsPanelId;
  onPanelChange: (id: SettingsPanelId) => void;
}

export default function SettingsNav({ panelId, onPanelChange }: Props) {
  return (
    <>
      <div className="lg:hidden shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/85 dark:bg-zinc-950/50 px-2 py-2">
        <div
          role="tablist"
          aria-label="设置分类"
          className="flex gap-1 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]"
        >
          {SETTINGS_PANEL_NAV.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={panelId === id}
              aria-controls="settings-main-panel"
              onClick={() => onPanelChange(id)}
              className={settingsPanelNavButtonClass(panelId === id, true)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/85 dark:bg-zinc-950/40 py-3 px-2 sticky top-[88px] self-start max-h-[calc(100dvh-88px)] overflow-y-auto">
        <nav aria-label="设置分类" className="flex flex-col gap-0.5">
          {SETTINGS_PANEL_NAV.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-current={panelId === id ? 'page' : undefined}
              onClick={() => onPanelChange(id)}
              className={settingsPanelNavButtonClass(panelId === id, false)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
