/**
 * 内置 provider 标识。
 *
 * 分组（仅文档目的，类型上是平的联合）：
 * - 三大原生协议：openai / anthropic / gemini
 * - 国内主流（OpenAI 兼容）：zhipu / qwen / siliconflow / deepseek / moonshot /
 *   doubao / stepfun / minimax / yi / baidu
 * - 海外主流（OpenAI 兼容）：openrouter / xai / mistral / groq / together /
 *   fireworks
 * - 第三方中转：shukelongda
 * - 兜底：custom（任意 OpenAI 兼容端点）
 *
 * **新增 provider 时同时改 `src/lib/providers.ts` 的 PROVIDERS 注册表**，
 * 默认配置（baseUrl / 默认模型 / 文档链接）由那里集中维护。
 *
 * 老 settings 里若残留早期下线过的 id（例如曾经出现过的 'fidelity' 之类），
 * `getSettings` 通过 base 默认值合并已经能软回退到 `openai`。
 */
export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'zhipu'
  | 'qwen'
  | 'siliconflow'
  | 'deepseek'
  | 'moonshot'
  | 'doubao'
  | 'stepfun'
  | 'minimax'
  | 'yi'
  | 'baidu'
  | 'openrouter'
  | 'xai'
  | 'mistral'
  | 'groq'
  | 'together'
  | 'fireworks'
  | 'shukelongda'
  | 'custom';

export type OutputStyle = 'natural-zh' | 'natural-en' | 'sd-tags' | 'midjourney';

/**
 * 提示词「策略档位」标识。
 *
 * 一档策略 = 3 个组件维度的「版本组合引用」：
 *   - stylePromptSet : 4 套 OutputStyle 指令文本的版本号
 *   - sampling       : { temperature, maxTokens } 一对采样参数的版本号
 *   - customJoin     : 用户自定义模板拼接位置的版本号
 *
 * **真正的字面量定义 = `keyof typeof STRATEGIES_INTERNAL`（在 strategies-meta.ts）**。
 * 这里只是把它 type-only re-export 给 types.ts 的消费方，让 AppSettings、运行时
 * 消息协议这些纯类型场景照旧能 import {@link StrategyId}，又不会因此把 strategies.ts
 * 的运行时代码（含 STYLE_PROMPT_SETS 等几 KB 字符串）拉进 bundle。
 *
 * 由于这是 `export type ... from`，编译产物里完全消失，不存在循环依赖问题：
 * strategies.ts 仍然可以 `import type { OutputStyle } from './types'`。
 *
 * **加 / 删一档策略只在 strategies-meta.ts 里改 STRATEGIES_INTERNAL 一处**，这个
 * 类型自动跟随，不用手动维护字面量联合（避免出现"types 里写了 'v030' 但 STRATEGIES
 * 漏加"或反之的不一致）。
 *
 * 历史上还存在过 'fidelity' (v0.1.7 高保真档)，已下线；老 settings 里如果还存着
 * 这个值，会在 getStrategy 里安全回退到 DEFAULT_STRATEGY_ID。
 */
// 同时本地绑定（types.ts 内部要在 AppSettings / 消息协议里直接当类型用）和
// 对外 re-export。`export type { ... } from` 本身只做"转发"，不会把 StrategyId
// 作为本地标识符可见，所以必须 import-then-export 两步走。
import type { StrategyId, StrategyComponents } from '../strategies-meta';
export type { StrategyId, StrategyComponents };

export interface ProviderConfig {
  id: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  /** 通过 `/models` 接口拉到的模型 id 列表，用于在「设置」里直接选择 */
  discoveredModels?: string[];
  /** 各 discovered 模型是否支持识图（与 discoveredModels 同步，存 local） */
  discoveredVisionById?: Record<string, 'vision' | 'no_vision' | 'unknown'>;
  /** 上一次成功拉取模型列表的时间戳 */
  discoveredAt?: number;
}

export interface UpdateInfo {
  version: string;
  name: string;
  downloadUrl: string;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  current: string;
  latest: UpdateInfo | null;
  checkedAt: number;
  error?: string;
}

/**
 * options → background「立即更新」：通过 Chrome Web Store 触发浏览器侧更新并重载；
 * 若限流或解压加载，仅返回说明文案。
 */
export type ApplyExtensionUpdateResult =
  | { applied: true; willReload: true }
  | { applied: false; reason: 'already_latest' }
  | {
      applied: false;
      reason: 'throttled' | 'manual_required';
      message: string;
    };

