import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';
import { SETTINGS_KEY } from '@/lib/storage/keys';
import type { AppSettings } from '@/lib/types';
import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';
import { UI_SAVED_TOAST_MS } from '@/lib/uiFeedback';

export type SettingsSaveState = 'idle' | 'saving' | 'saved' | 'error';

export type CommitSettingsOptions = {
  /** 开关/卡片等即时落盘，跳过防抖 */
  immediate?: boolean;
};

const DEBOUNCE_MS = 350;

interface Options {
  onSaveStateChange?: (state: SettingsSaveState, errorMessage?: string) => void;
}

export function useSettingsPersistence({ onSaveStateChange }: Options = {}) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lastSavedSig, setLastSavedSig] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SettingsSaveState>('idle');
  const settingsRef = useRef<AppSettings | null>(null);
  const lastSavedSigRef = useRef<string | null>(null);
  const pendingRef = useRef<AppSettings | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushInFlightRef = useRef(false);

  const updateSaveState = useCallback(
    (state: SettingsSaveState, errorMessage?: string) => {
      setSaveState(state);
      onSaveStateChange?.(state, errorMessage);
    },
    [onSaveStateChange],
  );

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    lastSavedSigRef.current = lastSavedSig;
  }, [lastSavedSig]);

  const flushSave = useCallback(async () => {
    const next = pendingRef.current;
    if (!next || flushInFlightRef.current) return;
    pendingRef.current = null;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    flushInFlightRef.current = true;
    updateSaveState('saving');
    try {
      const result = await saveSettings(next);
      if (!result.ok) {
        throw new Error(result.error);
      }
      setLastSavedSig(JSON.stringify(next));
      updateSaveState('saved');
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
      savedFadeTimerRef.current = setTimeout(() => updateSaveState('idle'), UI_SAVED_TOAST_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pendingRef.current = next;
      updateSaveState('error', msg);
    } finally {
      flushInFlightRef.current = false;
    }
  }, [updateSaveState]);

  const commitSettings = useCallback(
    (next: AppSettings, options?: CommitSettingsOptions) => {
      setSettings(next);
      settingsRef.current = next;
      pendingRef.current = next;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (options?.immediate) {
        void flushSave();
        return;
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void flushSave();
      }, DEBOUNCE_MS);
    },
    [flushSave],
  );

  /** 立即落盘并等待完成（模型拉取等副作用流程使用） */
  const persistAndMark = useCallback(
    async (next: AppSettings) => {
      setSettings(next);
      settingsRef.current = next;
      pendingRef.current = next;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      await flushSave();
    },
    [flushSave],
  );

  useEffect(() => {
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      _area: chrome.storage.AreaName,
    ) => {
      if (!(SETTINGS_KEY in changes)) return;
      void getSettings().then((fresh) => {
        const prev = settingsRef.current;
        const sig = lastSavedSigRef.current;
        if (prev === null || sig === null) {
          setSettings(fresh);
          setLastSavedSig(JSON.stringify(fresh));
          return;
        }
        const hasPending = pendingRef.current !== null || JSON.stringify(prev) !== sig;
        if (!hasPending) {
          setSettings(fresh);
          setLastSavedSig(JSON.stringify(fresh));
        } else {
          setSettings({
            ...prev,
            promptStrategy: fresh.promptStrategy,
            oneClickRewriteRandomness: normalizeOneClickRefineRandomness(
              fresh.oneClickRewriteRandomness,
            ),
          });
        }
      });
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, []);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLastSavedSig(JSON.stringify(s));
    });
  }, []);

  useEffect(() => {
    const flushPending = () => {
      if (pendingRef.current) void flushSave();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushPending();
    };
    window.addEventListener('pagehide', flushPending);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flushPending);
      document.removeEventListener('visibilitychange', onVisibility);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
      flushPending();
    };
  }, [flushSave]);

  return {
    settings,
    setSettings,
    lastSavedSig,
    saveState,
    commitSettings,
    persistAndMark,
    settingsRef,
    lastSavedSigRef,
  };
}
