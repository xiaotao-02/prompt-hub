/**
 * 扩展页（--ui-*）与 content panel Shadow DOM（--pe-*）的单一 token 源。
 * 改色 / 圆角 / 动效时请只改本文件，并同步检查：
 * - src/content/panel/tokens.ts（由 buildPanelThemeCss 生成）
 * - src/styles/globals.css（:root --ui-*，数值须与本文件一致）
 */

export type UiThemeMode = 'light' | 'dark';

export type UiSemanticColors = {
  bg: string;
  bgMuted: string;
  bgElevated: string;
  surface: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  info: string;
  success: string;
  warning: string;
  danger: string;
  focus: string;
  successSoft: string;
  dangerSoft: string;
  warningSoft: string;
  shadowSm: string;
  shadowMd: string;
  shadowPanel: string;
};

export type UiMotionTokens = {
  radius: string;
  radiusLg: string;
  collapseDuration: string;
  collapseEase: string;
  durationFast: string;
  durationBase: string;
  durationSlow: string;
  easeStandard: string;
  easeSpring: string;
};

const MOTION: UiMotionTokens = {
  radius: '8px',
  radiusLg: '12px',
  collapseDuration: '220ms',
  collapseEase: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)',
  durationFast: '120ms',
  durationBase: '180ms',
  durationSlow: '300ms',
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easeSpring: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)',
};

/** 亮色主题语义色（扩展页与面板共用数值） */
export const UI_THEME_LIGHT: UiSemanticColors = {
  bg: '#f8fafc',
  bgMuted: '#f4f4f5',
  bgElevated: '#ffffff',
  surface: 'rgba(255, 255, 255, 0.94)',
  text: '#18181b',
  textMuted: '#52525b',
  textSubtle: '#71717a',
  border: '#e4e4e7',
  borderStrong: '#d4d4d8',
  accent: '#6d28d9',
  accentHover: '#7c3aed',
  accentSoft: '#f5f3ff',
  info: '#0369a1',
  success: '#059669',
  warning: '#b45309',
  danger: '#dc2626',
  focus: 'rgba(109, 40, 217, 0.24)',
  successSoft: '#ecfdf5',
  dangerSoft: '#fff1f2',
  warningSoft: '#fffbeb',
  shadowSm: '0 1px 2px rgba(15, 23, 42, 0.05)',
  shadowMd: '0 10px 30px -18px rgba(15, 23, 42, 0.35)',
  shadowPanel: '0 24px 70px -18px rgba(15, 23, 42, 0.36), 0 8px 20px rgba(15, 23, 42, 0.12)',
};

/** 暗色主题语义色 */
export const UI_THEME_DARK: UiSemanticColors = {
  bg: '#09090b',
  bgMuted: '#27272a',
  bgElevated: '#18181b',
  surface: 'rgba(39, 39, 42, 0.86)',
  text: '#f4f4f5',
  textMuted: '#d4d4d8',
  textSubtle: '#a1a1aa',
  border: '#27272a',
  borderStrong: '#3f3f46',
  accent: '#a78bfa',
  accentHover: '#c4b5fd',
  accentSoft: 'rgba(139, 92, 246, 0.16)',
  info: '#7dd3fc',
  success: '#6ee7b7',
  warning: '#fbbf24',
  danger: '#fda4af',
  focus: 'rgba(167, 139, 250, 0.28)',
  successSoft: 'rgba(16, 185, 129, 0.14)',
  dangerSoft: 'rgba(244, 63, 94, 0.14)',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.18)',
  shadowMd: '0 12px 34px -18px rgba(0, 0, 0, 0.65)',
  shadowPanel: '0 28px 80px -18px rgba(0, 0, 0, 0.62), 0 8px 24px rgba(0, 0, 0, 0.30)',
};

/** 面板专用：半透明背景（与扩展页实色背景区分，但色相同源） */
const PANEL_BG_LIGHT = {
  bg: 'rgba(255, 255, 255, 0.97)',
  bgMuted: 'rgba(248, 250, 252, 0.92)',
  surface: 'rgba(255, 255, 255, 0.94)',
  border: 'rgba(24, 24, 27, 0.10)',
  borderStrong: 'rgba(24, 24, 27, 0.16)',
  accentSoft: 'rgba(109, 40, 217, 0.10)',
};

const PANEL_BG_DARK = {
  bg: 'rgba(24, 24, 27, 0.96)',
  bgMuted: 'rgba(39, 39, 42, 0.88)',
  surface: 'rgba(39, 39, 42, 0.86)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  accentSoft: 'rgba(167, 139, 250, 0.16)',
};

function panelVars(mode: UiThemeMode): Record<string, string> {
  const base = mode === 'light' ? UI_THEME_LIGHT : UI_THEME_DARK;
  const panel = mode === 'light' ? PANEL_BG_LIGHT : PANEL_BG_DARK;
  return {
    '--pe-bg': panel.bg,
    '--pe-bg-muted': panel.bgMuted,
    '--pe-surface': panel.surface,
    '--pe-text': base.text,
    '--pe-text-muted': base.textMuted,
    '--pe-text-subtle': base.textSubtle,
    '--pe-border': panel.border,
    '--pe-border-strong': panel.borderStrong,
    '--pe-accent': base.accent,
    '--pe-accent-hover': base.accentHover,
    '--pe-accent-soft': panel.accentSoft,
    '--pe-info': base.info,
    '--pe-success': base.success,
    '--pe-warning': base.warning,
    '--pe-danger': base.danger,
    '--pe-focus': base.focus,
    '--pe-radius': MOTION.radius,
    '--pe-radius-lg': MOTION.radiusLg,
    '--pe-shadow': base.shadowPanel,
    '--pe-collapse-duration': MOTION.collapseDuration,
    '--pe-collapse-ease': MOTION.collapseEase,
    '--pe-duration-fast': MOTION.durationFast,
    '--pe-duration-base': MOTION.durationBase,
    '--pe-duration-slow': MOTION.durationSlow,
    '--pe-ease-standard': MOTION.easeStandard,
    '--pe-ease-spring': MOTION.easeSpring,
  };
}

function cssBlock(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}

/** 注入 content panel Shadow DOM 的 :host token 块 */
export function buildPanelThemeCss(): string {
  return [
    cssBlock(':host', panelVars('light')),
    '@media (prefers-color-scheme: dark) {',
    cssBlock('  :host', panelVars('dark')),
    '}',
  ].join('\n');
}

export const UI_MOTION = MOTION;
