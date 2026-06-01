# Prompt Hub 命名术语表

面向 AI Agent 与维护者的**单一命名权威**：跨文件阅读、grep、改功能时优先对照本文。

## 核心领域词

| 术语       | 含义                  | 代码层统一词                        |
| ---------- | --------------------- | ----------------------------------- |
| 反推       | 图/视频 → 提示词      | `extract`                           |
| AI 调整    | 在已有提示词上改写    | `refine`                            |
| 一键洗稿   | 无自定义指令的 refine | `oneClick`（`PanelRefineJob.kind`） |
| 带指令调整 | 用户输入指令的 refine | `instructed`                        |
| 参考图     | 反推输入的多张图      | `reference` / `referenceImages`     |

## 持久化与协议（不可随意重命名）

| 保留名                             | 说明                 |
| ---------------------------------- | -------------------- |
| `oneClickRewriteRandomness`        | settings storage key |
| `SET_ONE_CLICK_REWRITE_RANDOMNESS` | RuntimeMessage 类型  |
| `REFINE_*` / `EXTRACT_*`           | 消息协议前缀         |
| `HistoryItem.versions`             | IndexedDB 存储字段   |

Panel 状态字段 `oneClickRefineRandomness` 与 storage key 不同，读取 settings 时需映射。

## 历史 ID 生命周期（PanelState）

| 字段                 | 说明                       |
| -------------------- | -------------------------- |
| `sessionRequestId`   | 路由 `EXTRACT_*` 消息      |
| `prefetchStorageId`  | `HISTORY_PREFETCH` 预取 id |
| `persistedHistoryId` | `HISTORY_READY` 落库 id    |

协议 payload 仍用 `requestId` / `storageId` / `actualId`；面板 reducer 事件类型用新名。

## 流式哨兵

文件：[`src/lib/streamVersionSentinels.ts`](../src/lib/streamVersionSentinels.ts)

- `REFINE_STREAM_VERSION_ID` = `__pe_refine_stream__`
- `EXTRACT_STREAM_VERSION_ID` = `__pe_extract_stream__`

## Content Panel 模块地图

| 路径                                   | 职责                                  |
| -------------------------------------- | ------------------------------------- |
| `panel/PanelApp.tsx`                   | React 面板根                          |
| `panel/panelShell.ts`                  | drag/resize + 遗留导出                |
| `panel/panelReducer.ts`                | 状态机门面                            |
| `panel/reducerHandlers/`               | `apply*` 处理器                       |
| `panel/reducerHandlers/panelEvents.ts` | `PanelEvent` 类型                     |
| `panel/actions/copyAndRetry.ts`        | 复制/重试                             |
| `panel/actions/compose.ts`             | 发起反推                              |
| `panel/panelRenderBridge.ts`           | dispatch + render（非 React effects） |
| `panel/hooks/usePanelEffects.tsx`      | React effects                         |

## 改消息协议顺序

1. `src/lib/types/messages.ts`
2. `src/background/messages.ts`
3. 各 `sendMessage` / `onMessage` 调用点

## UI 用语

- 某条历史的版本列表（UI）：`promptVersions`；存储仍为 `HistoryItem.versions`
- Popup 历史条目列表：`historyList`

## PromptLibrary hooks

组合 hook：`usePromptLibrary`；子 hook 统一 `useLibrary*` 前缀。
