export type VersionsListDensity = 'comfortable' | 'compact';

const DEFAULT_KEY = 'versionsListDensity';
export const POPUP_DENSITY_KEY = 'versionsListDensity:popup';

let cached: VersionsListDensity | null = null;

export function getCachedVersionsListDensity(): VersionsListDensity {
  return cached ?? 'comfortable';
}

export function previewMaxLen(
  density: VersionsListDensity,
  surface: 'panel' | 'popup' = 'panel',
): number {
  if (surface === 'popup') {
    return density === 'compact' ? 56 : 80;
  }
  return density === 'compact' ? 72 : 120;
}

export function toggleVersionsListDensity(current: VersionsListDensity): VersionsListDensity {
  return current === 'compact' ? 'comfortable' : 'compact';
}

export async function getVersionsListDensity(
  key: string = DEFAULT_KEY,
  fallback: VersionsListDensity = 'comfortable',
): Promise<VersionsListDensity> {
  try {
    const r = await chrome.storage.local.get(key);
    const v = r[key];
    if (v === 'compact' || v === 'comfortable') {
      if (key === DEFAULT_KEY) cached = v;
      return v;
    }
  } catch {
    /* storage unavailable */
  }
  if (key === DEFAULT_KEY) cached = fallback;
  return fallback;
}

export async function setVersionsListDensity(
  density: VersionsListDensity,
  key: string = DEFAULT_KEY,
): Promise<void> {
  if (key === DEFAULT_KEY) cached = density;
  try {
    await chrome.storage.local.set({ [key]: density });
  } catch {
    /* storage unavailable */
  }
}
