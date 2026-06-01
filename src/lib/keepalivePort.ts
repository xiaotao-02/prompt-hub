/** Content script ↔ MV3 service worker：`runtime.connect` 名称（用于保活，减轻右键兜底菜单竞态）。 */
export const PROMPT_HUB_KEEPALIVE_PORT = 'prompt-hub-keepalive';

/** Port 信道上的 `CTX_MENU_PREP`（与 RuntimeMessage CTX_MENU_PREP payload 语义一致）。 */
export const KEEPALIVE_PORT_PREP_KIND = 'CTX_MENU_PREP' as const;

export type CtxMenuPrepPayload = {
  extractionUrl: string;
  showFallback: boolean;
  /** 视口内 `<video>` 列表中的 0-based 序号；仅命中视频时写入 */
  videoIndex?: number;
};

export interface KeepaliveCtxPrepEnvelope {
  kind: typeof KEEPALIVE_PORT_PREP_KIND;
  payload: CtxMenuPrepPayload;
}
