import { Search, X } from 'lucide-react';
import { EmptyGuide } from '@/components/EmptyGuide';

export function NoMatchState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyGuide
      title="没有匹配的记录"
      description="试试换个关键词，或者清除当前筛选"
      icon={Search}
      iconVariant="plain"
      bordered
      compact
      align="content"
      action={
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition"
        >
          <X className="w-3.5 h-3.5" /> 清除筛选
        </button>
      }
    />
  );
}
