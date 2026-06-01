import {
  PROMPT_HUB_REFINE_PROGRESS_PORT,
  REFINE_PROGRESS_PORT_KIND,
  type RefineProgressPortEnvelope,
  type RefineProgressPortPayload,
} from '@/lib/refineProgressPort';

const refineProgressPorts = new Set<chrome.runtime.Port>();

function registerRefineProgressPort(port: chrome.runtime.Port): void {
  refineProgressPorts.add(port);
  port.onDisconnect.addListener(() => {
    void chrome.runtime.lastError;
    refineProgressPorts.delete(port);
  });
}

export function installRefineProgressPortHub(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PROMPT_HUB_REFINE_PROGRESS_PORT) return;
    registerRefineProgressPort(port);
  });
}

/** 向已连接的 Options / Popup 等扩展页广播 refine 流式进度。 */
export function postRefineProgressToExtensionPages(payload: RefineProgressPortPayload): void {
  if (refineProgressPorts.size === 0) return;
  const env: RefineProgressPortEnvelope = {
    kind: REFINE_PROGRESS_PORT_KIND,
    payload,
  };
  for (const port of refineProgressPorts) {
    try {
      port.postMessage(env);
    } catch {
      refineProgressPorts.delete(port);
    }
  }
}
