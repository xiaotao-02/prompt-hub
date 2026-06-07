import { ExternalLink, RefreshCw } from 'lucide-react';
import { normalizeOpenAIBase } from '@/lib/api/url';
import { Button, PasswordInput, SegmentedControl, cx } from '@/components/ui';
import ApiQuickSetup from '../../ApiQuickSetup';
import ProviderSelect from '../../ProviderSelect';
import { ModelSelectorField } from '../../ModelSelectorField';
import ProviderModelWarning from '../../ProviderModelWarning';
import ProviderVisionSummary from '../../ProviderVisionSummary';
import ProviderQuotaBadge from '@/components/ProviderQuotaBadge';
import ConnectionFieldColumn from '../parts/ConnectionFieldColumn';
import { SettingsSection } from '../parts/SettingsSection';
import type { ProviderSettingsPanelProps } from '../hooks/useProviderConnection';

export default function ProviderSettingsPanel({
  settings,
  providerRole,
  setProviderRole,
  fetchingModels,
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
  manualModelVision,
  hasApiKey,
  selectedProviderId,
  providerCount,
  updateEditingCfg,
  selectProviderForRole,
  onModelChange,
  onFetchModels,
  shouldHighlightFetchModels,
  applyConfig,
  focusModelField,
  modelFieldRef,
  modelPickerRef,
}: ProviderSettingsPanelProps) {
  const fetchModelsButton = (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      onClick={() => void onFetchModels()}
      disabled={fetchingModels || !editingCfg.baseUrl || !hasApiKey}
      title={
        shouldHighlightFetchModels
          ? '已拉取到可用模型，点击应用最新模型'
          : '从该端点 /models 接口拉取所有可用模型'
      }
      className={cx('!px-1.5', shouldHighlightFetchModels && 'ui-fetch-models-highlight')}
      aria-label={fetchingModels ? '拉取中' : '拉取模型'}
    >
      <RefreshCw className={cx('w-3.5 h-3.5', fetchingModels && 'animate-spin')} />
      <span className="sr-only">{fetchingModels ? '拉取中' : '拉取模型'}</span>
      <span className="text-[11px] ml-1">拉取模型</span>
    </Button>
  );

  const modelColumnControls = (
    <ModelSelectorField
      id="provider-model-field"
      containerRef={modelFieldRef}
      value={editingModelValue}
      onChange={onModelChange}
      discovered={discovered}
      discoveredVision={discoveredVision}
      discoveredAt={editingCfg.discoveredAt}
      fetching={fetchingModels}
      defaultModel={editingMeta.defaultModel}
      modelPickerRef={modelPickerRef}
    />
  );

  return (
    <section className="space-y-4">
      <SettingsSection
        title={
          <>
            模型供应商
            <span className="font-normal text-zinc-400 ml-1">（共 {providerCount} 个）</span>
          </>
        }
      >
        <ProviderSelect
          id="provider-select"
          value={selectedProviderId}
          onChange={selectProviderForRole}
          fetchingIds={fetchingProviderIds}
        />
      </SettingsSection>

      <section className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
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
            <PasswordInput
              value={editingCfg.apiKey}
              placeholder="sk-..."
              onChange={(e) => updateEditingCfg({ apiKey: e.target.value })}
            />
          </ConnectionFieldColumn>

          <ConnectionFieldColumn label="Base URL">
            <input
              className="input"
              value={editingCfg.baseUrl}
              onChange={(e) => updateEditingCfg({ baseUrl: e.target.value })}
              onBlur={(e) => {
                const next = normalizeOpenAIBase(e.target.value);
                if (next && next !== editingCfg.baseUrl) {
                  updateEditingCfg({ baseUrl: next });
                }
              }}
              placeholder={editingMeta.defaultBaseUrl}
            />
          </ConnectionFieldColumn>
        </div>
      </section>

      <SettingsSection
        title="模型选择"
        description={
          providerRole === 'extract'
            ? '用于右键/面板从图片生成提示词、重新生成。'
            : '用于 AI 调整、文本改写，选择低级模型省算力。'
        }
        descriptionInline
        trailing={
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <SegmentedControl
              value={providerRole}
              onChange={setProviderRole}
              ariaLabel="模型用途"
              options={[
                { value: 'extract', label: '反推模型' },
                { value: 'refine', label: '改写模型' },
              ]}
            />
            {fetchModelsButton}
          </div>
        }
      >
        {modelColumnControls}
      </SettingsSection>

      <ApiQuickSetup
        settings={settings}
        role={providerRole}
        applyConfig={applyConfig}
        providerInferenceHint={providerInferenceHint}
        onDismissInferenceHint={() => setProviderInferenceHint(null)}
        onFocusModelField={focusModelField}
      />

      <SettingsSection title="模型供应商简介">
        {editingMeta.description && (
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
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
            填写 Key 后将自动从端点拉取模型；也可在「模型选择」旁点拉取图标
          </p>
        )}
        {hasApiKey && <ProviderQuotaBadge providerId={editingProviderId} />}
      </SettingsSection>
    </section>
  );
}