export interface UpdateSettings {
  lastCheckedAt: number;
  lastResult: UpdateCheckResult | null;
}

/** 「一键洗稿」随机变异强度；写入 {@link AppSettings.oneClickRewriteRandomness} */
export type OneClickRefineRandomness = 'subtle' | 'moderate' | 'bold';

export interface AppSettings {
  /** 首选 API：识图反推、重新生成 */
  activeProvider: ProviderId;
  /** 次选 API：AI 调整 / 一键洗稿；未设置时跟随 activeProvider */
  refineProvider?: ProviderId;
  /** 次选专用模型；未设置时跟随首选模型（同供应商）或次选槽位模型（不同供应商） */
  refineModel?: string;
  providers: Record<ProviderId, ProviderConfig>;
  outputStyle: OutputStyle;
  /** 追加到系统指令的用户文案；与 customInstruction 互斥，由设置页统一编辑器写入 */
  customPromptTemplate: string;
  saveHistory: boolean;
  updates: UpdateSettings;
  /**
   * 当前生效的提示词策略档位 id。
   *
   * 一个 id 在内部展开成 3 个组件版本（stylePromptSet / sampling / customJoin），
   * 进而决定 4 套 stylePrompts 的措辞、采样温度、输出上限、以及用户自定义模板
   * 的拼接位置。详见 {@link ./strategies.ts}。
   *
   * 这里依旧只持久化一个 id 字符串，是因为：
   *   - 老 settings（v0.1.6 之前没有 promptStrategy 字段）由 `getSettings`
   *     合并 base 默认值时自动填上 `DEFAULT_STRATEGY_ID`，旧数据无缝升级；
   *   - 新版本里如果某个组件版本被淘汰，只要重命名内置策略对应的 id 不动，
   *     用户旧数据里写着的 id 仍然能解析回最新可用的组件组合，不会出空白。
   */
  promptStrategy: StrategyId;
  /** 自定义组合策略选用的组件版本（仅 promptStrategy === 'custom' 时生效） */
  customComponents?: StrategyComponents;
  /** 替换指令集正文的用户文案（仅 custom 策略生效）；与 customPromptTemplate 互斥 */
  customInstruction?: string;
  /** 自定义温度（覆盖 sampling 版本） */
  customTemperature?: number;
  /** 自定义 token 上限（覆盖 sampling 版本） */
  customMaxTokens?: number;
  /**
   * 工具栏弹窗里「编辑 / AI 调整」的默认打开位置（「版本」始终在弹窗内展开，不受此项影响）。
   * - library：打开扩展选项页的提示词库（深链 focus + 可选 dock）
   * - panel：在当前/来源网页的浮动面板中打开，并按操作展开对应区域
   */
  popupToolbarPromptAction?: 'library' | 'panel';
  /** 浮动面板 / 提示词库「一键洗稿」的随机强度，默认 moderate */
  oneClickRewriteRandomness?: OneClickRefineRandomness;
  /**
   * 网页浮动面板在状态切换时是否自动把焦点移到编辑器。
   * 默认开启（可读屏与键盘）；关闭可减少「抢焦点」打扰。
   */
  panelAutofocus?: boolean;
}

/**
 * 用户在「自定义组合」下保存的命名策略快照（存 chrome.storage.local）。
 * 应用时写回 {@link AppSettings} 并令 `promptStrategy === 'custom'`。
 */
export interface UserStrategyPreset {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  customComponents: StrategyComponents;
  customInstruction?: string;
  customTemperature?: number;
  customMaxTokens?: number;
  /** 追加模式文案；与 customInstruction 互斥 */
  customPromptTemplate: string;
}

/**
 * 反推流程的阶段。面板会根据这个值切换 loading 文案：
 *   fetching   → 正在下载/解码图片（含动图扁平化、视频抓帧）
 *   calling    → 已把图片发给大模型，等待首 token
 *   streaming  → 模型已经开始吐字，正在流式接收
 *   finalizing → 流式结束，正在保存历史/收尾
 */
export type ExtractStage = 'fetching' | 'calling' | 'streaming' | 'finalizing';

/** 面板「提取材质 / 提取风格」收窄模型关注点；省略则走常规整图反推。 */
export type ExtractFocus = 'material' | 'style';

