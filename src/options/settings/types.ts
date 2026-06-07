import type { AppSettings } from '@/lib/types';
import type { ProviderSetupRole } from '../ApiQuickSetup';
import type { CommitSettingsOptions } from './hooks/useSettingsPersistence';

/** 设置子面板统一自动保存入口 */
export type CommitSettings = (next: AppSettings, options?: CommitSettingsOptions) => void;

export type SettingsPanelId = 'provider' | 'output' | 'interaction' | 'data' | 'updates';

export const SETTINGS_PANEL_STORAGE_KEY = 'options_settings_panel_v1';
export const PROVIDER_ROLE_SESSION_KEY = 'options_provider_role_v1';

export type ProviderRole = ProviderSetupRole;

export function isSettingsPanelId(v: string | null): v is SettingsPanelId {
  return (
    v === 'provider' || v === 'output' || v === 'interaction' || v === 'data' || v === 'updates'
  );
}

export const SETTINGS_PANEL_NAV: { id: SettingsPanelId; label: string }[] = [
  { id: 'provider', label: '内置服务 / 自定义 API' },
  { id: 'output', label: '输出' },
  { id: 'interaction', label: '交互' },
  { id: 'data', label: '数据与备份' },
  { id: 'updates', label: '扩展更新' },
];

export function settingsPanelNavButtonClass(active: boolean, compact: boolean) {
  const base =
    'relative transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900';
  const size = compact
    ? 'shrink-0 whitespace-nowrap px-3 py-1.5 text-xs rounded-lg'
    : 'w-full px-3 py-2 text-sm rounded-md';
  const accent = active
    ? compact
      ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200 font-medium'
      : 'bg-violet-50/80 dark:bg-violet-500/10 text-violet-700 dark:text-violet-200 font-medium before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-violet-500 dark:before:bg-violet-400'
    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80';
  return `${base} ${size} ${accent}`;
}

export function readInitialPanelId(): SettingsPanelId {
  try {
    const raw = sessionStorage.getItem(SETTINGS_PANEL_STORAGE_KEY);
    if (raw === 'setup') return 'provider';
    if (raw === 'platformAccount') return 'provider';
    if (raw === 'strategy') return 'output';
    if (isSettingsPanelId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return 'provider';
}

export function readInitialProviderRole(): ProviderRole {
  try {
    const r = sessionStorage.getItem(PROVIDER_ROLE_SESSION_KEY);
    if (r === 'refine') {
      sessionStorage.removeItem(PROVIDER_ROLE_SESSION_KEY);
      return 'refine';
    }
  } catch {
    /* ignore */
  }
  return 'extract';
}
