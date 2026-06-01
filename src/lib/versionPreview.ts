const SAME_AS_REFERENCE_LABEL = '与上一版相同';

export function normalizePromptForPreview(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** 两串（已 normalize）最长公共前缀长度 */
export function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) i++;
  return i;
}

/**
 * 历史版本列表预览：相对「上一条（更新）版本」跳过相同开头，只展示变化段。
 * referencePrompt 为 undefined 时退回正文前 maxLen 字。
 */
export function versionListPreviewText(
  prompt: string,
  referencePrompt: string | undefined,
  maxLen: number,
): { text: string; truncated: boolean } {
  const normalized = normalizePromptForPreview(prompt);
  if (!referencePrompt) {
    const text = normalized.slice(0, maxLen);
    return {
      text,
      truncated: normalized.length > maxLen,
    };
  }

  const ref = normalizePromptForPreview(referencePrompt);
  const prefixLen = commonPrefixLength(normalized, ref);
  const diff = normalized.slice(prefixLen);

  if (!diff) {
    return { text: SAME_AS_REFERENCE_LABEL, truncated: false };
  }

  const headEllipsis = prefixLen > 0;
  const body = diff.slice(0, maxLen);
  const truncated = diff.length > maxLen;
  const text = `${headEllipsis ? '…' : ''}${body}`;
  return { text, truncated };
}

/** 列表第 i 条版本应对照的「上一条（更新）」正文 */
export function versionListReferencePrompt(
  versions: { prompt: string }[],
  index: number,
): string | undefined {
  if (index === 0) return versions[1]?.prompt;
  return versions[index - 1]?.prompt;
}