/**
 * 浮动面板「时间段反推」：与多帧 seek 采样一致的起止秒，写入模型指令上下文。
 * `frameTimesSec` 与采样帧顺序一致，用于分镜标注中的「约 Xs」锚点（可选，兼容旧客户端）。
 */
export type VideoSegmentMeta = {
  startSec: number;
  endSec: number;
  frameTimesSec?: number[];
};

/**
 * AI 调整（refine）流程的阶段。比反推少了 fetching / finalizing：
 *   calling    → 已把指令发给大模型，等待首 token
 *   streaming  → 模型已经开始吐字，正在流式接收
 *
 * UI 上 refine 进度条只用 calling / streaming 两档，配文案 "正在调用大模型 / 正在接收模型回复"。
 */
export type RefineStage = 'calling' | 'streaming';

/**
 * API 响应的实际交付方式。
 * - `sse`：正常 SSE 逐 token 推送（默认，可省略）
 * - `buffered`：已请求流式但端点返回 JSON，一次性等待完整结果
 */
export type StreamDeliveryMode = 'sse' | 'buffered';

export type PromptVersionSource = 'extracted' | 'edited' | 'restored' | 'refined';

export interface PromptVersion {
  id: string;
  prompt: string;
  /**
   * 稳定的版本序号。排序以它为准，createdAt 只作为展示和冲突兜底。
   */
  versionNo?: number;
  createdAt: number;
  source: PromptVersionSource;
  note?: string;
  /**
   * 该版本对应的模型元数据。
   *
   * - 'extracted' / 'refined' 版本：记录这次调用实际使用的 provider/model/style，
   *   这样在版本列表里能直观看出"这条结果是哪个模型出的"。
   * - 'edited' / 'restored' 版本：通常省略（不绑定具体模型）。
   * - 老数据没有该字段时，UI 应回退到展示「当前记录的 provider/model」。
   */
  meta?: { provider: ProviderId; model: string; style: OutputStyle; strategy?: StrategyId };
}

export interface HistoryItem {
  id: string;
  imageUrl: string;
  thumbnail: string;
  /**
   * 多图参考反推时各张缩略图/引用（与落库时 {@link imageUrl} 同源规范）。
   * 仅当一次反推使用 ≥2 张参考图时写入；单图记录省略本字段以保持旧数据形态。
   */
  imageUrls?: string[];
  prompt: string;
  provider: ProviderId;
  model: string;
  style: OutputStyle;
  pageUrl: string;
  pageTitle: string;
  createdAt: number;
  updatedAt?: number;
  versions: PromptVersion[];
  /** 提取时使用的策略档位 id */
  strategy?: StrategyId;
  /** 用户置顶收藏，置顶项排在管理后台列表最前面 */
  pinned?: boolean;
  /** 用户给这条记录写的备注/标签，便于检索 */
  note?: string;
  /**
   * 所属「项目 / 文件夹」的 id（指向 {@link LibraryFolder.id}）。
   * - `undefined` 或 `null` 表示「未分类」，仍出现在「全部」与「未分类」筛选下。
   * - 文件夹删除时，该字段会被清空（归还到未分类），不会孤儿化。
   */
  folderId?: string | null;
}

/**
 * 「提示词库」的项目 / 文件夹节点。
 *
 * 一棵简单的有根森林：`parentId === null` 的节点视为「项目」（顶层容器），
 * 其余视为子文件夹。允许任意层级嵌套，UI 上仅在视觉上区分项目 / 文件夹，
 * 数据结构是统一的，避免维护两套 CRUD。
 *
 * 节点本身不直接持有 HistoryItem id 列表；归属关系反向存放在
 * {@link HistoryItem.folderId}，这样移动 / 删除记录都不需要同步另一份索引。
 */
export interface LibraryFolder {
  id: string;
  name: string;
  /** 父节点 id；`null` 即为顶层「项目」 */
  parentId: string | null;
  createdAt: number;
  updatedAt?: number;
  /**
   * 同级节点排序权重，越小越靠前。新建时取「同级最大 sortKey + 1」，
   * 不持久化拖拽位移之外的中间值。
   */
  sortKey?: number;
  /**
   * 用户挑选的颜色 token（顶层项目主要使用），可选。
   * 取值与 PROJECT_COLORS 中定义的 key 对应（如 `'violet' | 'indigo' | …`）。
   */
  color?: string;
}

export type RegionCaptureConfirmPayload = {
  x: number;
  y: number;
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
};
