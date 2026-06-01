import { useCallback, useRef, useState } from 'react';
import { UI_ACTION_TIP_MS } from '@/lib/uiFeedback';

export type ActionTip = { ok: boolean; msg: string };

/**
 * 行内 / banner 操作结果提示：统一 auto-dismiss 时长。
 */
export function useActionTip(durationMs = UI_ACTION_TIP_MS) {
  const [actionTip, setActionTip] = useState<ActionTip | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTip = useCallback(
    (ok: boolean, msg: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setActionTip({ ok, msg });
      timerRef.current = setTimeout(() => {
        setActionTip(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  const clearTip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActionTip(null);
  }, []);

  return { actionTip, showTip, clearTip };
}
