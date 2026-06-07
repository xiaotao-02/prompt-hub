import { useState, type ReactNode } from 'react';
import { Collapsible } from '@/components/ui';

export interface HelpDisclosureProps {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * 统一的「需要帮助？」折叠块。
 */
export function HelpDisclosure({
  title = '需要帮助？',
  children,
  defaultOpen = false,
}: HelpDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="text-zinc-400">{open ? '−' : '+'}</span>
      </button>
      <Collapsible open={open}>
        <div className="space-y-3 border-t border-zinc-200 px-3 py-3 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {children}
        </div>
      </Collapsible>
    </div>
  );
}
