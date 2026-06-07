import type { AppSettings } from '@/lib/types';
import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';
import { UI_SETTINGS_COPY } from '@/lib/uiCopy';
import { ChoiceCard } from '@/components/ui';
import { OneClickRefineRandomnessDropdown } from '../../PromptLibrary/parts/OneClickRefineRandomnessDropdown';
import { SettingsSection } from '../parts/SettingsSection';
import { SettingRow } from '../parts/SettingRow';
import { HelpDisclosure } from '../parts/HelpDisclosure';
import type { CommitSettings } from '../types';

const POPUP_ACTION_OPTIONS = [
  {
    value: 'library' as const,
    label: UI_SETTINGS_COPY.popupActionLibraryLabel,
    desc: UI_SETTINGS_COPY.popupActionLibraryDesc,
  },
  {
    value: 'panel' as const,
    label: UI_SETTINGS_COPY.popupActionPanelLabel,
    desc: UI_SETTINGS_COPY.popupActionPanelDesc,
  },
];

interface Props {
  settings: AppSettings;
  commitSettings: CommitSettings;
}

/**
 * 交互设置：工具栏弹窗动作、随机风格强度、历史与面板聚焦。
 */
export default function InteractionSettingsPanel({ settings, commitSettings }: Props) {
  const randomness = normalizeOneClickRefineRandomness(settings.oneClickRewriteRandomness);

  return (
    <div className="space-y-6">
      <SettingsSection title={UI_SETTINGS_COPY.popupToolbarSection} bordered>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {POPUP_ACTION_OPTIONS.map((opt) => {
            const active = (settings.popupToolbarPromptAction ?? 'library') === opt.value;
            return (
              <ChoiceCard
                key={opt.value}
                compact
                onClick={() =>
                  commitSettings(
                    { ...settings, popupToolbarPromptAction: opt.value },
                    { immediate: true },
                  )
                }
                active={active}
                titleText={opt.label}
                description={opt.desc}
              />
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="高级交互" bordered>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          <SettingRow
            label="随机风格强度"
            hint="控制浮动面板与提示词库「随机风格」每次生成的变异幅度"
          >
            <OneClickRefineRandomnessDropdown
              value={randomness}
              onChange={(v) =>
                commitSettings({ ...settings, oneClickRewriteRandomness: v }, { immediate: true })
              }
            />
          </SettingRow>
          <SettingRow
            label="保存历史记录"
            hint="提取记录会保存在浏览器本地（最多 10 万条），可在「提示词库」中管理"
          >
            <input
              id="settings-save-history"
              type="checkbox"
              checked={settings.saveHistory}
              onChange={(e) =>
                commitSettings({ ...settings, saveHistory: e.target.checked }, { immediate: true })
              }
              className="h-4 w-4 accent-violet-500"
            />
          </SettingRow>
          <SettingRow
            label={UI_SETTINGS_COPY.panelAutofocusTitle}
            hint={UI_SETTINGS_COPY.panelAutofocusDesc}
            last
          >
            <input
              id="settings-panel-autofocus"
              type="checkbox"
              checked={settings.panelAutofocus !== false}
              onChange={(e) =>
                commitSettings(
                  { ...settings, panelAutofocus: e.target.checked },
                  { immediate: true },
                )
              }
              className="h-4 w-4 accent-violet-500"
            />
          </SettingRow>
        </div>
      </SettingsSection>

      <HelpDisclosure>
        <p>{UI_SETTINGS_COPY.popupToolbarHelp}</p>
        <p>
          随机风格强度控制浮动面板与提示词库中「随机风格」每次生成时的变异幅度；同一档位下多次点击仍会略有不同。
        </p>
      </HelpDisclosure>
    </div>
  );
}
