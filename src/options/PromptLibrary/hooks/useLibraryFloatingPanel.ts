import { useCallback, useState } from 'react';
import type { HistoryItem } from '@/lib/types';
import type { LibraryDockIntent } from '../types';

export type LibraryFloatingPanelSession = {
  item: HistoryItem;
  dock: LibraryDockIntent;
};

export function useLibraryFloatingPanel() {
  const [session, setSession] = useState<LibraryFloatingPanelSession | null>(null);

  const openLibraryPanel = useCallback((item: HistoryItem, dock: LibraryDockIntent = null) => {
    setSession({ item, dock });
  }, []);

  const closeLibraryPanel = useCallback(() => {
    setSession(null);
  }, []);

  return {
    session,
    openLibraryPanel,
    closeLibraryPanel,
  };
}
