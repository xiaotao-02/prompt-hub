import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';
import { SETTINGS_KEY } from '@/lib/storage/keys';
import type { AppSettings } from '@/lib/types';
import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';

interface Options {
  registerSaveHandler?: (handler: () => Promise<void>) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSaved?: () => void;
}

export function useSettingsPersistence({ registerSaveHandler, onDirtyChange, onSaved }: Options) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lastSavedSig, setLastSavedSig] = useState<string | null>(null);
  const settingsRef = useRef<AppSettings | null>(null);
  const lastSavedSigRef = useRef<string | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    lastSavedSigRef.current = lastSavedSig;
  }, [lastSavedSig]);

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
        const isDirty = JSON.stringify(prev) !== sig;
        if (!isDirty) {
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

  const persistAndMark = useCallback(async (next: AppSettings) => {
    await saveSettings(next);
    setLastSavedSig(JSON.stringify(next));
  }, []);

  const dirty = useMemo(() => {
    if (!settings || lastSavedSig === null) return false;
    return JSON.stringify(settings) !== lastSavedSig;
  }, [settings, lastSavedSig]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!registerSaveHandler || !settings) return;
    registerSaveHandler(async () => {
      await persistAndMark(settings);
      onSaved?.();
    });
  }, [registerSaveHandler, settings, persistAndMark, onSaved]);

  return {
    settings,
    setSettings,
    lastSavedSig,
    dirty,
    persistAndMark,
    settingsRef,
    lastSavedSigRef,
  };
}
