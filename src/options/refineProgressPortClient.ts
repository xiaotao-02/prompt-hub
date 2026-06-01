import {
  PROMPT_HUB_REFINE_PROGRESS_PORT,
  REFINE_PROGRESS_PORT_KIND,
  type RefineProgressPortEnvelope,
  type RefineProgressPortPayload,
} from '@/lib/refineProgressPort';

/**
 * 与 background 建立 refine 进度 Port；断开时自动重连（与 content keepalive 模式一致）。
 * 返回 cleanup，在 React effect 卸载时调用。
 */
export function connectRefineProgressPort(
  onProgress: (payload: RefineProgressPortPayload) => void,
): () => void {
  let port: chrome.runtime.Port | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const scheduleReconnect = () => {
    if (disposed) return;
    if (reconnectTimer != null) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 800);
  };

  const connect = () => {
    if (disposed) return;
    try {
      port = chrome.runtime.connect({ name: PROMPT_HUB_REFINE_PROGRESS_PORT });
      port.onMessage.addListener((msg: unknown) => {
        if (!msg || typeof msg !== 'object') return;
        const env = msg as RefineProgressPortEnvelope;
        if (env.kind !== REFINE_PROGRESS_PORT_KIND || !env.payload) return;
        onProgress(env.payload);
      });
      port.onDisconnect.addListener(() => {
        void chrome.runtime.lastError;
        port = null;
        scheduleReconnect();
      });
    } catch {
      port = null;
      scheduleReconnect();
    }
  };

  connect();

  return () => {
    disposed = true;
    if (reconnectTimer != null) clearTimeout(reconnectTimer);
    try {
      port?.disconnect();
    } catch {
      /* ignore */
    }
    port = null;
  };
}
