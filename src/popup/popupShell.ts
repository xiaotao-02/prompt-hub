/**
 * Chrome 工具栏 popup 为「按内容自动定高」文档（上限约 800×600）。
 * 在 html/body 使用 vh/vw/% 高度会导致尺寸与宿主页视口挂钩或算成极小值，
 * 再叠 overflow-hidden + flex-1 会把滚动区压没。见 W3C webextensions#692。
 * 布局类名以本文件为唯一来源；禁止在 popup 子树使用 vh/vw/dvh 高度。
 */

export const POPUP_WIDTH_PX = 560;
/** Chrome extension popup 常见高度硬上限 */
export const POPUP_CHROME_MAX_HEIGHT_PX = 600;
/** 顶栏 + 偶发 banner 预留 */
export const POPUP_HEADER_RESERVE_PX = 52;
export const POPUP_SCROLL_MAX_HEIGHT_PX = POPUP_CHROME_MAX_HEIGHT_PX - POPUP_HEADER_RESERVE_PX;

export const POPUP_BODY_CLASS = 'min-w-[560px] w-[560px] overflow-x-hidden';

export const POPUP_ROOT_CLASS = 'flex flex-col';

export const POPUP_SCROLL_CLASS = 'max-h-[548px] overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/35';

export const POPUP_EMPTY_MIN_CLASS =
  'flex min-h-[260px] flex-col items-center justify-center px-3 py-6 sm:py-7';

export const POPUP_SERVICE_CARD_SCROLL_CLASS =
  'px-3 pb-3 max-h-[420px] overflow-y-auto ui-dropdown-scrollbar';

export const POPUP_VERSIONS_LIST_MAX_CLASS =
  'ui-dropdown-scrollbar p-2 space-y-1.5 max-h-[320px] overflow-y-auto';

/** 供单测：popup 导出类名不得含视口相对单位 */
export const POPUP_LAYOUT_CLASS_NAMES = [
  POPUP_BODY_CLASS,
  POPUP_ROOT_CLASS,
  POPUP_SCROLL_CLASS,
  POPUP_EMPTY_MIN_CLASS,
  POPUP_SERVICE_CARD_SCROLL_CLASS,
  POPUP_VERSIONS_LIST_MAX_CLASS,
] as const;
