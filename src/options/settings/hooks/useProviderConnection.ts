import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROVIDER_LIST, PROVIDERS } from '@/lib/providers';
import { migrateProviderSlot } from '@/lib/storage';
import { inferProviderFromModelList } from '@/lib/providerIdFromModel';
import type { AppSettings, ProviderConfig, ProviderId } from '@/lib/types';
import { classifyModel } from '@/lib/modelVision';
import { applyAutoModelPickToDraft } from '@/lib/modelPick';
import { listModels } from '@/lib/api';
import type { ModelPickerHandle } from '../../ModelPicker';
import { resolveEffectiveRefineModel, resolveEffectiveRefineProvider } from '@/lib/providerRoles';
import { readInitialProviderRole, type ProviderRole, type SettingsPanelId } from '../types';

function providerAuthKey(_pid: ProviderId, cfg: ProviderConfig): string {
  return (cfg.apiKey ?? '').trim();
}

function providerAuthSig(pid: ProviderId, cfg: ProviderConfig): string {
  return `${providerAuthKey(pid, cfg)}|${cfg.baseUrl ?? ''}`;
}

function hasProviderAuth(_pid: ProviderId, cfg: ProviderConfig): boolean {
  const key = providerAuthKey(_pid, cfg);
  return key.length >= 6 && Boolean(cfg.baseUrl?.trim());
}

interface Options {
  settings: AppSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings | null>>;
  lastSavedSig: string | null;
  dirty: boolean;
  persistAndMark: (next: AppSettings) => Promise<void>;
  settingsRef: React.MutableRefObject<AppSettings | null>;
  panelId: SettingsPanelId;
  onSaved?: () => void;
}

