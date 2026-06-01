import { useState } from 'react';
import type { AppSettings, OutputStyle } from '@/lib/types';
import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';
import { UI_SETTINGS_COPY } from '@/lib/uiCopy';
import { ChoiceCard, Collapsible } from '@/components/ui';
import { OneClickRefineRandomnessDropdown } from './PromptLibrary/parts/OneClickRefineRandomnessDropdown';
import UnifiedCustomPromptEditor from './UnifiedCustomPromptEditor';
import { detectCustomPromptMode } from './customPromptEditor';

const STYLE_OPTIONS: { value: OutputStyle; label: string; desc: string }[] = [
  { value: 'natural-zh', label: '自然语言（中文）', desc: '段落式中文描述，适合通用 AI 绘图' },
  { value: 'natural-en', label: 'Natural (English)', desc: '英文段落式描述，适合 Flux/SDXL 等' },
  { value: 'sd-tags', label: 'Stable Diffusion 标签', desc: 'Danbooru 风格英文 tag 列表' },
  { value: 'midjourney', label: 'Midjourney 风格', desc: 'MJ v6 自然语言 + 参数风格' },
];

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
  setSettings: (next: AppSettings) => void;
}

/**
 * 输出与交互：设置子页直接展示控件；compact 输出风格、OneClickRefineRandomnessDropdown、长说明收折叠。
 */
export default function OutputSettingsPanel({ settings, setSettings }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);

  const randomness = normalizeOneClickRefineRandomness(settings.oneClickRewriteRandomness);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">输出与交互</h2>

      <div>
        <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">输出风格</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STYLE_OPTIONS.map((s) => {
            const active = settings.outputStyle === s.value;
            return (
              <ChoiceCard
                key={s.value}
                compact={!active}
                onClick={() => setSettings({ ...settings, outputStyle: s.value })}
                active={active}
                titleText={s.label}
                description={active ? s.desc : undefined}
              />
            );
          })}
        </div>
      </div>

      <UnifiedCustomPromptEditor settings={settings} setSettings={setSettings} />

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          aria-expanded={helpOpen}
        >
          <span>需要帮助？</span>
          <span className="text-zinc-400">{helpOpen ? '−' : '+'}</span>
        </button>
        <Collapsible open={helpOpen}>
          <div className="space-y-3 border-t border-zinc-200 px-3 py-3 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <p>决定生成的提示词使用什么语言和格式。</p>
            {settings.promptStrategy === 'native' && (
              <p className="text-violet-600 dark:text-violet-400">
                当前策略为「原生识别」：反推固定按<strong>自然中文段落</strong>
                调用模型，上方「输出风格」四档不会改变本次结果；切换到其他策略后仍会使用你在此处选中的档位。
              </p>
            )}
            <p>
              <strong>追加到系统指令</strong>
              ：叠在当前策略的系统提示上，拼接位置由「策略版本」决定（高保真档前置、经典档尾部「额外要求：」）。
            </p>
            <p>
              <strong>替换系统指令</strong>
              ：整段替代指令集正文，四种输出风格共用；仅「自定义组合」可用。若曾同时填写两种模式，以替换内容为准。
            </p>
            {detectCustomPromptMode(settings) === 'append' && (
              <p className="text-zinc-400">
                当前为追加模式。切换到「替换系统指令」需先在「策略版本」选择「自定义组合」。
              </p>
            )}
            <p>{UI_SETTINGS_COPY.popupToolbarHelp}</p>
            <p>
              随机风格强度控制浮动面板与提示词库中「随机风格」每次生成时的变异幅度；同一档位下多次点击仍会略有不同。
            </p>
          </div>
        </Collapsible>
      </div>

      <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {UI_SETTINGS_COPY.popupToolbarSection}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {POPUP_ACTION_OPTIONS.map((opt) => {
            const active = (settings.popupToolbarPromptAction ?? 'library') === opt.value;
            return (
              <ChoiceCard
                key={opt.value}
                onClick={() => setSettings({ ...settings, popupToolbarPromptAction: opt.value })}
                active={active}
                titleText={opt.label}
                description={opt.desc}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">随机风格强度</span>
        <OneClickRefineRandomnessDropdown
          value={randomness}
          onChange={(v) => setSettings({ ...settings, oneClickRewriteRandomness: v })}
        />
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">高级交互</div>
        <label className="flex cursor-pointer select-none items-center gap-3">
          <input
            type="checkbox"
            checked={settings.saveHistory}
            onChange={(e) => setSettings({ ...settings, saveHistory: e.target.checked })}
            className="h-4 w-4 accent-violet-500"
          />
          <div>
            <div className="text-sm">保存历史记录</div>
            <div className="text-[11px] text-zinc-500">
              最近 300 条提取记录会保存在浏览器本地，可在「提示词库」中管理
            </div>
          </div>
        </label>
        <label className="flex cursor-pointer select-none items-center gap-3">
          <input
            type="checkbox"
            checked={settings.panelAutofocus !== false}
            onChange={(e) => setSettings({ ...settings, panelAutofocus: e.target.checked })}
            className="h-4 w-4 accent-violet-500"
          />
          <div>
            <div className="text-sm">{UI_SETTINGS_COPY.panelAutofocusTitle}</div>
            <div className="text-[11px] text-zinc-500">{UI_SETTINGS_COPY.panelAutofocusDesc}</div>
          </div>
        </label>
      </div>
    </section>
  );
}
