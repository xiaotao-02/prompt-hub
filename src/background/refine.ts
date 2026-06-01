import { refinePrompt } from '@/lib/api';
import { appendPromptVersion, getHistoryItem, getSettings } from '@/lib/storage';
import type { RefineResponse, StreamDeliveryMode } from '@/lib/types';
import { postRefineProgressToExtensionPages } from './refineProgressPortHub';
import { postToTab } from './tabMessaging';

export async function runRefine(
  historyId: string,
  current: string,
  instruction: string,
  tabId?: number,
  refineJobId?: string,
): Promise<RefineResponse> {
  try {
    const settings = await getSettings();
    const onProgress = (ev: {
      stage: 'calling' | 'streaming';
      partial?: string;
      streamMode?: StreamDeliveryMode;
    }) => {
      const payload: {
        historyId: string;
        refineJobId?: string;
        stage?: typeof ev.stage;
        partial?: string;
        streamMode?: StreamDeliveryMode;
      } = {
        historyId,
        stage: ev.stage,
        partial: ev.partial,
        streamMode: ev.streamMode,
      };
      if (refineJobId) payload.refineJobId = refineJobId;
      if (tabId != null) {
        postToTab(tabId, { type: 'REFINE_PROGRESS', payload });
        return;
      }
      postRefineProgressToExtensionPages(payload);
      chrome.runtime.sendMessage({ type: 'REFINE_PROGRESS', payload }, () => {
        void chrome.runtime.lastError;
      });
    };
    const result = await refinePrompt({ settings, current, instruction, onProgress });
    if (!result.prompt) {
      return { ok: false, error: '模型返回了空提示词' };
    }
    const before = await getHistoryItem(historyId);
    if (!before) {
      return { ok: false, error: '记录不存在' };
    }
    const prevHeadVersionId = before.versions[0]?.id;
    const updated = await appendPromptVersion(historyId, result.prompt, 'refined', instruction, {
      provider: result.provider,
      model: result.model,
      style: settings.outputStyle,
    });
    if (!updated) {
      return { ok: false, error: '记录不存在' };
    }
    const versionCreated = updated.versions[0]?.id !== prevHeadVersionId;
    const versionId = updated.versions[0]?.id || `${historyId}:r_${Date.now()}`;
    return {
      ok: true,
      prompt: result.prompt,
      provider: result.provider,
      model: result.model,
      versionId,
      ...(versionCreated ? {} : { unchanged: true }),
      ...(refineJobId ? { refineJobId } : {}),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
