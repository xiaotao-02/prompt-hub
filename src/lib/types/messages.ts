import type { ProviderQuotaSnapshot } from '../quota/types';
import type {
  ExtractFocus,
  ExtractStage,
  HistoryItem,
  OneClickRefineRandomness,
  OutputStyle,
  PromptVersion,
  PromptVersionSource,
  ProviderId,
  RefineStage,
  RegionCaptureConfirmPayload,
  StrategyId,
  StreamDeliveryMode,
  VideoSegmentMeta,
} from './domain';

// === 消息协议 ===
export type RuntimeMessage =
  | {
      type: 'EXTRACT_PROMPT';
      payload: {
        /** 单图或与 imageUrls[0] 一致；兼容旧客户端 */
        imageUrl: string;
        pageUrl: string;
        pageTitle: string;
        requestId: string;
        /** 多图时有序完整列表；省略则仅用 imageUrl */
        imageUrls?: string[];
        /**
         * 可选的策略覆盖。content panel 的策略选择器切换时带上，
         * background 会用它替代 settings.promptStrategy 来决定本次反推的策略。
         * 不传则走 settings 里用户配置的默认策略。
         */
        strategyOverride?: StrategyId;
        /** 可选：仅提取材质或画面风格维度，不传等同完整提示词反推 */
        extractFocus?: ExtractFocus;
        /** 「时间段反推」：与同条消息内多帧参考图对齐的起止秒；可含各帧采样时刻 */
        videoSegment?: VideoSegmentMeta;
      };
    }
  | {
      type: 'EXTRACT_RESULT';
      payload: {
        requestId: string;
        ok: true;
        prompt: string;
        provider: ProviderId;
        model: string;
        style: OutputStyle;
      };
    }
  | {
      type: 'EXTRACT_ERROR';
      payload: {
        requestId: string;
        ok: false;
        error: string;
      };
    }
  | {
      type: 'EXTRACT_PENDING';
      payload: {
        requestId: string;
        imageUrl: string;
        /** 多图反推时与 imageUrl 一并下发，供面板展示缩略图条 */
        imageUrls?: string[];
        /**
         * 本次反推使用的「提示词策略档位」id。
         *
         * 后台 service worker 在发送 PENDING 前为了让 panel 第一时间出现，
         * 不会等待 settings 读取完成，所以这里允许缺省；缺省时由后续的
         * EXTRACT_PROGRESS 再补发一次带 strategy 的更新即可。
         */
        strategy?: StrategyId;
        /** 与设置页共用的一键洗稿随机强度；缺省时由后续 EXTRACT_PROGRESS 补发 */
        oneClickRewriteRandomness?: OneClickRefineRandomness;
        /** 本次反推使用的输出格式；缺省时由后续 EXTRACT_PROGRESS 补发 */
        outputStyle?: OutputStyle;
      };
    }
  | {
      type: 'EXTRACT_PROGRESS';
      payload: {
        requestId: string;
        /**
         * 当前所处阶段，便于面板切换文案。
         *
         * 允许缺省：后台在 settings 读取完成时会发一次"只携带 strategy"的
         * progress 把策略名补回 panel，这种增量更新不应该把面板已有的
         * stage 重置回默认值。content script 侧需要在 stage === undefined
         * 时跳过 stage 的覆盖。
         */
        stage?: ExtractStage;
        /** 流式阶段时，已经收到的部分提示词文本（累计值） */
        partial?: string;
        /** 端点实际交付方式；`buffered` 表示未返回 SSE，正在等待完整 JSON */
        streamMode?: StreamDeliveryMode;
        /**
         * 本次反推所用策略档位 id（详见 strategies.ts）。
         * 仅在后台首次确认 settings 后发一次，让 loading 面板把
         * "v0.1.5 策略 / v0.1.6 策略" 等档位标签亮出来。
         */
        strategy?: StrategyId;
        /**
         * 本次反推使用的服务商 id（如 'openai' / 'gemini' / 'openrouter'）。
         * 后台在 settings 读取完成后随 strategy 一并补发，让 loading 面板
         * 在还没拿到结果时就能告诉用户"正在用谁的什么模型生成"。
         */
        provider?: ProviderId;
        /**
         * 本次反推使用的模型 id（如 'gpt-4o' / 'gemini-2.0-flash'）。
         * 同上，仅在 settings 读取完成后发一次，loading 面板用它点亮
         * 模型 badge。
         */
        model?: string;
        /** 一键洗稿随机强度（settings 就绪后与 strategy 一并下发） */
        oneClickRewriteRandomness?: OneClickRefineRandomness;
        /** 本次反推使用的输出格式（settings 就绪后与 strategy 一并下发） */
        outputStyle?: OutputStyle;
      };
    }
  | {
      /**
       * 历史落库完成通知。
       *
       * 背景：runExtraction 为了让面板尽快看到结果，会先发 EXTRACT_RESULT，
       * 然后异步走 persistHistory。但 addHistory 对「同一张图」会自动合并到
       * 旧记录上 → storage 里真实存在的 id 不一定等于 content 此刻持有的
       * `requestId`。如果 content 用过期的 requestId 去 save / restore /
       * syncVersions，会因 findIndex<0 静默失败。
       *
       * 因此 background 在落库结束后通过这条消息把「真实 id + 当前版本数组」
       * 喂回 content，让浮窗把 currentState.requestId 切换到真实 id，并立刻
       * 填充 versions（不再需要 content 自己读 storage 排查 race）。
       */
      type: 'HISTORY_READY';
      payload: {
        /** content 当前 panel 持有的 requestId（用于路由到对应 panel） */
        requestId: string;
        /** storage 里实际落地的 HistoryItem id —— 同图合并时会和 requestId 不同 */
        actualId: string;
        /** 最新版本数组（含本次反推产生的版本） */
        versions: PromptVersion[];
        /** 真实落库后的当前 prompt，作为防御性兜底 */
        prompt: string;
      };
    }
  | {
      /**
       * 识图进行中：按与 {@link addHistory} 一致的 dedupe 键命中已有记录时，
       * 先把库里的 versions / 真实 id 推到浮窗，避免 loading 阶段「历史版本 · 0」闪烁。
       */
      type: 'HISTORY_PREFETCH';
      payload: {
        requestId: string;
        storageId: string;
        versions: PromptVersion[];
        prompt: string;
      };
    }
  | {
      type: 'REFINE_PROMPT';
      payload: {
        historyId: string;
        instruction: string;
        current: string;
        /** 并行 refine 时区分流式进度归属；省略则兼容旧客户端单路行为 */
        refineJobId?: string;
      };
    }
  | {
      /**
       * AI 调整流式进度。来自浮动面板时由后台 postToTab 投递到对应 tab；
       * popup / options 发起时由后台 chrome.runtime.sendMessage 广播，由当前
       * 正在 refine 的页面监听并更新 UI。
       */
      type: 'REFINE_PROGRESS';
      payload: {
        /** 对应 panel 的 requestId / 历史记录 id（与 REFINE_PROMPT 的 historyId 一致） */
        historyId: string;
        /** 与 REFINE_PROMPT 对应；省略则兼容旧版单路 refine */
        refineJobId?: string;
        /** 当前 refine 阶段；和 partial 至少有一个会带上 */
        stage?: RefineStage;
        /** 已收到的累计部分文本（每次都是全文，不是 delta） */
        partial?: string;
        /** 端点实际交付方式；`buffered` 表示未返回 SSE，正在等待完整 JSON */
        streamMode?: StreamDeliveryMode;
      };
    }
  | {
      type: 'PING';
    }
  | {
      type: 'CHECK_UPDATE';
    }
  | {
      /** 对齐 GitHub latest 后请求浏览器拉包并在可用时 reload */
      type: 'APPLY_EXTENSION_UPDATE';
    }
  | {
      /**
       * background → content：右键「添加到参考」菜单，把图片 URL 并入浮动面板参考列表，
       * 不触发反推（compose 态直至用户点击「生成」）。
       */
      type: 'PANEL_APPEND_REFERENCE';
      payload: { imageUrl: string };
    }
  | {
      /**
       * background → content：右键「添加视频参考」，打开 compose 并切到「采集视频帧」标签。
       */
      type: 'PANEL_OPEN_VIDEO_REFERENCE';
      payload: { videoIndex?: number };
    }
  | {
      /**
       * 内容脚本在 contextmenu（捕获阶段）探测到的「本轮首选提取 URL」与是否点亮兜底菜单。
       * extractionUrl：可为 http(s)/blob、`data:image/...`，含视频抓拍 JPEG、`poster` URL 等；
       * 为空时后台清除该 tab 的 tab 级缓存。
       * showFallback：仅在需要原生 image 上下文以外的兜底入口时为 true；
       * 直接右键 `<video>` 时可为 false，但仍写入 extractionUrl 供原生菜单点击优先于 `srcUrl`。
       * videoIndex：命中视口内 `<video>` 时在列表中的序号，供「添加视频参考」预选。
       */
      type: 'CTX_MENU_PREP';
      payload: { extractionUrl: string; showFallback: boolean; videoIndex?: number };
    }
  | {
      /**
       * 浮动面板切换策略档位后请求后台写回 `app_settings_v1.promptStrategy`，
       * 与选项页、其它上下文共用同一份默认策略（content 不直链接 storage/settings）。
       */
      type: 'SET_PROMPT_STRATEGY';
      payload: { strategy: StrategyId };
    }
  | {
      /** 浮动面板 / 设置页应用已保存的用户策略预设 */
      type: 'APPLY_USER_STRATEGY_PRESET';
      payload: { presetId: string };
    }
  | {
      /**
       * 浮动面板切换输出格式后请求后台写回 `app_settings_v1.outputStyle`，
       * 与选项页、其它上下文共用同一份默认格式。
       */
      type: 'SET_OUTPUT_STYLE';
      payload: { style: OutputStyle };
    }
  | {
      /** 浮动面板等处切换「一键洗稿」随机强度后写回全局设置 */
      type: 'SET_ONE_CLICK_REWRITE_RANDOMNESS';
      payload: { level: OneClickRefineRandomness };
    }
  | {
      /**
       * 浮动面板 header 模型下拉：读取当前激活供应商的反推模型与已发现列表。
       * Content 不直读 storage；由 background 从 `providers[activeProvider]` 组装。
       */
      type: 'GET_ACTIVE_MODEL_OPTIONS';
      payload?: Record<string, never>;
    }
  | {
      /**
       * 浮动面板切换反推模型后写回 `providers[activeProvider].model`；
       * 不改 `refineProvider` / `refineModel`。
       */
      type: 'SET_EXTRACT_MODEL';
      payload: { model: string };
    }
  | {
      /**
       * 从 popup / options / 浮动面板打开扩展选项页；无 payload 时等同 `openOptionsPage()`。
       * 带参时由 background 拼 hash 深链（tab / focus / dock）。
       */
      type: 'OPEN_OPTIONS';
      payload?: {
        tab?: 'settings' | 'library';
        focusId?: string;
        dock?: 'refine' | 'versions';
      };
    }
  | {
      /**
       * Popup / 快捷键 /页面右键菜单发起：在当前窗口活动标签页进入「拖拽截取区域 → 添加到参考」。
       * Background 会向该 tab 的 content script 下发 {@link START_REGION_CAPTURE}。
       */
      type: 'REQUEST_REGION_CAPTURE';
      payload?: Record<string, never>;
    }
  | {
      /**
       * Background → content：拉起全屏半透明选区 UI（仅在顶层窗口处理）。
       */
      type: 'START_REGION_CAPTURE';
      payload?: Record<string, never>;
    }
  | {
      /**
       * Content → background：用户对齐到视口的选区矩形（CSS 像素，`getBoundingClientRect` 语义），
       * 附带 `innerWidth` / `innerHeight` 便于与 captureVisibleTab 按宽高比例映射裁剪。
       */
      type: 'REGION_CAPTURE_CONFIRM';
      payload: RegionCaptureConfirmPayload;
    }
  | {
      /**
       * 由 popup（小列表）/ options 提示词库发起，请求 background 把一条
       * 历史记录"召回"到当前活跃的普通网页 tab 的浮动面板里继续编辑。
       *
       * background 收到后会：
       *   1. 找一个能注入 content script 的普通网页 tab（http/https/file 等）
       *   2. 激活该 tab + 聚焦其 window
       *   3. 向该 tab 转发 PANEL_FROM_HISTORY，由 content script 渲染面板
       *
       * 可选 `dock`：`'refine'` 初始展开 AI 调整区，`'versions'` 初始展开历史版本侧栏；
       * 省略则仅打开主编辑区（与仅「召回」一致）。
       *
       * 响应：{ ok: true, tabId } 或 { ok: false, error }。前端用于
       * 决定要不要关 popup / 弹错误提示。
       */
      type: 'OPEN_IN_PANEL';
      payload: { historyId: string; dock?: 'refine' | 'versions' };
    }
  | {
      /**
       * content → background：按 id 读取单条历史。页面里的 IndexedDB 绑定网页源，
       * 不能读扩展提示词库；面板内同步版本必须走此消息。
       */
      type: 'GET_HISTORY_ITEM';
      payload: { id: string };
    }
  | {
      /** content → background：追加提示词版本（与 {@link ./storage/versions#appendPromptVersion} 一致） */
      type: 'APPEND_PROMPT_VERSION';
      payload: {
        id: string;
        prompt: string;
        source?: PromptVersionSource;
        note?: string;
        meta?: PromptVersion['meta'];
      };
    }
  | {
      type: 'RESTORE_PROMPT_VERSION';
      payload: { id: string; versionId: string };
    }
  | {
      type: 'REMOVE_PROMPT_VERSION';
      payload: { id: string; versionId: string };
    }
  | {
      /**
       * background 转发给 content script，要求把指定 history 渲染到浮动面板。
       * 必须带上 `item` 快照：content script 里的 IndexedDB 属于**网页源**，
       * 读不到扩展后台写入的提示词库；不能依赖在页面上下文再 getHistoryItem。
       * `dock` 与 OPEN_IN_PANEL 一致，用于初始展开 AI 调整或历史侧栏。
       */
      type: 'PANEL_FROM_HISTORY';
      payload: {
        historyId: string;
        item: HistoryItem;
        dock?: 'refine' | 'versions';
        /** 当前全局设置中的一键洗稿强度，便于召回面板与选项页一致 */
        oneClickRewriteRandomness?: OneClickRefineRandomness;
      };
    }
  | {
      /** popup / options / content → background：查询当前或指定供应商剩余额度 */
      type: 'FETCH_PROVIDER_QUOTA';
      payload?: { providerId?: ProviderId; force?: boolean };
    }
  | {
      /** popup / options → background：发送平台邮箱登录验证码 */
      type: 'PLATFORM_LOGIN_EMAIL_SEND';
      payload: { email: string };
    }
  | {
      /** popup / options → background：验证邮箱验证码并登录平台 */
      type: 'PLATFORM_LOGIN_EMAIL_VERIFY';
      payload: { email: string; code: string };
    }
  | {
      /** popup / options → background：Google 一键登录平台 */
      type: 'PLATFORM_LOGIN_GOOGLE';
    }
  | {
      /** 本地预览 / 开发：调用 API dev-login，跳过邮箱验证码 */
      type: 'PLATFORM_LOGIN_DEV';
      payload?: { email?: string };
    };

