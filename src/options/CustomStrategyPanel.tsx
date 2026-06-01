import { useCallback, useEffect, useState } from 'react';
import {
  addUserStrategyPreset,
  applyUserStrategyPresetToSettings,
  buildUserStrategyPresetFromSettings,
  getUserStrategyPresets,
  DEFAULT_CUSTOM_COMPONENTS,
  MAX_USER_STRATEGY_PRESETS,
  MAX_PRESET_NAME_LEN,
  removeUserStrategyPreset,
  updateUserStrategyPresetName,
} from '@/lib/storage';
import {
  resolveCustomStrategy,
  STYLE_PROMPT_SETS,
  SAMPLING_PROFILES,
  CUSTOM_JOINS,
} from '@/lib/strategies';
import type {
  StylePromptSetVersion,
  SamplingVersion,
  CustomJoinVersion,
  StrategyComponents,
} from '@/lib/strategies-meta';
import type { AppSettings, UserStrategyPreset } from '@/lib/types';
import { briefCustomPromptSummary } from './customPromptEditor';

const STYLE_PROMPT_SET_LABELS: Record<StylePromptSetVersion, string> = {
  'v0.1.0': 'v0.1.0 — 基线指令，7 个抽象方面自由组织',
  'v0.2.2': 'v0.2.2 — 10 维度显式清单 + 三禁 + 空槽位跳过',
  'v0.3.0': 'v0.3.0 — 8 维度分句 / 具名风格锚定 / 摄影参数',
  'v0.3.5': 'v0.3.5 — 按图结构 3–8 段 / 中文自然语言+参数 / 只出正文',
  'v0.3.6': 'v0.3.6 — 通用高还原 / 关键锚点 / 图片多图视频成套优化',
  v_native: 'v_native — 极简直出 · 图像直送 VLM · 「原生识别」策略下不参与输出风格四档',
};

const SAMPLING_LABELS: Record<SamplingVersion, string> = {
  'v0.1.0': 'v0.1.0 — temperature 0.4 · max_tokens 1024',
  'v0.2.2': 'v0.2.2 — temperature 0.3 · max_tokens 1280',
  'v0.3.0': 'v0.3.0 — temperature 0.3 · max_tokens 1536',
};

const CUSTOM_JOIN_LABELS: Record<CustomJoinVersion, string> = {
  'v0.1.0': 'v0.1.0 — 自定义模板尾部追加',
  'v0.2.2': 'v0.2.2 — 自定义模板前置',
  'v0.3.0': 'v0.3.0 — 自定义模板前置',
};

interface Props {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

export default function CustomStrategyPanel({ settings, setSettings }: Props) {
  const [presets, setPresets] = useState<UserStrategyPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [presetTip, setPresetTip] = useState<string | null>(null);

  const refreshPresets = useCallback(async () => {
    setPresets(await getUserStrategyPresets());
  }, []);

  useEffect(() => {
    void refreshPresets();
  }, [refreshPresets]);

  const showPresetTip = useCallback((msg: string, ms = 2400) => {
    setPresetTip(msg);
    window.setTimeout(() => setPresetTip(null), ms);
  }, []);

  const comp = settings.customComponents ?? DEFAULT_CUSTOM_COMPONENTS;
  const customPromptSummary = briefCustomPromptSummary(settings);

  const updateComp = (patch: Partial<StrategyComponents>) => {
    setSettings({
      ...settings,
      customComponents: { ...comp, ...patch },
    });
  };

  const sm =
    SAMPLING_PROFILES[comp.sampling] ?? SAMPLING_PROFILES[DEFAULT_CUSTOM_COMPONENTS.sampling];
  const cj = CUSTOM_JOINS[comp.customJoin] ?? CUSTOM_JOINS[DEFAULT_CUSTOM_COMPONENTS.customJoin];
  const effectiveTemp = settings.customTemperature ?? sm.temperature;
  const effectiveMaxTokens = settings.customMaxTokens ?? sm.maxTokens;

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
      resolveCustomStrategy(p.customComponents, {
        instruction: p.customInstruction,
        temperature: p.customTemperature,
        maxTokens: p.customMaxTokens,
      });
    } catch {
      showPresetTip('该预设引用的组件版本已失效，请在自定义组合中修正后重新保存');
      return;
    }
    setSettings(applyUserStrategyPresetToSettings(settings, p));
    showPresetTip('已应用到当前编辑区，请点击右上角「保存设置」同步', 4000);
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

  const styleDetail = STYLE_PROMPT_SET_LABELS[comp.stylePromptSet];
  const samplingDetail = SAMPLING_LABELS[comp.sampling];
  const joinDetail = CUSTOM_JOIN_LABELS[comp.customJoin];

