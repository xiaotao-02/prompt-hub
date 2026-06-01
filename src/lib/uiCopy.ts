/**
 * 跨 popup / options / content panel / 提示词库浮层的产品文案与术语。
 * 同一概念在所有入口使用相同中文，避免「面板 / 弹窗 / 插件面板」混用。
 */

/** 各入口的产品名称（固定映射，勿随意同义替换） */
export const UI_SURFACE = {
  /** 浏览器工具栏 action popup */
  popup: '工具栏弹窗',
  /** chrome-extension options 页整体 */
  options: '选项页',
  /** options 内「提示词库」Tab */
  library: '提示词库',
  /** 注入网页的 content script 浮动面板 */
  contentPanel: '网页浮动面板',
  /** options 内挂载 content panel 样式的编辑浮层 */
  libraryPanel: '提示词库编辑',
} as const;

/** 全局导航与 header 动作 */
export const UI_NAV = {
  openLibrary: '提示词库',
  openLibraryTitle: '打开选项页的提示词库',
  openLibraryAria: '打开提示词库',
  openSettings: '设置',
  openSettingsTitle: '打开选项页的设置',
  openWebsite: 'GitHub',
  openWebsiteTitle: '打开 Prompt Hub 开源仓库',
  regionCapture: '截取',
  regionCaptureTitle:
    '在网页上框选矩形区域后加入参考列表（右键被站点接管时使用）· 快捷键 Ctrl+Shift+E',
} as const;

/** 历史条目 / 提示词卡片上的操作 */
export const UI_ACTION = {
  copy: '复制',
  copied: '已复制',
  edit: '编辑',
  editTitle: '编辑（默认打开提示词库；可在「设置」中改为网页浮动面板）',
  refine: 'AI 调整',
  refineTitle: 'AI 调整（默认在提示词库；可在设置中改为网页浮动面板）',
  versions: '版本',
  recallToPanel: '浮动面板',
  recallToPanelTitle: '把这条提示词召回到来源网页的浮动面板，继续编辑或 AI 调整',
  delete: '删除',
  deleteTitle: '删除此条',
  jumpToOriginal: '跳转到原图',
  jumpToOriginalTitle: '跳转到原图页面，并在该页面打开网页浮动面板',
  saveSettings: '保存设置',
  savedSettings: '已保存',
  configureApiKey: '配置 API Key',
  configureApiKeyTitle: '打开设置页并定位到模型与 API Key',
} as const;

/** 空状态与引导 */
export const UI_EMPTY = {
  noHistoryTitle: '还没有任何记录',
  noHistoryHint: '在任意网页上右键点击图片，选择「🎨 提取图片提示词」开始使用',
  openLibraryCta: '打开提示词库',
  openLibraryCtaTitle: '打开选项页的提示词库',
} as const;

/** 设置页「输出与交互」说明（与 UI_SURFACE 术语一致） */
export const UI_SETTINGS_COPY = {
  popupToolbarSection: '工具栏弹窗里的「编辑 / AI 调整」',
  popupToolbarHelp:
    '工具栏弹窗里的「编辑 / AI 调整」：选择打开提示词库（选项页）还是在网页浮动面板中继续编辑。选浮动面板时会尝试激活该条记录的来源页。「版本」始终在工具栏弹窗内展开历史列表，不受此项影响。',
  popupActionLibraryLabel: '打开提示词库',
  popupActionLibraryDesc: '大图编辑与 AI 调整在选项页「提示词库」中；历史版本在工具栏弹窗内查看',
  popupActionPanelLabel: '在网页浮动面板中打开',
  popupActionPanelDesc:
    '在来源网页上的浮动面板中编辑，并按按钮展开主编辑区与 AI 调整；历史版本仍在工具栏弹窗内查看',
  panelAutofocusTitle: '网页浮动面板自动聚焦编辑器',
  panelAutofocusDesc: '面板打开或反推结束时将焦点移到编辑区；关闭后尽量不抢走网页内焦点',
} as const;