export interface FetchProviderQuotaResponseOk {
  ok: true;
  snapshot: ProviderQuotaSnapshot;
}
export interface FetchProviderQuotaResponseErr {
  ok: false;
  error: string;
}
export type FetchProviderQuotaResponse =
  | FetchProviderQuotaResponseOk
  | FetchProviderQuotaResponseErr;

export interface RefineResponseOk {
  ok: true;
  prompt: string;
  provider: ProviderId;
  model: string;
  versionId: string;
  refineJobId?: string;
  /** 模型输出与库内当前 prompt 相同，未写入新版本 */
  unchanged?: boolean;
}
export interface RefineResponseErr {
  ok: false;
  error: string;
}
export type RefineResponse = RefineResponseOk | RefineResponseErr;

/** 官网 → 扩展：充值等场景请求刷新平台余额缓存（非 RuntimeMessage） */
export const PE_EXT_QUOTA_REFRESH_TYPE = 'PE_EXT_QUOTA_REFRESH' as const;

export interface PeExtQuotaRefreshMessage {
  type: typeof PE_EXT_QUOTA_REFRESH_TYPE;
}

export interface PeExtQuotaRefreshResponse {
  ok: boolean;
  error?: string;
}

/** 官网 → 扩展：查询扩展是否已登录内置服务 */
export const PE_EXT_GET_STATUS_TYPE = 'PE_EXT_GET_STATUS' as const;

export interface PeExtGetStatusMessage {
  type: typeof PE_EXT_GET_STATUS_TYPE;
}

export interface PeExtGetStatusResponse {
  ok: boolean;
  loggedIn?: boolean;
  error?: string;
}

/** 官网 → 扩展：请求打开选项页（支持 hash 深链） */
export const PE_EXT_OPEN_OPTIONS_TYPE = 'PE_EXT_OPEN_OPTIONS' as const;

export interface PeExtOpenOptionsMessage {
  type: typeof PE_EXT_OPEN_OPTIONS_TYPE;
  payload?: {
    tab?: 'settings' | 'library';
    focusId?: string;
    dock?: 'refine' | 'versions';
  };
}

export interface PeExtOpenOptionsResponse {
  ok: boolean;
  error?: string;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  defaultBaseUrl: string;
  defaultModel: string;
  docsUrl: string;
  description: string;
  /** 设置页「模型供应商」：`featured` 默认展示，`extended` 折叠在「更多」 */
  uiTier?: 'featured' | 'extended';
  /** 流式能力补充说明（如自定义/中转端点可能不支持 SSE） */
  streamingNote?: string;
}
