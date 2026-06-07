export type MessageHandler = (
  message: { type?: string; payload?: Record<string, unknown> },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | undefined;

export function dispatchMessageHandlers(
  handlers: MessageHandler[],
  message: { type?: string; payload?: Record<string, unknown> },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
): boolean | undefined {
  for (const handler of handlers) {
    const result = handler(message, sender, sendResponse);
    if (result !== undefined) {
      return result;
    }
  }
  return false;
}
