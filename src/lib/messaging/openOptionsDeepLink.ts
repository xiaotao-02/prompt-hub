export interface OpenOptionsDeepLinkParams {
  tab?: 'settings' | 'library';
  focusId?: string;
  dock?: 'refine' | 'versions';
}

/** 打开扩展选项页；带参时拼 hash 深链并聚焦已有 options 标签 */
export function openOptionsDeepLink(params: OpenOptionsDeepLinkParams = {}): void {
  let { tab } = params;
  const { focusId, dock } = params;
  if (focusId && tab == null) {
    tab = 'library';
  }
  if (!tab && !focusId) {
    chrome.runtime.openOptionsPage();
    return;
  }
  const urlParams = new URLSearchParams();
  if (tab) urlParams.set('tab', tab);
  if (focusId) urlParams.set('focus', focusId);
  if (dock === 'refine' || dock === 'versions') urlParams.set('dock', dock);
  const optionsPath = 'src/options/index.html';
  const targetUrl = chrome.runtime.getURL(optionsPath) + '#' + urlParams.toString();
  const existingMatch = chrome.runtime.getURL(optionsPath) + '*';
  chrome.tabs.query({ url: existingMatch }, (tabs) => {
    const found = tabs[0];
    if (found?.id != null) {
      chrome.tabs.update(found.id, { url: targetUrl, active: true });
      if (found.windowId != null) {
        chrome.windows.update(found.windowId, { focused: true });
      }
    } else {
      chrome.tabs.create({ url: targetUrl });
    }
  });
}
