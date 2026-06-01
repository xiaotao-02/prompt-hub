import { cropTabCaptureToJpeg } from '@/lib/regionCaptureCrop';
import type { RegionCaptureConfirmPayload } from '@/lib/types';
import { postToTab } from './tabMessaging';

export async function relayRegionCaptureToFocusedWebTab(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id || !tab.url) {
      return { ok: false, error: '当前没有可用的网页标签页' };
    }
    if (!/^(https?:|file:|ftp:)/.test(tab.url)) {
      return { ok: false, error: '仅支持网页或本地文件页面使用区域截图' };
    }
    postToTab(tab.id, { type: 'START_REGION_CAPTURE', payload: {} });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function handleRegionCaptureConfirm(
  tabId: number,
  p: RegionCaptureConfirmPayload,
): Promise<void> {
  let tabObj: chrome.tabs.Tab;
  try {
    tabObj = await chrome.tabs.get(tabId);
  } catch {
    return;
  }
  if (tabObj.windowId == null) return;
  let png: string;
  try {
    png = await chrome.tabs.captureVisibleTab(tabObj.windowId, { format: 'png' });
  } catch (err) {
    console.warn('[PromptHub] captureVisibleTab failed', err);
    return;
  }
  const jpeg = await cropTabCaptureToJpeg(png, p);
  if (!jpeg) return;
  postToTab(tabId, { type: 'PANEL_APPEND_REFERENCE', payload: { imageUrl: jpeg } });
}
