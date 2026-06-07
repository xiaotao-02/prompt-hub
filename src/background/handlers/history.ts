import {
  appendPromptVersion,
  getHistoryItem,
  removePromptVersion,
  restorePromptVersion,
} from '@/lib/storage';
import type { PromptVersion, PromptVersionSource } from '@/lib/types';
import type { MessageHandler } from './types';

function respondHistoryError(sendResponse: (response: unknown) => void, err: unknown): void {
  sendResponse({
    ok: false,
    error: err instanceof Error ? err.message : String(err),
  });
}

export const handleHistoryMessage: MessageHandler = (message, _sender, sendResponse) => {
  if (message?.type === 'GET_HISTORY_ITEM') {
    const id = message.payload?.id as string | undefined;
    if (!id) {
      sendResponse({ ok: false, error: '缺少 id' });
      return true;
    }
    void getHistoryItem(id)
      .then((item) => sendResponse({ ok: true, item }))
      .catch((err) => respondHistoryError(sendResponse, err));
    return true;
  }

  if (message?.type === 'APPEND_PROMPT_VERSION') {
    const p = message.payload as
      | {
          id?: string;
          prompt?: string;
          source?: PromptVersionSource;
          note?: string;
          meta?: PromptVersion['meta'];
        }
      | undefined;
    if (!p?.id || typeof p.prompt !== 'string') {
      sendResponse({ ok: false, error: '参数缺失' });
      return true;
    }
    void appendPromptVersion(p.id, p.prompt, p.source ?? 'edited', p.note, p.meta)
      .then((item) => sendResponse({ ok: true, item }))
      .catch((err) => respondHistoryError(sendResponse, err));
    return true;
  }

  if (message?.type === 'RESTORE_PROMPT_VERSION') {
    const p = message.payload as { id?: string; versionId?: string } | undefined;
    if (!p?.id || !p.versionId) {
      sendResponse({ ok: false, error: '参数缺失' });
      return true;
    }
    void restorePromptVersion(p.id, p.versionId)
      .then((item) => sendResponse({ ok: true, item }))
      .catch((err) => respondHistoryError(sendResponse, err));
    return true;
  }

  if (message?.type === 'REMOVE_PROMPT_VERSION') {
    const p = message.payload as { id?: string; versionId?: string } | undefined;
    if (!p?.id || !p.versionId) {
      sendResponse({ ok: false, error: '参数缺失' });
      return true;
    }
    void removePromptVersion(p.id, p.versionId)
      .then((item) => sendResponse({ ok: true, item }))
      .catch((err) => respondHistoryError(sendResponse, err));
    return true;
  }

  return undefined;
};
