export type SortKey = 'updated' | 'created' | 'versions';
export type ViewMode = 'list' | 'grid';
/** 从 options hash / popup 出库打开浮动面板时一次性展开「AI 调整」或「历史版本」侧栏 */
export type LibraryDockIntent = null | 'refine' | 'versions';

export const VIEW_STORAGE_KEY = 'prompt_library_view_v1';

/**
 * 侧边栏「项目 / 文件夹」当前选中节点的持久化 key。
 *
 * 取值：
 * - `null` / 缺省 / `'all'` → 显示全部记录
 * - `'unsorted'` → 仅显示「未分类」（folderId 为空）的记录
 * - `'pinned'` → 仅显示置顶记录（虚拟视图，不属于树本身）
 * - 任意 folder.id → 显示该文件夹（含子文件夹）下的记录
 */
export const TREE_SELECTED_KEY = 'prompt_library_tree_selected_v1';

/** 侧边栏树展开状态（折叠/展开）持久化 key，存的是 string[] 形式的 id 数组 JSON */
export const TREE_EXPANDED_KEY = 'prompt_library_tree_expanded_v1';

/** 侧边栏宽度（像素）持久化 key */
export const TREE_WIDTH_KEY = 'prompt_library_tree_width_v1';

/** 内置「虚拟节点」id（不在 folders 数据中）。 */
export const SYSTEM_NODE = {
  ALL: 'all',
  UNSORTED: 'unsorted',
  PINNED: 'pinned',
} as const;

export type SystemNodeId = (typeof SYSTEM_NODE)[keyof typeof SYSTEM_NODE];

/** 顶层「项目」可选的颜色 token。仅用于侧边栏装饰，不影响数据归属。 */
export const PROJECT_COLORS: { id: string; label: string; dot: string; ring: string }[] = [
  { id: 'violet', label: '紫', dot: 'bg-violet-500', ring: 'ring-violet-300/60' },
  { id: 'indigo', label: '靛', dot: 'bg-indigo-500', ring: 'ring-indigo-300/60' },
  { id: 'sky', label: '蓝', dot: 'bg-sky-500', ring: 'ring-sky-300/60' },
  { id: 'emerald', label: '绿', dot: 'bg-emerald-500', ring: 'ring-emerald-300/60' },
  { id: 'amber', label: '橙', dot: 'bg-amber-500', ring: 'ring-amber-300/60' },
  { id: 'rose', label: '红', dot: 'bg-rose-500', ring: 'ring-rose-300/60' },
  { id: 'zinc', label: '灰', dot: 'bg-zinc-400', ring: 'ring-zinc-300/60' },
];

export function getProjectColor(id?: string) {
  return PROJECT_COLORS.find((c) => c.id === id) || PROJECT_COLORS[0];
}

/** 提示词库卡片 provider 品牌色圆点（仅 UI 装饰）。 */
const PROVIDER_ACCENTS: Record<string, string> = {
  platform: 'bg-violet-500',
  openai: 'bg-emerald-500',
  anthropic: 'bg-amber-500',
  gemini: 'bg-sky-500',
  zhipu: 'bg-indigo-500',
  qwen: 'bg-orange-500',
  siliconflow: 'bg-cyan-500',
  deepseek: 'bg-blue-500',
  moonshot: 'bg-violet-500',
  doubao: 'bg-rose-500',
  stepfun: 'bg-teal-500',
  minimax: 'bg-fuchsia-500',
  yi: 'bg-lime-500',
  baidu: 'bg-blue-600',
  openrouter: 'bg-indigo-400',
  xai: 'bg-zinc-300',
  mistral: 'bg-orange-400',
  groq: 'bg-emerald-400',
  together: 'bg-sky-400',
  fireworks: 'bg-amber-400',
  shukelongda: 'bg-violet-400',
  custom: 'bg-zinc-400',
};

export function getProviderAccent(provider?: string) {
  return PROVIDER_ACCENTS[provider ?? ''] ?? 'bg-zinc-400';
}
