import type { ReactNode } from 'react';

export default function ConnectionFieldColumn({
  label,
  labelExtra,
  children,
}: {
  label: string;
  labelExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex h-7 items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
          {label}
        </span>
        {labelExtra ? <div className="min-w-0 shrink">{labelExtra}</div> : null}
      </div>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}