export function useProviderConnection({
  settings,
  setSettings,
  lastSavedSig,
  dirty,
  persistAndMark,
  settingsRef,
  panelId,
  onSaved,
}: Options) {
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchingProviderIds, setFetchingProviderIds] = useState<Set<ProviderId>>(() => new Set());
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);
  const [providerInferenceHint, setProviderInferenceHint] = useState<string | null>(null);  const [providerRole, setProviderRole] = useState<ProviderRole>(readInitialProviderRole);

  const autoFetchedRef = useRef<Map<ProviderId, string>>(new Map());
  const autoPickedFromCacheRef = useRef<Map<ProviderId, string>>(new Map());
  const keyAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelFieldRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<ModelPickerHandle>(null);

  const runFetchModels = useCallback(
    async (pid: ProviderId, cfg: ProviderConfig, sig: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setFetchingModels(true);
        setFetchModelsError(null);
      }
      setFetchingProviderIds((prev) => new Set(prev).add(pid));
      try {
        const result = await listModels(cfg, pid);
        let nextSettings: AppSettings | null = null;
        let inferenceHint: string | null = null;
        setSettings((prev) => {
          if (!prev) return prev;
          const cur = prev.providers[pid];
          const curSig = providerAuthSig(pid, cur);
          if (curSig !== sig) return prev;
          const nextCfg = {
            ...cur,
            discoveredModels: result.ids,
            discoveredVisionById: result.visionById,
            discoveredAt: Date.now(),
          };
          let draft: AppSettings = {
            ...prev,
            providers: { ...prev.providers, [pid]: nextCfg },
          };

          let effectivePid: ProviderId = pid;

          if (pid === 'custom' && result.ids.length > 0) {
            const inferred = inferProviderFromModelList(result.ids, {
              ownedByValues: result.ownedByValues,
            });
            if (inferred?.confidence === 'high' && inferred.providerId !== 'custom') {
              draft = migrateProviderSlot(draft, 'custom', inferred.providerId);
              effectivePid = inferred.providerId;
              autoFetchedRef.current.set(inferred.providerId, sig);
              autoFetchedRef.current.delete('custom');
              const label = PROVIDERS[inferred.providerId].label;
              inferenceHint = `${inferred.reason} 已自动切换到「${label}」；baseUrl 未改动。`;
            } else if (inferred?.confidence === 'medium') {
              const label = PROVIDERS[inferred.providerId].label;
              inferenceHint = `${inferred.reason} 如需可在下方改选「${label}」。`;
            }
          }

          if (result.ids.length > 0) {
            const purpose = providerRole === 'refine' ? 'text' : 'vision';
            const visionMap =
              draft.providers[effectivePid]?.discoveredVisionById ?? result.visionById;
            const auto = applyAutoModelPickToDraft(
              draft,
              effectivePid,
              result.ids,
              visionMap,
              purpose,
            );
            draft = auto.draft;
            if (auto.hint) {
              inferenceHint = inferenceHint ? `${inferenceHint} ${auto.hint}` : auto.hint;
            }
          }

          nextSettings = draft;
          return draft;
        });
        if (inferenceHint) {
          setProviderInferenceHint(inferenceHint);
        }
        if (nextSettings) {
          await persistAndMark(nextSettings);
        }
      } catch (e) {
        const cur = settingsRef.current;
        const editingPid =
          providerRole === 'extract'
            ? cur?.activeProvider
            : cur
              ? resolveEffectiveRefineProvider(cur)
              : undefined;
        if (!options?.silent && editingPid === pid) {
          setFetchModelsError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setFetchingProviderIds((prev) => {
          const next = new Set(prev);
          next.delete(pid);
          return next;
        });
        if (!options?.silent) {
          setFetchingModels(false);
        }
      }
    },
    [persistAndMark, providerRole, setSettings, settingsRef],
  );
  useEffect(() => {
    setFetchModelsError(null);
    if (keyAutosaveTimerRef.current) {
      clearTimeout(keyAutosaveTimerRef.current);
      keyAutosaveTimerRef.current = null;
    }
  }, [settings?.activeProvider, settings?.refineProvider, providerRole]);

  const editingProviderId: ProviderId | undefined = settings
    ? providerRole === 'extract'
      ? settings.activeProvider
      : resolveEffectiveRefineProvider(settings)
    : undefined;
  const editingApiKey =
    editingProviderId != null ? (settings?.providers[editingProviderId]?.apiKey ?? '') : '';
  const editingBaseUrl =
    editingProviderId != null ? (settings?.providers[editingProviderId]?.baseUrl ?? '') : '';

  useEffect(() => {
    if (!settings || lastSavedSig === null || !editingProviderId) return;
    const pid = editingProviderId;
    const key = editingApiKey.trim();
    if (key.length < 6) return;

    let savedKey = '';
    try {
      const saved = JSON.parse(lastSavedSig) as AppSettings;
      savedKey = saved.providers[pid]?.apiKey?.trim() ?? '';
    } catch {
      /* ignore */
    }
    if (savedKey === key) return;

    if (keyAutosaveTimerRef.current) clearTimeout(keyAutosaveTimerRef.current);
    keyAutosaveTimerRef.current = setTimeout(() => {
      const cur = settingsRef.current;
      if (!cur) return;
      const curEditing =
        providerRole === 'extract' ? cur.activeProvider : resolveEffectiveRefineProvider(cur);
      if (curEditing !== pid) return;
      const curKey = cur.providers[pid]?.apiKey?.trim() ?? '';
      if (curKey.length < 6 || curKey !== key) return;
      void persistAndMark(cur);
    }, 800);

    return () => {
      if (keyAutosaveTimerRef.current) {
        clearTimeout(keyAutosaveTimerRef.current);
        keyAutosaveTimerRef.current = null;
      }
    };
  }, [
    editingApiKey,
    editingProviderId,
    lastSavedSig,
    persistAndMark,
    providerRole,
    settings,
    settingsRef,
  ]);

  useEffect(() => {
    if (!settings || !editingProviderId) return;
    const pid = editingProviderId;
    const cfg = settings.providers[pid];
    if (!hasProviderAuth(pid, cfg)) return;

    const sig = providerAuthSig(pid, cfg);
    if (!autoFetchedRef.current.has(pid) && (cfg.discoveredModels?.length ?? 0) > 0) {
      autoFetchedRef.current.set(pid, sig);
      const discovered = cfg.discoveredModels ?? [];
      const currentModel =
        providerRole === 'refine' ? resolveEffectiveRefineModel(settings) : cfg.model;
      const purpose = providerRole === 'refine' ? 'text' : 'vision';
      const cacheKey = `${sig}|${currentModel}`;
      if (discovered.length > 0 && autoPickedFromCacheRef.current.get(pid) !== cacheKey) {
        const visionMap = cfg.discoveredVisionById ?? {};
        const auto = applyAutoModelPickToDraft(settings, pid, discovered, visionMap, purpose);
        if (auto.hint) {
          autoPickedFromCacheRef.current.set(pid, cacheKey);
          void persistAndMark(auto.draft).then(() => {
            setSettings(auto.draft);
            setProviderInferenceHint(auto.hint);
          });
        }
      }
      return;
    }
    if (autoFetchedRef.current.get(pid) === sig) return;
    if (fetchingModels) return;

    const timer = setTimeout(() => {
      autoFetchedRef.current.set(pid, sig);
      void runFetchModels(pid, cfg, sig);
    }, 1000);
    return () => clearTimeout(timer);
    // 刻意省略 setSettings：1s 防抖自动拉模型，不应因 setSettings 引用变化重置定时器
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced auto-fetch signature
  }, [
    editingProviderId,
    editingApiKey,
    editingBaseUrl,    runFetchModels,
    settings,
    fetchingModels,
    providerRole,
    persistAndMark,
  ]);

  useEffect(() => {
    if (!settings || panelId !== 'provider') return;

    const queue = (Object.keys(settings.providers) as ProviderId[]).filter((pid) => {
      const cfg = settings.providers[pid];
      if (!hasProviderAuth(pid, cfg)) return false;
      const sig = providerAuthSig(pid, cfg);
      if (autoFetchedRef.current.get(pid) === sig) return false;
      return true;
    });

    if (queue.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const pid of queue) {
        if (cancelled) break;
        const cfg = settings.providers[pid];
        const sig = providerAuthSig(pid, cfg);
        autoFetchedRef.current.set(pid, sig);
        await runFetchModels(pid, cfg, sig, { silent: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [panelId, settings, runFetchModels]);

  const discoveredModelsCount =
    settings && editingProviderId
      ? (settings.providers[editingProviderId]?.discoveredModels?.length ?? 0)
      : 0;

  const focusModelField = useCallback(() => {
    modelFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (discoveredModelsCount > 0) {
      modelPickerRef.current?.open();
      return;
    }
    const input = modelFieldRef.current?.querySelector('input');
    if (input instanceof HTMLInputElement) {
      input.focus();
    }
  }, [discoveredModelsCount]);

  const panelProps = useMemo(() => {
    if (!settings || !editingProviderId) return null;

    const editingMeta = PROVIDERS[editingProviderId];
    const editingCfg = settings.providers[editingProviderId];
    if (!editingCfg) return null;

    const discovered = editingCfg.discoveredModels ?? [];
    const discoveredVision = editingCfg.discoveredVisionById ?? {};
    const refineModelValue = resolveEffectiveRefineModel(settings);
    const editingModelValue =
      providerRole === 'refine' ? refineModelValue : (editingCfg.model ?? '');

    const manualModelVision =
      providerRole === 'extract' &&
      editingCfg.model.trim() &&
      !discovered.includes(editingCfg.model)
        ? classifyModel(editingProviderId, editingCfg.model)
        : null;

    const hasApiKey = Boolean(editingCfg.apiKey && editingCfg.apiKey.trim().length > 0);

    const selectedProviderId: ProviderId =
      providerRole === 'extract'
        ? settings.activeProvider
        : resolveEffectiveRefineProvider(settings);

    const updateEditingCfg = (patch: Partial<ProviderConfig>) => {
      const { model: _model, ...rest } = patch;
      const slotPatch = providerRole === 'refine' ? rest : patch;
      setSettings({
        ...settings,
        providers: {
          ...settings.providers,
          [editingProviderId]: { ...editingCfg, ...slotPatch },
        },
      });
    };

    const updateRefineModel = (model: string) => {
      setSettings({ ...settings, refineModel: model });
    };

    const onFetchModels = async () => {
      const pid = editingProviderId;
      const sig = providerAuthSig(pid, editingCfg);
      autoFetchedRef.current.set(pid, sig);
      await runFetchModels(pid, editingCfg, sig);
    };

    const applyConfig = async (next: AppSettings) => {
      setSettings(next);
      await persistAndMark(next);
      onSaved?.();
    };

    const selectProviderForRole = (nextProvider: ProviderId) => {
      if (providerRole === 'extract') {
        setSettings({ ...settings, activeProvider: nextProvider });
        return;
      }
      if (nextProvider === settings.activeProvider) {
        setSettings({ ...settings, refineProvider: undefined, refineModel: undefined });
        return;
      }
      setSettings({
        ...settings,
        refineProvider: nextProvider,
        refineModel: undefined,
      });
    };

    const onModelChange = (m: string) => {
      if (providerRole === 'refine') {
        updateRefineModel(m);
      } else {
        updateEditingCfg({ model: m });
      }
    };

    return {
      settings,
      providerRole,
      setProviderRole,      fetchingModels,
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
      manualModelVision,      hasApiKey,
      selectedProviderId,
      providerCount: PROVIDER_LIST.length,
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
    };
  }, [
    settings,
    editingProviderId,
    providerRole,    fetchingModels,
    fetchingProviderIds,
    fetchModelsError,
    providerInferenceHint,
    dirty,
    persistAndMark,
    setSettings,
    runFetchModels,
    onSaved,
    focusModelField,
  ]);

  return {
    panelProps,
  };
}

export type ProviderSettingsPanelProps = NonNullable<
  ReturnType<typeof useProviderConnection>['panelProps']
>;
