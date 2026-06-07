import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  addUserStrategyPreset,
  applyUserStrategyPresetToSettings,
  buildUserStrategyPresetFromSettings,
  getUserStrategyPresets,
  MAX_PRESET_NAME_LEN,
  MAX_USER_STRATEGY_PRESETS,
  removeUserStrategyPreset,
  updateUserStrategyPresetName,
} from '@/lib/storage';
import { USER_STRATEGY_PRESETS_KEY } from '@/lib/storage/keys';
import { getStrategy, resolveCustomStrategy } from '@/lib/strategies';
import { resolveStrategySectionDescription } from '@/lib/strategySelectDisplay';
import {
  getStrategyOverrideForId,
  patchStrategyOverrideForId,
  resolveStrategyForExtract,
} from '@/lib/strategyOverrides';
import type { StrategyId } from '@/lib/strategies-meta';
import type { AppSettings, StrategyOverride, UserStrategyPreset } from '@/lib/types';
import { Button, cx } from '@/components/ui';
import StrategySelect from './StrategySelect';
import {
  REPLACE_INSTRUCTION_HINT,
  applyPromptStrategyChange,
  briefCustomPromptSummary,
  readReplaceInstruction,
  writeReplaceInstruction,
} from './customPromptEditor';
import { SettingsSection } from './settings/parts/SettingsSection';
import type { CommitSettings } from './settings/types';

const RESET_BTN = 'text-[11px] text-zinc-400 hover:text-violet-500 transition-colors shrink-0';

interface Props {
  settings: AppSettings;
  commitSettings: CommitSettings;
}

function defaultSamplingForStrategy(strategyId: StrategyId): {
  temperature: number;
  maxTokens: number;
} {
  const base = getStrategy(strategyId);
  return { temperature: base.temperature, maxTokens: base.maxTokens };
}

