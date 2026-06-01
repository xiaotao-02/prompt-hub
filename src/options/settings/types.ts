import type { ProviderSetupRole } from '../ApiQuickSetup';

export type SettingsPanelId =
  | 'provider'
  | 'output'
  | 'strategy'
  | 'data'
  | 'updates';

export const SETTINGS_PANEL_STORAGE_KEY = 'options_settings_panel_v1';
export const PROVIDER_ROLE_SESSION_KEY = 'options_provider_role_v1';

export type ProviderRole = ProviderSetupRole;

export function isSettingsPanelId(v: string | null): v is SettingsPanelId {
  return (
    v === 'provider' ||
    v === 'output' ||
    v === 'strategy' ||
    v === 'data' ||
    v === 'updates'
  );
}

export const SETTINGS_PANEL_NAV: { id: SettingsPanelId; label: string }[] = [
  { id: 'provider', label: '模型与连接' },
  { id: 'output', label: '输出与交互' },
  { id: 'strategy', label: '策略版本' },
  { id: 'data', label: '数据与备份' },
  { id: 'updates', label: '扩展更新' },
];

export function settingsPanelNavButtonClass(active: boolean, compact: boolean) {
  const base =
    'transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900';
  const size = compact
    ? 'shrink-0 whitespace-nowrap px-3 py-1.5 text-xs rounded-lg'
    : 'w-full px-3 py-2 text-sm rounded-lg';
  const tone = active
    ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200 font-medium'
    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80';
  return `${base} ${size} ${tone}`;
}

export function readInitialPanelId(): SettingsPanelId {
  try {
    const raw = sessionStorage.getItem(SETTINGS_PANEL_STORAGE_KEY);
    if (raw === 'setup') return 'provider';
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
