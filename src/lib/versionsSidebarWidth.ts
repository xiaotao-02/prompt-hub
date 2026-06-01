export const VERSIONS_SIDEBAR_WIDTH_KEY = 'versionsSidebarWidth';
export const VERSIONS_SIDEBAR_WIDTH_MIN = 240;
export const VERSIONS_SIDEBAR_WIDTH_MAX = 520;
export const VERSIONS_SIDEBAR_WIDTH_DEFAULT = 280;

let cached: number | null = null;

export function clampVersionsSidebarWidth(px: number): number {
  return Math.round(Math.max(VERSIONS_SIDEBAR_WIDTH_MIN, Math.min(VERSIONS_SIDEBAR_WIDTH_MAX, px)));
}

export function getCachedVersionsSidebarWidth(): number {
  return cached ?? VERSIONS_SIDEBAR_WIDTH_DEFAULT;
}

export async function getVersionsSidebarWidth(
  key: string = VERSIONS_SIDEBAR_WIDTH_KEY,
  fallback: number = VERSIONS_SIDEBAR_WIDTH_DEFAULT,
): Promise<number> {
  try {
    const r = await chrome.storage.local.get(key);
    const v = r[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      const clamped = clampVersionsSidebarWidth(v);
      if (key === VERSIONS_SIDEBAR_WIDTH_KEY) cached = clamped;
      return clamped;
    }
  } catch {
    /* storage unavailable */
  }
  if (key === VERSIONS_SIDEBAR_WIDTH_KEY) cached = fallback;
  return fallback;
}

export async function setVersionsSidebarWidth(
  px: number,
  key: string = VERSIONS_SIDEBAR_WIDTH_KEY,
): Promise<void> {
  const clamped = clampVersionsSidebarWidth(px);
  if (key === VERSIONS_SIDEBAR_WIDTH_KEY) cached = clamped;
  try {
    await chrome.storage.local.set({ [key]: clamped });
  } catch {
    /* storage unavailable */
  }
}
