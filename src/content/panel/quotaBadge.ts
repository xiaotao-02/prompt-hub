import { PROVIDER_QUOTA_CACHE_KEY, SETTINGS_KEY } from '@/lib/storage/keys';
import { getCachedQuota } from '@/lib/quota/cache';
import { requestProviderQuota } from '@/lib/quota/messaging';
import type { ProviderQuotaSnapshot } from '@/lib/quota/types';
import { getSettings } from '@/lib/storage/settings';
import type { ProviderId } from '@/lib/types';

let activeProviderId: ProviderId | null = null;
let storageListenerBound = false;
let focusListenerBound = false;
let boundPanel: HTMLElement | null = null;

function quotaBadgeLabel(snap: ProviderQuotaSnapshot): string {
  if (snap.status === 'ok') return snap.label.replace(/\s+/g, '');
  if (snap.status === 'unsupported') return '控制台';
  if (snap.status === 'no_key') return '无 Key';
  if (snap.status === 'error') return '失败';
  return snap.label;
}

function applyQuotaBadgeDom(
  panel: HTMLElement,
  snap: ProviderQuotaSnapshot | null,
  loading = false,
) {
  const el = panel.querySelector<HTMLElement>('[data-role="quota-badge"]');
  if (!el) return;

  if (loading && !snap) {
    el.textContent = '…';
    el.classList.add('is-loading');
    el.classList.remove('is-low', 'is-error', 'is-muted');
    el.title = '正在查询额度…';
    return;
  }

  el.classList.remove('is-loading');
  if (!snap) {
    el.textContent = '';
    el.classList.add('hidden');
    return;
  }

  el.classList.remove('hidden', 'is-low', 'is-error', 'is-muted');
  if (snap.status === 'ok' && snap.lowBalance) el.classList.add('is-low');
  else if (snap.status === 'error') el.classList.add('is-error');
  else if (snap.status === 'unsupported' || snap.status === 'no_key') el.classList.add('is-muted');

  el.textContent = quotaBadgeLabel(snap);
  el.title = [
    snap.status === 'ok' ? `剩余 ${snap.label}` : snap.label,
    snap.detail,
    snap.error,
    '点击刷新额度',
  ]
    .filter(Boolean)
    .join(' · ');
}

export function ensureQuotaBadgeHost(panel: HTMLElement): void {
  if (panel.querySelector('[data-role="quota-badge"]')) return;
  const header = panel.querySelector('.header .title');
  if (!header) return;
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'badge quota-badge hidden';
  badge.setAttribute('data-role', 'quota-badge');
  badge.setAttribute('aria-label', 'API 剩余额度');
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    void refreshPanelQuotaBadge(panel, true);
  });
  header.appendChild(badge);
}

async function resolveActiveProvider(): Promise<ProviderId> {
  if (activeProviderId) return activeProviderId;
  const settings = await getSettings();
  activeProviderId = settings.activeProvider;
  return activeProviderId;
}

export async function refreshPanelQuotaBadge(
  panel: HTMLElement | null,
  force = false,
): Promise<void> {
  if (!panel) return;
  ensureQuotaBadgeHost(panel);

  const providerId = await resolveActiveProvider();
  if (!force) {
    const cached = await getCachedQuota(providerId);
    if (cached) {
      applyQuotaBadgeDom(panel, cached);
      return;
    }
  }

  applyQuotaBadgeDom(panel, null, true);
  const resp = await requestProviderQuota({ providerId, force: true });
  if (resp.ok) {
    applyQuotaBadgeDom(panel, resp.snapshot);
  } else {
    applyQuotaBadgeDom(panel, {
      providerId,
      status: 'error',
      label: '查询失败',
      error: resp.error,
      fetchedAt: Date.now(),
    });
  }
}

export function bindPanelQuotaStorageSync(panel: HTMLElement): void {
  if (storageListenerBound) return;
  storageListenerBound = true;
  boundPanel = panel;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(PROVIDER_QUOTA_CACHE_KEY in changes)) return;
    void refreshPanelQuotaBadge(panel, false);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !(SETTINGS_KEY in changes)) return;
    activeProviderId = null;
    void refreshPanelQuotaBadge(panel, false);
  });


  if (!focusListenerBound) {
    focusListenerBound = true;
    const onFocusRefresh = () => {
      if (!boundPanel) return;
      void refreshPanelQuotaBadge(boundPanel, true);
    };
    window.addEventListener('focus', onFocusRefresh);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocusRefresh();
    });
  }
}

export function resetPanelQuotaProviderCache(): void {
  activeProviderId = null;
}
