/**
 * 跨入口的状态反馈约定：时长、禁用策略、toast 语义。
 */

/** 复制成功高亮持续时间（popup / library / panel 统一） */
export const UI_COPY_FEEDBACK_MS = 1200;

/** 操作结果 tip 自动消失（library / settings 子面板等） */
export const UI_ACTION_TIP_MS = 2000;

/** 设置保存成功 banner（SettingsView 内短暂提示） */
export const UI_SAVED_TOAST_MS = 2000;

/** panel 内 DOM 按钮 flashCopied 默认文案（与 React 侧 UI_ACTION.copied 一致） */
export const UI_COPIED_LABEL = '已复制';