  return (
    <div className="shrink-0 border border-t-0 border-violet-500 rounded-b-xl bg-violet-50/50 dark:bg-violet-500/5 p-4 space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
            指令集版本
          </label>
          <select
            className="input text-xs"
            value={comp.stylePromptSet}
            onChange={(e) =>
              updateComp({ stylePromptSet: e.target.value as StylePromptSetVersion })
            }
          >
            {(Object.keys(STYLE_PROMPT_SETS) as StylePromptSetVersion[]).map((v) => (
              <option key={v} value={v} title={STYLE_PROMPT_SET_LABELS[v]}>
                {v}
              </option>
            ))}
          </select>
          {styleDetail && (
            <p className="mt-1 text-[10px] text-zinc-400 leading-snug">{styleDetail}</p>
          )}
        </div>
        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
            采样参数
          </label>
          <select
            className="input text-xs"
            value={comp.sampling}
            onChange={(e) => updateComp({ sampling: e.target.value as SamplingVersion })}
          >
            {(Object.keys(SAMPLING_PROFILES) as SamplingVersion[]).map((v) => (
              <option key={v} value={v} title={SAMPLING_LABELS[v]}>
                {v}
              </option>
            ))}
          </select>
          {samplingDetail && (
            <p className="mt-1 text-[10px] text-zinc-400 leading-snug">{samplingDetail}</p>
          )}
        </div>
        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
            拼接方式
          </label>
          <select
            className="input text-xs"
            value={comp.customJoin}
            onChange={(e) => updateComp({ customJoin: e.target.value as CustomJoinVersion })}
          >
            {(Object.keys(CUSTOM_JOINS) as CustomJoinVersion[]).map((v) => (
              <option key={v} value={v} title={CUSTOM_JOIN_LABELS[v]}>
                {v}
              </option>
            ))}
          </select>
          {joinDetail && (
            <p className="mt-1 text-[10px] text-zinc-400 leading-snug">{joinDetail}</p>
          )}
        </div>
      </div>

      <div className="text-[10px] text-zinc-400 font-mono">
        temperature {effectiveTemp} · max_tokens {effectiveMaxTokens} ·{' '}
        {settings.customInstruction ? '自定义指令' : `指令集@${comp.stylePromptSet}`} ·{' '}
        {cj === 'prepend' ? '自定义前置' : '自定义追加'}
      </div>

      {customPromptSummary && (
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug">
          自定义提示词（{customPromptSummary}）请在「输出与交互」中编辑；可切换追加或替换系统指令。
        </p>
      )}

      <div className="border-t border-violet-200 dark:border-violet-500/20 pt-3 space-y-3">
        <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">高级覆盖</div>
        <p className="text-[10px] text-zinc-400 leading-snug">
          系统指令正文（追加 / 替换）统一在「输出与交互 → 自定义提示词」配置。此处仅覆盖采样参数。
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                温度
                <span className="ml-2 font-mono text-zinc-400">{effectiveTemp.toFixed(2)}</span>
                {settings.customTemperature != null && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, customTemperature: undefined })}
                    className="ml-2 text-violet-500 hover:underline"
                  >
                    重置
                  </button>
                )}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effectiveTemp}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customTemperature: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                <span>0.0（稳定）</span>
                <span>1.0（发散）</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block mb-1">
                Token 上限
                {settings.customMaxTokens != null && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, customMaxTokens: undefined })}
                    className="ml-2 text-violet-500 hover:underline"
                  >
                    重置
                  </button>
                )}
              </label>
              <input
                type="number"
                className="input text-xs font-mono"
                min={256}
                max={8192}
                step={128}
                value={effectiveMaxTokens}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 256) {
                    setSettings({ ...settings, customMaxTokens: v });
                  }
                }}
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 leading-snug">
            覆盖值仅在选中「自定义组合」策略时生效。重置后将退回到上方采样参数版本的默认值。
          </p>
        </div>
      </div>

      <div className="border-t border-violet-200 dark:border-violet-500/20 pt-3 space-y-3">
        <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">我的策略配置</div>
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
          <button
            type="button"
            className="btn-ghost text-xs py-2 shrink-0 justify-center"
            disabled={!newPresetName.trim()}
            onClick={() => void onSaveUserPreset()}
          >
            保存当前为预设
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 leading-snug">
          快照包含上方组件版本、高级覆盖（温度 /
          Token），以及「输出与交互」中的自定义提示词（追加或替换）。最多{' '}
          {MAX_USER_STRATEGY_PRESETS} 条。
        </p>
        {presets.length === 0 ? (
          <p className="text-[10px] text-zinc-400">暂无已保存的预设。</p>
        ) : (
          <ul className="space-y-2">
            {presets.map((p) => (
              <li
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200/90 dark:border-zinc-700/90"
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
                  <button
                    type="button"
                    className="btn-primary text-[11px] py-1.5 px-3"
                    onClick={() => onApplyUserPreset(p)}
                  >
                    应用
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-[11px] py-1.5 px-3 border border-zinc-200 dark:border-zinc-600"
                    onClick={() => void onRenameUserPreset(p)}
                  >
                    重命名
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-[11px] py-1.5 px-3 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                    onClick={() => void onRemoveUserPreset(p)}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
