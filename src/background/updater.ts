import { refreshRemoteRuntimeConfigNow } from '@/lib/remoteRuntimeConfig';
import { getCurrentVersion } from '@/lib/updater';
import { requestBrowserExtensionUpdateCheck } from '@/lib/applyExtensionUpdate';
import { saveUpdateResult } from '@/lib/storage';
import type { UpdateCheckResult } from '@/lib/types';

export async function runUpdateCheck(): Promise<UpdateCheckResult> {
  void refreshRemoteRuntimeConfigNow().catch(() => undefined);
  const current = getCurrentVersion();
  const checkedAt = Date.now();
  try {
    const status = await requestBrowserExtensionUpdateCheck();
    const result: UpdateCheckResult = {
      hasUpdate: status === 'update_available',
      current,
      latest: null,
      checkedAt,
    };
    if (status === 'throttled') {
      result.error =
        '浏览器更新检查被限流，请稍后再试。也可打开 chrome://extensions（Edge：edge://extensions）手动检查「更新」。';
    }
    await saveUpdateResult(result);
    return result;
  } catch (e) {
    const result: UpdateCheckResult = {
      hasUpdate: false,
      current,
      latest: null,
      checkedAt,
      error: e instanceof Error ? e.message : String(e),
    };
    await saveUpdateResult(result);
    return result;
  }
}
