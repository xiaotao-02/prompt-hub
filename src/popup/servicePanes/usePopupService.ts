import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';
import { SETTINGS_KEY } from '@/lib/storage/keys';
import { PROVIDERS } from '@/lib/providers';
import type { AppSettings, ProviderConfig, ProviderId } from '@/lib/types';

export function collapsedSummary(settings: AppSettings): string {
  const pid = settings.activeProvider;
  const label = PROVIDERS[pid]?.label ?? pid;
  const hasKey = Boolean(settings.providers[pid]?.apiKey?.trim());
  return `${label} · ${hasKey ? '已配置 Key' : '未配置 Key'}`;
}

export function headerSummary(settings: AppSettings): string {
  return PROVIDERS[settings.activeProvider]?.label ?? settings.activeProvider;
}

export function isCustomProviderConfigured(settings: AppSettings): boolean {
  const key = settings.providers[settings.activeProvider]?.apiKey?.trim() ?? '';
  return key.length >= 6;
}

export function hasAnyCustomProviderConfigured(settings: AppSettings): boolean {
  for (const [, cfg] of Object.entries(settings.providers)) {
    const key = cfg?.apiKey?.trim() ?? '';
    if (key.length >= 6) return true;
  }
  return false;
}

export function usePopupService() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const settingsRef = useRef<AppSettings | null>(null);

  const loadSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    settingsRef.current = s;
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area === 'sync' && SETTINGS_KEY in changes) {
        void loadSettings();
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [loadSettings]);

  const persistSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    settingsRef.current = next;
    await saveSettings(next);
  }, []);

  const patchProvider = useCallback((pid: ProviderId, patch: Partial<ProviderConfig>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const cfg = prev.providers[pid];
      const next = {
        ...prev,
        providers: { ...prev.providers, [pid]: { ...cfg, ...patch } },
      };
      settingsRef.current = next;
      return next;
    });
  }, []);

  const saveProviderFromRef = useCallback(async (_pid: ProviderId) => {
    const cur = settingsRef.current;
    if (!cur) return;
    await saveSettings(cur);
  }, []);

  const onCustomProviderChange = useCallback(
    async (id: ProviderId) => {
      const cur = settingsRef.current;
      if (!cur) return;
      await persistSettings({ ...cur, activeProvider: id });
    },
    [persistSettings],
  );

  const customProviderId = settings?.activeProvider ?? 'openai';

  const isConfigured = useMemo(() => {
    if (!settings) return false;
    return hasAnyCustomProviderConfigured(settings);
  }, [settings]);

  const summary = settings ? collapsedSummary(settings) : '加载中…';
  const headerLabel = settings ? headerSummary(settings) : '…';

  return {
    settings,
    mode: 'custom' as const,
    customProviderId,
    isConfigured,
    summary,
    headerSummary: headerLabel,
    onCustomProviderChange,
    patchProvider,
    saveProviderFromRef,
    persistSettings,
    platformLoggedIn: false,
    onModeChange: async () => {},
    onLoginSuccess: () => {},
  };
}

export type PopupServiceState = ReturnType<typeof usePopupService>;
