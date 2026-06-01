import { useCallback, useEffect, useState } from 'react';
import {
  getVersionsListDensity,
  setVersionsListDensity,
  toggleVersionsListDensity,
  type VersionsListDensity,
} from '@/lib/versionsListDensity';

export function useVersionsListDensity(opts?: {
  storageKey?: string;
  fallback?: VersionsListDensity;
}) {
  const storageKey = opts?.storageKey ?? 'versionsListDensity';
  const fallback = opts?.fallback ?? 'comfortable';
  const [density, setDensity] = useState<VersionsListDensity>(fallback);

  useEffect(() => {
    let cancelled = false;
    void getVersionsListDensity(storageKey, fallback).then((d) => {
      if (!cancelled) setDensity(d);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey, fallback]);

  const toggle = useCallback(() => {
    setDensity((prev) => {
      const next = toggleVersionsListDensity(prev);
      void setVersionsListDensity(next, storageKey);
      return next;
    });
  }, [storageKey]);

  return { density, toggle };
}
