/**
 * 「立即更新」：请求浏览器侧扩展更新（Chrome Web Store 渠道）；
 * 无法在浏览器内应用时仅返回说明文案。
 */
import type { ApplyExtensionUpdateResult } from './types';

export async function requestBrowserExtensionUpdateCheck(): Promise<
  'throttled' | 'no_update' | 'update_available'
> {
  return new Promise((resolve, reject) => {
    chrome.runtime.requestUpdateCheck((status) => {
      const lastErr = chrome.runtime.lastError;
      if (lastErr?.message) {
        reject(new Error(lastErr.message));
        return;
      }
      resolve(status);
    });
  });
}

export async function applyStoreExtensionUpdate(): Promise<ApplyExtensionUpdateResult> {
  const status = await requestBrowserExtensionUpdateCheck();
  if (status === 'update_available') {
    return { applied: true, willReload: true };
  }
  if (status === 'throttled') {
    return {
      applied: false,
      reason: 'throttled',
      message:
        '浏览器更新检查被限流，请稍后再试。也可打开 chrome://extensions（Edge：edge://extensions）查看扩展是否有「更新」。',
    };
  }
  return {
    applied: false,
    reason: 'already_latest',
  };
}

/** @deprecated 闭源后不再使用 GitHub Release 作为更新源；保留供测试与历史兼容。 */
export async function applyExtensionUpdateFromFeed(
  feedUrl: string,
): Promise<ApplyExtensionUpdateResult> {
  void feedUrl;
  return applyStoreExtensionUpdate();
}
