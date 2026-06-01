import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, RefreshCw } from 'lucide-react';
import { Button, SegmentedControl, cx } from '@/components/ui';
import ApiQuickSetup from '../../ApiQuickSetup';
import ProviderSelect from '../../ProviderSelect';
import ModelPicker from '../../ModelPicker';
import ProviderModelWarning from '../../ProviderModelWarning';
import ProviderVisionSummary from '../../ProviderVisionSummary';
import ProviderQuotaBadge from '@/components/ProviderQuotaBadge';
import ConnectionFieldColumn from '../parts/ConnectionFieldColumn';
import type { ProviderSettingsPanelProps } from '../hooks/useProviderConnection';
import type { SettingsPanelId } from '../types';

interface Props extends ProviderSettingsPanelProps {
  onNavigatePanel: (id: SettingsPanelId) => void;
}

export default function ProviderSettingsPanel({
  settings,
  providerRole,
  setProviderRole,  fetchingModels,
  fetchingProviderIds,
  fetchModelsError,
  providerInferenceHint,
  setProviderInferenceHint,
  editingProviderId,
  editingMeta,
  editingCfg,
  discovered,
  discoveredVision,
  editingModelValue,
  manualModelVision,  hasApiKey,
  selectedProviderId,
  providerCount,
  dirty,
  persistAndMark,
  updateEditingCfg,
  selectProviderForRole,
  onModelChange,
  onFetchModels,
  applyConfig,
  focusModelField,
  modelFieldRef,
  modelPickerRef,
}: Props) {
  const [showKey, setShowKey] = useState(false);

  const fetchModelsButton = (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      onClick={() => void onFetchModels()}
      disabled={fetchingModels || !editingCfg.baseUrl || !hasApiKey}
      title="从该端点 /models 接口拉取所有可用模型"
      className="!px-1.5"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
      <span className="sr-only">{fetchingModels ? '拉取中' : '从端点拉取'}</span>
    </Button>
  );

  const modelColumnControls = (
    <div id="provider-model-field" ref={modelFieldRef} className="min-w-0 space-y-1.5">
      {discovered.length > 0 ? (
        <ModelPicker
          ref={modelPickerRef}
          models={discovered}
          visionById={discoveredVision}
          value={editingModelValue}
          onChange={onModelChange}
          discoveredAt={editingCfg.discoveredAt}
          fetching={fetchingModels}
        />
      ) : (
        <input
          className="input font-mono text-sm"
          value={editingModelValue}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder={editingMeta.defaultModel}
          disabled={fetchingModels}
        />
      )}
      {discovered.length > 0 && !discovered.includes(editingModelValue) && (
        <input
          className="input font-mono text-xs"
          value={editingModelValue}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder="不在列表中可手动输入"
        />
      )}
    </div>
  );

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <SegmentedControl
          fullWidth
          value={providerRole}
          onChange={setProviderRole}
          ariaLabel="API 用途"
          options={[
            { value: 'extract', label: '首选 API' },
            { value: 'refine', label: '次选 API' },
          ]}
        />
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
          {providerRole === 'extract'
            ? '用于右键/面板从图片生成提示词、重新生成。'
            : '用于 AI 调整、一键洗稿等对已生成提示词的文本改写；默认与首选 API 相同，可单独选择供应商或模型。'}
        </p>
      </div>



      <div>
        <label className="label" htmlFor="provider-select">
          模型供应商列表
          <span className="font-normal text-zinc-400 ml-1">（共 {providerCount} 个）</span>
        </label>
        <ProviderSelect
          id="provider-select"
          value={selectedProviderId}
          onChange={selectProviderForRole}
          fetchingIds={fetchingProviderIds}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        
          <ConnectionFieldColumn
            label="API Key"
            labelExtra={
              editingMeta.docsUrl ? (
                <a
                  href={editingMeta.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-500 hover:underline inline-flex items-center gap-1 text-xs whitespace-nowrap"
                >
                  去申请 <ExternalLink className="w-3 h-3" />
                </a>
              ) : undefined
            }
          >
            <div className="relative">
              <input
                className="input pr-10"
                type={showKey ? 'text' : 'password'}
                value={editingCfg.apiKey}
                placeholder="sk-..."
                onChange={(e) => updateEditingCfg({ apiKey: e.target.value })}
                onBlur={() => {
                  const key = editingCfg.apiKey.trim();
                  if (key.length < 6 || !dirty) return;
                  void persistAndMark(settings);
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </ConnectionFieldColumn>
        

        <ConnectionFieldColumn label="Base URL">
          <input
            className="input"
            value={editingCfg.baseUrl}
            onChange={(e) => updateEditingCfg({ baseUrl: e.target.value })}
            placeholder={editingMeta.defaultBaseUrl}
            readOnly={false}
          />
        </ConnectionFieldColumn>

        <ConnectionFieldColumn label="选择模型" labelExtra={fetchModelsButton}>
          {modelColumnControls}
        </ConnectionFieldColumn>
      </div>

              <ApiQuickSetup
          settings={settings}
          role={providerRole}
          applyConfig={applyConfig}
          providerInferenceHint={providerInferenceHint}
          onDismissInferenceHint={() => setProviderInferenceHint(null)}
          onFocusModelField={focusModelField}
        />

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 min-h-[120px] space-y-3">
        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
          模型供应商简介和描述
        </span>
        {editingMeta.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {editingMeta.description}
          </p>
        )}
        {editingMeta.streamingNote && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-snug">
            {editingMeta.streamingNote}
          </p>
        )}
        {providerRole === 'refine' && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
            建议使用响应快、成本低的文本模型。
            {!settings.refineProvider || settings.refineProvider === settings.activeProvider
              ? ' 默认与首选相同；修改此处模型后将单独用于 AI 调整，不会改动识图反推所用模型。'
              : ''}
          </p>
        )}
        {editingProviderId && (
          <ProviderVisionSummary
            providerId={editingProviderId}
            cfg={editingCfg}
            expanded={providerRole === 'extract'}
          />
        )}
        {providerRole === 'extract' && (
          <ProviderModelWarning
            providerId={editingProviderId}
            model={editingCfg.model}
            visionById={discoveredVision}
          />
        )}
        {manualModelVision && (
          <p
            className={cx(
              'text-[11px] leading-snug',
              manualModelVision.vision === 'vision'
                ? 'text-emerald-600 dark:text-emerald-400'
                : manualModelVision.vision === 'unknown'
                  ? 'text-zinc-500 dark:text-zinc-400'
                  : 'text-amber-700 dark:text-amber-300',
            )}
          >
            {manualModelVision.vision === 'vision'
              ? '该模型 id 可能支持识图'
              : manualModelVision.vision === 'unknown'
                ? '未能确认是否支持识图，可直接试用反推'
                : '该模型 id 可能不支持识图，反推时易失败'}
          </p>
        )}
        {fetchModelsError && (
          <div className="text-[11px] leading-snug px-2.5 py-1.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 whitespace-pre-wrap break-words">
            {fetchModelsError}
          </div>
        )}
        {hasApiKey && discovered.length === 0 && !fetchingModels && (
          <p className="text-[11px] text-zinc-400 leading-snug">
            填写 Key 后将自动从端点拉取模型；也可在「选择模型」旁点拉取图标
          </p>
        )}
        {hasApiKey && <ProviderQuotaBadge providerId={editingProviderId} />}
      </div>
    </section>
  );
}
