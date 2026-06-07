import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button, cx, Field, PasswordInput } from '@/components/ui';
import { listModels } from '@/lib/api';
import { applyAutoModelPickToDraft, shouldHighlightFetchModelsButton } from '@/lib/modelPick';
import { PROVIDERS } from '@/lib/providers';
import type { AppSettings, ProviderConfig, ProviderId } from '@/lib/types';
import ProviderSelect from '@/options/ProviderSelect';
import { ModelSelectorField } from '@/options/ModelSelectorField';

interface Props {
  settings: AppSettings;
  providerId: ProviderId;
  onProviderChange: (id: ProviderId) => void;
  onPatchProvider: (pid: ProviderId, patch: Partial<ProviderConfig>) => void;
  onSaveProvider: (pid: ProviderId) => Promise<void>;
  onPersistSettings: (next: AppSettings) => Promise<void>;
  onSaved?: () => void;
}

export default function CustomApiPane({
  settings,
  providerId,
  onProviderChange,
  onPatchProvider,
  onSaveProvider,
  onPersistSettings,
  onSaved,
}: Props) {
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const autoFetchedSigRef = useRef<string | null>(null);

  const meta = PROVIDERS[providerId];
  const cfg = settings.providers[providerId];
  const discovered = cfg.discoveredModels ?? [];
  const discoveredVision = cfg.discoveredVisionById ?? {};
  const hasApiKey = Boolean(cfg.apiKey?.trim());
  const authSig = `${cfg.apiKey?.trim() ?? ''}|${cfg.baseUrl?.trim() ?? ''}`;
  const canSave = (cfg.apiKey?.trim().length ?? 0) >= 6 && Boolean(cfg.baseUrl?.trim());
  const shouldHighlightFetchModels = shouldHighlightFetchModelsButton(
    providerId,
    cfg.model,
    discovered,
    { fetching: fetchingModels },
  );

  const onSaveConfig = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSaveProvider(providerId);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const onFetchModels = useCallback(
    async (options?: { silent?: boolean }) => {
      const key = cfg.apiKey?.trim() ?? '';
      if (key.length < 6 || !cfg.baseUrl?.trim()) return;
      if (!options?.silent) {
        setFetchingModels(true);
        setFetchModelsError(null);
      }
      try {
        const result = await listModels(cfg, providerId);
        const nextCfg: ProviderConfig = {
          ...cfg,
          discoveredModels: result.ids,
          discoveredVisionById: result.visionById,
          discoveredAt: Date.now(),
        };
        let next: AppSettings = {
          ...settings,
          providers: { ...settings.providers, [providerId]: nextCfg },
        };
        if (result.ids.length > 0) {
          const auto = applyAutoModelPickToDraft(
            next,
            providerId,
            result.ids,
            result.visionById,
            'vision',
            { entries: result.entries, force: true },
          );
          next = auto.draft;
        }
        await onPersistSettings(next);
      } catch (e) {
        if (!options?.silent) {
          setFetchModelsError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!options?.silent) {
          setFetchingModels(false);
        }
      }
    },
    [cfg, onPersistSettings, providerId, settings],
  );

  useEffect(() => {
    const key = cfg.apiKey?.trim() ?? '';
    if (key.length < 6 || !cfg.baseUrl?.trim()) {
      autoFetchedSigRef.current = null;
      return;
    }
    if (autoFetchedSigRef.current === authSig) return;
    const timer = setTimeout(() => {
      autoFetchedSigRef.current = authSig;
      void onFetchModels({ silent: true });
    }, 1000);
    return () => clearTimeout(timer);
  }, [authSig, cfg.apiKey, cfg.baseUrl, onFetchModels]);

  const onModelChange = (model: string) => {
    onPatchProvider(providerId, { model });
    void onPersistSettings({
      ...settings,
      providers: {
        ...settings.providers,
        [providerId]: { ...cfg, model },
      },
    });
  };

  return (
    <div className="space-y-3">
      <Field label="服务商" className="text-[11px] [&_label]:text-[11px]">
        <ProviderSelect
          id="popup-provider-select"
          value={providerId}
          onChange={onProviderChange}
          fetchingIds={fetchingModels ? new Set([providerId]) : undefined}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="API Key"
          className="min-w-0 text-[11px] [&_label]:text-[11px]"
          action={
            meta.docsUrl ? (
              <a
                href={meta.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-violet-500 hover:underline inline-flex items-center gap-1 text-[11px] whitespace-nowrap"
              >
                去申请 <ExternalLink className="w-3 h-3" />
              </a>
            ) : undefined
          }
        >
          <PasswordInput
            className="text-sm"
            value={cfg.apiKey}
            placeholder="sk-..."
            onChange={(e) => onPatchProvider(providerId, { apiKey: e.target.value })}
          />
        </Field>

        <Field label="Base URL" className="min-w-0 text-[11px] [&_label]:text-[11px]">
          <input
            className="input text-sm"
            value={cfg.baseUrl}
            placeholder={meta.defaultBaseUrl}
            onChange={(e) => onPatchProvider(providerId, { baseUrl: e.target.value })}
            onBlur={() =>
              void onPersistSettings({
                ...settings,
                providers: {
                  ...settings.providers,
                  [providerId]: { ...cfg, baseUrl: cfg.baseUrl },
                },
              })
            }
          />
        </Field>
      </div>

      <Field
        label="模型"
        className="min-w-0 text-[11px] [&_label]:text-[11px]"
        action={
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => void onFetchModels()}
            disabled={fetchingModels || !cfg.baseUrl || !hasApiKey}
            title={
              shouldHighlightFetchModels
                ? '已拉取到可用模型，点击应用最新模型'
                : '从该端点 /models 接口拉取所有可用模型'
            }
            className={cx('!px-1.5', shouldHighlightFetchModels && 'ui-fetch-models-highlight')}
          >
            <RefreshCw className={cx('w-3.5 h-3.5', fetchingModels && 'animate-spin')} />
            <span className="sr-only">{fetchingModels ? '拉取中' : '拉取模型'}</span>
            <span className="text-[11px] ml-1">拉取模型</span>
          </Button>
        }
      >
        <ModelSelectorField
          value={cfg.model}
          onChange={onModelChange}
          onBlur={() =>
            void onPersistSettings({
              ...settings,
              providers: {
                ...settings.providers,
                [providerId]: { ...cfg, model: cfg.model },
              },
            })
          }
          discovered={discovered}
          discoveredVision={discoveredVision}
          discoveredAt={cfg.discoveredAt}
          fetching={fetchingModels}
          fetchError={fetchModelsError}
          defaultModel={meta.defaultModel}
          mono
        />
      </Field>

      <div className="pt-1 flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!canSave || saving}
          onClick={() => void onSaveConfig()}
        >
          {saving ? '保存中…' : '保存配置'}
        </Button>
      </div>
    </div>
  );
}