function syncTextareaHeight(ta: HTMLTextAreaElement | null) {
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight}px`;
}

export default function StrategySettingsPanel({ settings, commitSettings }: Props) {
  const [userPresets, setUserPresets] = useState<UserStrategyPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [presetTip, setPresetTip] = useState<string | null>(null);

  const selectedId = settings.promptStrategy;

  const refreshPresets = useCallback(async () => {
    setUserPresets(await getUserStrategyPresets());
  }, []);

  useEffect(() => {
    void refreshPresets();
  }, [refreshPresets]);

  useEffect(() => {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area !== 'local') return;
      if (!(USER_STRATEGY_PRESETS_KEY in changes)) return;
      void refreshPresets();
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [refreshPresets]);

  const activeStrategy = useMemo(() => getStrategy(selectedId), [selectedId]);

  const sectionDescription = useMemo(
    () => resolveStrategySectionDescription(settings, userPresets, activeStrategy.description),
    [settings, userPresets, activeStrategy.description],
  );

  const activeResolved = useMemo(
    () => resolveStrategyForExtract(settings, selectedId),
    [settings, selectedId],
  );

  const selectedOverride = useMemo(
    () => getStrategyOverrideForId(settings, selectedId),
    [settings, selectedId],
  );

  const defaults = useMemo(() => defaultSamplingForStrategy(selectedId), [selectedId]);

  const effectiveTemp = selectedOverride?.temperature ?? defaults.temperature;
  const effectiveMaxTokens = selectedOverride?.maxTokens ?? defaults.maxTokens;

  const showPresetTip = useCallback((msg: string, ms = 2400) => {
    setPresetTip(msg);
    window.setTimeout(() => setPresetTip(null), ms);
  }, []);

  const patchOverride = (patch: Partial<StrategyOverride>) => {
    const prev = getStrategyOverrideForId(settings, selectedId) ?? {};
    const merged: StrategyOverride = { ...prev, ...patch };
    if (patch.instruction === '') delete merged.instruction;
    commitSettings(patchStrategyOverrideForId(settings, selectedId, merged), { immediate: true });
  };

  const resetOverrideField = (field: keyof StrategyOverride) => {
    const prev = { ...(getStrategyOverrideForId(settings, selectedId) ?? {}) };
    delete prev[field];
    commitSettings(
      patchStrategyOverrideForId(settings, selectedId, Object.keys(prev).length > 0 ? prev : null, {
        replace: true,
      }),
      { immediate: true },
    );
  };

  const onSaveUserPreset = async () => {
    const name = newPresetName.trim();
    if (!name) return;
    const preset = buildUserStrategyPresetFromSettings(name, settings);
    const r = await addUserStrategyPreset(preset);
    if (!r.ok) {
      showPresetTip(`最多保存 ${MAX_USER_STRATEGY_PRESETS} 条预设`, 3200);
      return;
    }
    setNewPresetName('');
    await refreshPresets();
    showPresetTip('已保存到本地');
  };

  const onApplyUserPreset = (p: UserStrategyPreset) => {
    try {
      const ov = p.strategyOverride ?? {
        instruction: p.customInstruction,
        temperature: p.customTemperature,
        maxTokens: p.customMaxTokens,
      };
      resolveCustomStrategy(p.customComponents, ov);
    } catch {
      showPresetTip('该预设已失效，请检查覆盖参数后重新保存');
      return;
    }
    commitSettings(applyUserStrategyPresetToSettings(settings, p), { immediate: true });
    showPresetTip('已应用预设', 2400);
  };

  const onRenameUserPreset = async (p: UserStrategyPreset) => {
    const next = window.prompt('预设名称', p.name);
    if (next === null) return;
    const t = next.trim().slice(0, MAX_PRESET_NAME_LEN);
    if (!t) return;
    await updateUserStrategyPresetName(p.id, t);
    await refreshPresets();
    showPresetTip('已重命名');
  };

  const onRemoveUserPreset = async (p: UserStrategyPreset) => {
    if (!window.confirm(`删除预设「${p.name}」？`)) return;
    await removeUserStrategyPreset(p.id);
    await refreshPresets();
    showPresetTip('已删除');
  };

  const defaultInstruction = useMemo(() => {
    const styleKey = settings.outputStyle;
    return activeResolved.stylePrompts[styleKey] ?? activeResolved.stylePrompts['natural-zh'];
  }, [activeResolved, settings.outputStyle]);

  const savedInstruction = readReplaceInstruction(settings, selectedId);
  const instructionText = savedInstruction || defaultInstruction;
  const isNative = selectedId === 'native';
  const isCustom = selectedId === 'custom';

  const instructionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    syncTextareaHeight(instructionTextareaRef.current);
  }, [instructionText, selectedId]);

  return (
    <div className="space-y-6">
      <SettingsSection title="策略版本" description={sectionDescription} descriptionInline>
        <StrategySelect
          id="strategy-select"
          settings={settings}
          value={selectedId}
          presets={userPresets}
          onSelectBuiltin={(id) =>
            commitSettings(applyPromptStrategyChange(settings, id), { immediate: true })
          }
          onSelectPreset={onApplyUserPreset}
        />
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  温度
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-zinc-400">
                    {effectiveTemp.toFixed(2)}
                  </span>
                  {selectedOverride?.temperature != null && (
                    <button
                      type="button"
                      onClick={() => resetOverrideField('temperature')}
                      className={RESET_BTN}
                    >
                      重置
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effectiveTemp}
                onChange={(e) => patchOverride({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                <span>0.0（稳定）</span>
                <span>1.0（发散）</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Token 上限
                </label>
                {selectedOverride?.maxTokens != null && (
                  <button
                    type="button"
                    onClick={() => resetOverrideField('maxTokens')}
                    className={RESET_BTN}
                  >
                    重置
                  </button>
                )}
              </div>
              <input
                type="number"
                className="input text-xs font-mono w-full"
                min={256}
                max={8192}
                step={128}
                value={effectiveMaxTokens}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 256) patchOverride({ maxTokens: v });
                }}
              />
            </div>
          </div>

          {!isNative && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  替换系统指令
                </label>
                {selectedOverride?.instruction && (
                  <button
                    type="button"
                    onClick={() => resetOverrideField('instruction')}
                    className={RESET_BTN}
                  >
                    重置
                  </button>
                )}
              </div>
              <textarea
                ref={instructionTextareaRef}
                className={cx(
                  'input-prompt min-h-[160px] resize-none overflow-hidden font-mono text-[12px] leading-[1.6] w-full',
                )}
                placeholder="例如：整段替换为自写反推指令，注重画面氛围与光影。"
                value={instructionText}
                onChange={(e) => {
                  syncTextareaHeight(e.currentTarget);
                  commitSettings(writeReplaceInstruction(settings, e.target.value, selectedId));
                }}
              />
              <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {REPLACE_INSTRUCTION_HINT}
              </p>
              {briefCustomPromptSummary(settings, selectedId) && (
                <p className="text-[10px] text-zinc-500">
                  {briefCustomPromptSummary(settings, selectedId)}
                </p>
              )}
            </div>
          )}

          {isCustom && (
            <div className="border-t border-zinc-100 pt-5 space-y-4 dark:border-zinc-800/80">
              <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                我的策略配置
              </div>
              {presetTip && (
                <div className="text-[11px] text-violet-600 dark:text-violet-400">{presetTip}</div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="input text-xs flex-1 min-w-0"
                  placeholder="新预设名称"
                  maxLength={MAX_PRESET_NAME_LEN}
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  disabled={!newPresetName.trim()}
                  onClick={() => void onSaveUserPreset()}
                >
                  保存当前为预设
                </Button>
              </div>
              <p className="text-[10px] text-zinc-400 leading-snug">
                快照包含当前档覆盖（温度 / Token / 替换指令）。最多 {MAX_USER_STRATEGY_PRESETS} 条。
              </p>
              {userPresets.length === 0 ? (
                <p className="text-[10px] text-zinc-400">暂无已保存的预设。</p>
              ) : (
                <ul className="space-y-2">
                  {userPresets.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg border border-zinc-200/90 dark:border-zinc-700/90"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {new Date(p.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => void onRenameUserPreset(p)}
                        >
                          重命名
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="xs"
                          onClick={() => void onRemoveUserPreset(p)}
                        >
                          删除
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
