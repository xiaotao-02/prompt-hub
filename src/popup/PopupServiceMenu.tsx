import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnchoredMenuPanel, cx } from '@/components/ui';
import PopupServicePane from './servicePanes/PopupServicePane';
import type { PopupServiceState } from './servicePanes/usePopupService';

type Props = PopupServiceState;

const MENU_WIDTH = 420;

export default function PopupServiceMenu(props: Props) {
  const { settings, summary, headerSummary, isConfigured } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!settings) return null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={summary}
        className={cx(
          'inline-flex max-w-[11rem] min-w-0 shrink-0 items-center gap-1.5 h-7 px-2 text-[11px] rounded-lg border font-medium transition',
          isConfigured
            ? 'border-violet-200/90 bg-violet-50/80 text-violet-800 hover:bg-violet-100/90 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/50'
            : 'border-amber-200/90 bg-amber-50/80 text-amber-900 hover:bg-amber-100/90 dark:border-amber-800/50 dark:bg-amber-950/35 dark:text-amber-200 dark:hover:bg-amber-900/45',
        )}
      >
        <span className="truncate min-w-0 flex-1">{headerSummary}</span>
        <ChevronDown
          className={cx('w-3 h-3 flex-none opacity-80 ui-chevron-spring', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      <AnchoredMenuPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        rootRef={rootRef}
        panelRef={menuRef}
        gap={6}
        preferredMaxHeight={720}
        align="center"
        fixedWidth={MENU_WIDTH}
        fitContent
        role="dialog"
        aria-label="服务设置"
        className="z-[2147483600] flex flex-col shadow-xl shadow-black/25 ring-1 ring-zinc-200/80 dark:ring-zinc-700/80 p-0"
        ignoreNestedAnchoredDropdown
      >
        <div className="min-h-[320px] p-3.5">
          <PopupServicePane {...props} onSaved={() => setOpen(false)} />
        </div>
      </AnchoredMenuPanel>
    </div>
  );
}
