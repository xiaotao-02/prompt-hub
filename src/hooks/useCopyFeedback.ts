import { useCallback, useRef, useState } from 'react';
import { UI_COPY_FEEDBACK_MS } from '@/lib/uiFeedback';

/**
 * 复制成功反馈：统一 key 高亮时长，供 popup / 提示词库列表等 React 面复用。
 */
export function useCopyFeedback(durationMs = UI_COPY_FEEDBACK_MS) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(
    async (text: string, key: string) => {
      await navigator.clipboard.writeText(text);
      if (timerRef.current) clearTimeout(timerRef.current);
      setCopiedKey(key);
      timerRef.current = setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  return { copiedKey, onCopy };
}
