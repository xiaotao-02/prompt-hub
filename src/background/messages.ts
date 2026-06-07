import { handleCaptureMessage } from './handlers/capture';
import { handleExtractionMessage } from './handlers/extraction';
import { handleHistoryMessage } from './handlers/history';
import { handleSettingsMessage } from './handlers/settings';
import { handleSurfacesMessage } from './handlers/surfaces';
import { dispatchMessageHandlers } from './handlers/types';
import { handleUpdateMessage } from './handlers/update';

const messageHandlers = [
  handleSurfacesMessage,
  handleCaptureMessage,
  handleSettingsMessage,
  handleHistoryMessage,
  handleUpdateMessage,
  handleExtractionMessage,
];

export function registerRuntimeMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
    dispatchMessageHandlers(messageHandlers, message, sender, sendResponse),
  );
}
