import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import {
  applyUserStrategyPresetToSettings,
  briefUserPresetFingerprint,
  getUserStrategyPresets,
  isSettingsMatchingUserPreset,
} from '@/lib/storage';
import { USER_STRATEGY_PRESETS_KEY } from '@/lib/storage/keys';
import { getStrategy, getStrategyList, resolveCustomStrategy } from '@/lib/strategies';
import type { AppSettings, UserStrategyPreset } from '@/lib/types';
import { ChoiceCard, Collapsible } from '@/components/ui';
import CustomStrategyPanel from './CustomStrategyPanel';
import { applyPromptStrategyChange } from './customPromptEditor';

const STRATEGY_GRID_CLASS = 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4';

const STRATEGY_HELP_ROWS: { label: string; detail: string }[] = [
  { label: 'v0.3.6 通用高还原', detail: '默认档；主体/构图/光线/色彩成套，少脑补，图·多图·视频' },
  { label: 'v0.3.5 策略', detail: 'v0.3.0 采样拼接；中文按图 3–8 段，只出提示词正文' },
  { label: 'v0.3.0 策略', detail: 'GPT Image / Nano Banana；8 维度分句 + 摄影参数' },
  { label: 'v0.2.2 策略', detail: 'v0.1.0 增强；10 维度 + 三禁，自定义前置' },
  { label: '经典策略', detail: 'v0.1.x 语感；temp 0.4 · 1024 token · 尾部追加' },
  { label: '原生识别', detail: '极简直出；输出风格四档不参与反推' },
  { label: '自定义组合', detail: '指令集 / 采样 / 拼接三组件自由混搭' },
];

interface Props {
  settings: AppSettings;
  setSettings: (next: AppSettings) => void;
}

function renderStrategyMeta(s: { temperature: number; maxTokens: number; customPosition: string }) {
  return (
    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
      temp {s.temperature} · max {s.maxTokens} ·{' '}
      {s.customPosition === 'prepend' ? '自定义前置' : '自定义追加'}
    </span>
  );
}

export default function StrategySettingsPanel({ settings, setSettings }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [customDetailsOpen, setCustomDetailsOpen] = useState(true);
  const [userPresets, setUserPresets] = useState<UserStrategyPreset[]>([]);

  const strategyList = useMemo(() => getStrategyList(), []);

  useEffect(() => {
    void getUserStrategyPresets().then(setUserPresets);
  }, []);

  useEffect(() => {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local') return;
      if (!(USER_STRATEGY_PRESETS_KEY in changes)) return;
      void getUserStrategyPresets().then(setUserPresets);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const activeStrategy = useMemo(
    () => getStrategy(settings.promptStrategy),
    [settings.promptStrategy],
  );

  const activeUserPreset = useMemo(
    () => userPresets.find((p) => isSettingsMatchingUserPreset(settings, p)) ?? null,
    [settings, userPresets],
  );

  const activeResolved = useMemo(() => {
    if (activeUserPreset) {
      try {
        return resolveCustomStrategy(activeUserPreset.customComponents, {
          instruction: activeUserPreset.customInstruction,
          temperature: activeUserPreset.customTemperature,
          maxTokens: activeUserPreset.customMaxTokens,
        });
      } catch {
        return activeStrategy;
      }
    }
    return activeStrategy;
  }, [activeUserPreset, activeStrategy]);

  const matchesAnySavedPreset = useMemo(
    () => userPresets.some((p) => isSettingsMatchingUserPreset(settings, p)),
    [settings, userPresets],
  );

  useEffect(() => {
    if (settings.promptStrategy !== 'custom') {
      setCustomDetailsOpen(true);
    }
  }, [settings.promptStrategy]);

  const summaryLabel = activeUserPreset ? activeUserPreset.name : activeStrategy.label;
  const summaryDescription = activeUserPreset
    ? briefUserPresetFingerprint(activeUserPreset)
    : activeStrategy.description;

  const renderBuiltinCard = (s: (typeof strategyList)[number]) => {
    const active = settings.promptStrategy === s.id;
    const isCustom = s.id === 'custom';
    const showGenericCustomBadge = isCustom && active && !matchesAnySavedPreset;

    if (isCustom) {
      return (
        <Fragment key={s.id}>
          <div className="h-full min-h-0">
            <ChoiceCard
              type="button"
              onClick={() => {
                if (settings.promptStrategy === 'custom') {
                  setCustomDetailsOpen((o) => !o);
                } else {
                  setSettings(applyPromptStrategyChange(settings, s.id));
                  setCustomDetailsOpen(true);
                }
              }}
              active={active}
              compact
              titleText={s.label}
              aria-expanded={active ? customDetailsOpen : false}
              className="px-2 py-1.5"
              badge={
                showGenericCustomBadge || active ? (
                  <>
                    {showGenericCustomBadge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500 text-white">
                        生效中
                      </span>
                    )}
                    {active && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition ${customDetailsOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    )}
                  </>
                ) : undefined
              }
            />
          </div>
          {active && (
            <Collapsible open={customDetailsOpen} className="col-span-full">
              <CustomStrategyPanel settings={settings} setSettings={setSettings} />
            </Collapsible>
          )}
        </Fragment>
      );
    }

    return (
      <div key={s.id} className="h-full min-h-0">
        <ChoiceCard
          type="button"
          onClick={() => setSettings(applyPromptStrategyChange(settings, s.id))}
          active={active}
          compact
          titleText={s.label}
          className="px-2 py-1.5"
        />
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">策略版本</h2>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 px-4 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Layers className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-200">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="font-medium shrink-0">当前策略：{summaryLabel}</span>
              {activeUserPreset && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/90 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0">
                  我的预设
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
              {summaryDescription}
            </p>
            <div className="mt-1.5">{renderStrategyMeta(activeResolved)}</div>
          </div>
        </div>
      </div>

      <div className={STRATEGY_GRID_CLASS}>
        {strategyList.map(renderBuiltinCard)}
        {userPresets.map((preset) => {
          const active = isSettingsMatchingUserPreset(settings, preset);
          return (
            <div key={`user-preset-${preset.id}`} className="h-full min-h-0">
              <ChoiceCard
                type="button"
                onClick={() => setSettings(applyUserStrategyPresetToSettings(settings, preset))}
                active={active}
                compact
                titleText={preset.name}
                className="px-2 py-1.5"
                badge={
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200/90 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0">
                    我的预设
                  </span>
                }
              />
            </div>
          );
        })}
      </div>

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
          <div className="border-t border-zinc-200 px-3 py-3 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 space-y-3">
            <p>
              一档策略 = <strong>指令集 / 采样 / 拼接</strong>{' '}
              三个组件各自挑一个版本号的组合。切档其实是同时换这 3
              个组件，对比效果时可以随时切回旧版本。
            </p>
            <ul className="space-y-1">
              {STRATEGY_HELP_ROWS.map((row) => (
                <li key={row.label}>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">{row.label}</span>
                  <span className="mx-1 text-zinc-400">—</span>
                  {row.detail}
                </li>
              ))}
            </ul>
          </div>
        </Collapsible>
      </div>
    </section>
  );
}
