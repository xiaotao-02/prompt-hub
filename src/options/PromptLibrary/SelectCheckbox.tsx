import * as React from 'react';
import { Check } from 'lucide-react';

export function SelectCheckbox({
  checked,
  onToggle,
  className = '',
}: {
  checked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <label
      className={`inline-flex cursor-pointer transition-opacity duration-200 pointer-events-auto ui-focus rounded-md ${
        checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
      } ${className}`}
      onClick={stop}
      title="选中此条"
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
        onClick={stop}
      />
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md backdrop-blur transition-all duration-150 ${
          checked
            ? 'scale-100 bg-violet-500 text-white shadow-sm ring-1 ring-violet-500'
            : 'scale-95 bg-white/85 text-white ring-1 ring-black/10 dark:bg-zinc-900/85 dark:ring-white/15 group-hover:scale-100'
        }`}
        aria-hidden
      >
        <Check
          className={`h-3.5 w-3.5 transition-opacity duration-150 ${
            checked ? 'opacity-100' : 'opacity-0'
          }`}
          strokeWidth={2.5}
        />
      </span>
    </label>
  );
}
