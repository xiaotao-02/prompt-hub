import { safeSendMessage, isExtensionContextValid } from '@/content/extensionBridge';
import { openOptionsMessage } from '@/lib/messaging/openSurfaces';
import { currentState, libraryStorageId } from '../state';
import type { DataActionHandler } from './types';

export const handleOpenOptions: DataActionHandler = () => {
  if (!isExtensionContextValid()) return;
  safeSendMessage(openOptionsMessage());
};

export const handleOpenInLibrary: DataActionHandler = () => {
  const state = currentState;
  if (!state || !isExtensionContextValid()) return;
  safeSendMessage(
    openOptionsMessage({ tab: 'library', focusId: libraryStorageId(state) }),
    () => void chrome.runtime.lastError,
  );
};
